import { isNullish } from "@/utilities/utils";

const defaultConstraints = {
    "regex"(value) {
        const regexp = new RegExp(value);
        return {
            test: v => regexp.test(v)
        };
    },
    "bool"() {
        return {
            test: v => /^(?:true|false)$/i.test(v),
            transform: v => v.length === 4
        };
    },
    "int"() {
        return {
            test: v => /^\d+$/.test(v),
            transform: v => +v
        };
    },
    "number"() {
        return {
            test: v => /^[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?$/.test(v) && isFinite(parseFloat(v)),
            transform: v => parseFloat(v)
        };
    },
    "alpha"() {
        return {
            test: v => /^[a-z]+$/i.test(v)
        };
    },
    "min"(value) {
        return {
            test: v => v >= +value
        };
    },
    "max"(value) {
        return {
            test: v => v <= +value
        };
    },
    "range"(value) {
        let [a, b] = value.split(",", 2).map(v => v.trim());
        return {
            test: v => v >= +a && v <= +b
        };
    },
    "length"(value) {
        return {
            test: v => v.length === +value
        };
    },
    "minlength"(value) {
        return {
            test: v => v.length >= +value
        };
    },
    "maxlength"(value) {
        return {
            test: v => v.length <= +value
        };
    },
};

export class RoutePattern {
    #regex;
    #template;
    #segments;
    #parameters;
    #constraints;

    get template() {
        return this.#template;
    }

    get regex() {
        return this.#regex;
    }

    get constraints() {
        return this.#constraints;
    }

    constructor(template, constraints = null) {
        this.#template = template;
        this.#regex = build(
            template,
            this.#segments = [],
            this.#parameters = new Map(),
            this.#constraints = constraints ?? {}
        );
    }

    match(path) {
        let result = this.#regex.exec(path);

        if (isNullish(result)) {
            return null;
        }

        result = result.groups ?? {};

        for (let [name, parameter] of this.#parameters.entries()) {
            let value = result[name];

            if (isNullish(value) && isNullish(parameter.default)) {
                continue;
            }

            value
                || isNullish(parameter.default)
                || (value = parameter.default);

            const values = parameter.catchAll
                ? value.split("/").filter(v => v.length)
                : [value];

            for (let i = 0; i < values.length; i++) {
                for (let constraint of parameter.constraints) {
                    if (constraint.test && !constraint.test(values[i])) {
                        return null;
                    }

                    if (constraint.transform) {
                        values[i] = constraint.transform(values[i]);
                    }
                }
            }

            result[name] = parameter.catchAll ? values : values[0];
        }

        return result;
    }

    resolve(values) {
        values = new Map(Object.entries(values));
        const segments = [];

        for (let segment of this.#segments) {
            const parts = [];

            for (let part of segment.parts) {
                if (part.kind === "literal") {
                    parts.push(part.value);
                }
                else {
                    let value = values.get(part.name);
                    values.delete(part.name);

                    if (isNullish(value) || value === "") {
                        value = this.#parameters.get(part.name)?.default;
                        if (part.catchAll && value) {
                            value = value.split("/");
                        }
                    }

                    if (isNullish(value) || value === "") {
                        if (part.required) {
                            return null;
                        }

                        // TODO @rameel: check twice
                        if (part.optional && part.default === value) {
                            continue;
                        }
                    }

                    if (part.catchAll) {
                        Array.isArray(value) || (value = [value]);
                        parts.push(...value.map(v => encodeURIComponent(v)).join("/"));
                    }
                    else {
                        parts.push(encodeURIComponent(value));
                    }
                }
            }

            parts.length && segments.push(parts.join(""));
        }

        let queries = [...values.entries()].map(([k, v]) => encodeURIComponent(k) + "=" + encodeURIComponent(v)).join("&");
        queries && (queries = "?" + queries);

        const result = segments.join("/") + queries;
        return result[0] !== "/"
            ? "/" + result
            : result;
    }
}

function build(pattern, segments, parameters, constraints) {
    segments.push(...parse(pattern, constraints));

    let expression = segments.map(segment => {
        return segment.parts.map((part, index) => {
            if (part.kind === "literal") {
                return index ? part.value : `/${ part.value }`;
            }

            parameters.set(part.name, part);

            if (segment.parts.length === 1 && part.quantifier === "?") {
                return `(?:/(?<${ part.name }>[^/]+?))?`;
            }

            if (part.catchAll) {
                let expr = `(?<${ part.name }>.${ part.quantifier })`;
                index || (expr = `(?:/${ expr })`);
                part.quantifier === "*" && (expr += "?");
                return part.quantifier === "*" ? expr + "?" : expr;
            }
            else {
                const expr = `(?<${ part.name }>[^/]+?)${ part.quantifier }`;
                return index ? expr : `/${ expr }`;
            }
        }).join("");
    }).join("") || "/";

    expression !== "/" && (expression += "/?");
    return new RegExp(`^${ expression }$`);
}

function parse(pattern, factories) {
    return preprocess(segments());

    function preprocess(segments) {
        segments.find(s => s.parts.length > 1 && s.parts.every(p => p.optional))
            && throwError("Using all segment parameters as optional is not permitted");

        const parameters = new Map;

        segments.flatMap(s => s.parts).forEach((part, index, parts) => {
            if (part.kind === "literal" && part.value.indexOf("?") >= 0) {
                throwError("Literal segments cannot contain the '?' character");
            }

            if (part.kind === "parameter") {
                if (part.catchAll && index !== parts.length - 1) {
                    throwError("A catch-all parameter can only appear as the last segment");
                }

                if (parameters.has(part.name)) {
                    throwError(`The route parameter name '${part.name}' appears more than one time`);
                }

                part.quantifier === "*"
                    && isNullish(part.default)
                    && (part.default = "");

                part.default === ""
                    && part.quantifier !== "*"
                    && (part.default = null);

                parameters.set(part.name, true);

                part.constraints.forEach(constraint => {
                    const factory = factories?.[name] ?? defaultConstraints[constraint.name];

                    if (isNullish(factory)) {
                        throwError(`Unknown constraint '${ constraint.name }'`);
                    }

                    Object.assign(constraint, factory(constraint.argument));
                });
            }
        });

        return segments;
    }

    function segments() {
        const segments = [];

        for (let i = 0; i < pattern.length;) {
            const r = segment(i);
            r.template && segments.push(r);
            i += r.template.length + 1;
        }

        return segments;
    }

    function segment(p) {
        let parts = [];
        let index = p;

        while (index < pattern.length && pattern[index] !== "/") {
            const part = literal(index) || parameter(index);
            parts.push(part);

            index += part.template.length;
        }

        return {
            template: pattern.slice(p, index),
            parts: parts
        }
    }

    function constraints(text, p) {
        const array = [];

        for (let i = p; i < text.length;) {
            if (text[i] !== ":") {
                throwError();
            }

            const name = constraintName(text.slice(i + 1));
            i += name.length + 1;

            const argument = text[i] === "("
                ? extract(i, text)
                : null;

            isNullish(argument) || (i += argument.length + 2);

            if (!name && !argument) {
                throwError();
            }

            array.push({
                name: name === ""
                    ? "regex"
                    : name === "="
                        ? "default"
                        : name,
                argument: argument ?? ""
            });

        }

        return array;
    }

    function parameter(p) {
        if (pattern[p] !== "{") {
            return null;
        }

        const value = extract(p);
        const paramName = parameterName(value);
        const template = pattern.slice(p, p + value.length + 2);
        const quantifier = (() => {
            const q = value[paramName.length];
            return q === "*"
                || q === "+"
                || q === "?" ? q : "";
        })();
        const list = constraints(value, paramName.length + quantifier.length);

        return {
            kind: "parameter",
            template: template,
            name: paramName,
            quantifier: quantifier,
            constraints: list.filter(c => c.name !== "default"),
            default: list.find(c => c.name === "default")?.argument,
            required: quantifier === "+" || quantifier === "",
            optional: quantifier === "?" || quantifier === "*",
            catchAll: quantifier === "+" || quantifier === "*"
        };
    }

    function literal(p) {
        for (let i = p;; i++) {
            if (i >= pattern.length
                || pattern[i] === "/"
                || pattern[i] === "{") {
                if (i === p) {
                    return null;
                }

                const template = pattern.slice(p, i);
                return {
                    kind: "literal",
                    template: template,
                    value: template
                };
            }
        }
    }

    function extract(p, s) {
        s ??= pattern;
        const stack = [];

        loop: for (let i = p; i < s.length; i++) {
            switch (s[i]) {
                case "{": stack.push("}"); break;
                case "(": stack.push(")"); break;
                case "}":
                case ")":
                    if (stack.pop() !== s[i]) break loop;
                    break;
            }

            if (stack.length === 0) {
                return s.slice(p + 1, i);
            }
        }

        throwError();
    }

    function parameterName(value) {
        const r = value.match(/^(?<name>[a-z_$][a-z0-9_$-]*?)(?:[:?+*]|$)/i)?.groups?.name;
        if ((r?.length ?? -1) < 0) {
            throwError("Invalid parameter name");
        }
        return r;
    }

    function constraintName(value) {
        const r = value.match(/^(?<name>=|[a-z0-9_$]*)(?=[/:(]|$)/i)?.groups?.name;
        if ((r?.length ?? -1) < 0) {
            throwError("Invalid constraint name");
        }

        return r;
    }

    function throwError(message = "Invalid pattern") {
        throw new Error(`${ message }: ${ pattern }`);
    }
}
