import { isNullish } from "@/utilities/utils";

const factories = {
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

export function normalizePath(path) {
    if (path === "" || path === "/") {
        return "/";
    }

    return "/" + path
        .trim()
        .split("/")
        .filter(s => s.length)
        .join("/");
}

export function createMatcher(pattern) {
    const parameters = new Map();
    const regex = build(pattern, parameters);

    return (path, normalize = true) => {
        normalize && (path = normalizePath(path));
        let result = regex.exec(path);
        if (isNullish(result)) {
            return null;
        }

        result = result.groups ?? {};

        for (let [name, parameter] of parameters.entries()) {
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
                for (let c of parameter.constraints) {
                    if (c.test && !c.test(values[i])) {
                        return null;
                    }

                    c.transform && (values[i] = c.transform(values[i]));
                }
            }

            result[name] = parameter.catchAll ? values : values[0];
        }

        return result;
    };
}

function build(pattern, parameters) {
    let expression = parse(pattern).map(segment => {
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

function parse(pattern) {
    return preprocess(segments());

    function preprocess(segments) {
        const parameters = new Map();

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            const parts   = segment.parts;

            for (let j = 0; j < parts.length; j++) {
                const part = parts[j];
                switch (part.kind) {
                    case "literal":
                        part.value.indexOf("?") >= 0
                            && throwError("Literal segments cannot contain the '?' character");
                        break;

                    default:
                        parts.length > 1
                            && parts.every(p => p.optional)
                            && throwError("Using all segment parameters as optional is not permitted");

                        const idx = parts.findIndex(p => p.catchAll);
                        idx < 0
                            || i === segments.length - 1 && idx === parts.length - 1
                            || throwError("A catch-all parameter can only appear as the last segment");

                        parameters.has(part.name)
                            && throwError(`The route parameter name '${part.name}' appears more than one time`);

                        part.catchAll
                            && isNullish(part.default)
                            && (part.default = "");

                        parameters.set(part.name, true);

                        part.constraints.forEach(c => {
                            const factory = window.routes?.constraints?.[c.name] ?? factories[c.name];
                            if (isNullish(factory)) {
                                throwError(`Unknown constraint '${ c.name }'`);
                            }

                            const obj = factory(c.argument);
                            c.test = obj.test;
                            c.transform = obj.transform;
                        });
                        break;
                }
            }
        }

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
