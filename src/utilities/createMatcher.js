import { isNullish } from "./utils";

let factories = {
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
    const info = new Map();
    let expression = normalizePath(pattern)
        .split("/")
        .filter(s => s.length)
        .map(segment => [...tokenize(segment)])
        .map((tokens, index, list) => {
            if (tokens.length > 1 && tokens.every(t => t.optional)) {
                throw new Error(`Using all segment parameters as optional is not permitted in ${ pattern }`);
            }

            const catchAllIndex = tokens.findIndex(t => t.catchAll);
            if (index !== list.length - 1 && catchAllIndex >= 0
                || catchAllIndex >= 0 && catchAllIndex !== tokens.length - 1) {
                throw new Error(`'Catch-all' parameter is not permitter in the middle in ${ pattern }`);
            }

            return tokens.map((t, i) => {
                // literal
                if (!t.name) {
                    return i ? t : `/${ t }`;
                }

                info.set(t.name, t);

                if (tokens.every(t => t.quantifier === "?")) {
                    return `(?:/(?<${ t.name }>[^/]+?))?`;
                }

                let expr;

                if (t.catchAll) {
                    expr = `(?<${ t.name }>.${ t.quantifier })`;
                    i || (expr = `(?:/${ expr })`);
                    t.quantifier === "*" && (expr += "?");
                    return expr;
                }

                expr = `(?<${ t.name }>[^/]+?)${ t.quantifier }`;
                return i ? expr : `/${ expr }`;
            }).join("");
        }).join("") || "/";

    expression !== "/" && (expression += "/?");
    const regexp = new RegExp(`^${ expression }$`);

    return (path, normalize = true) => {
        normalize && (path = normalizePath(path));

        let result = regexp.exec(path);
        if (isNullish(result)) {
            return null;
        }

        result = result.groups ?? {};

        for (let [name, token] of info.entries()) {
            let value = result[name];

            if (isNullish(value)) {
                if (isNullish(token.default)) {
                    continue;
                }

                value = token.default;
            }

            if (token.catchAll && value === "") {
                isNullish(token.default) || (value = token.default);
            }

            const list = token.catchAll
                ? value.split("/").filter(v => v.length)
                : [value];

            for (let i = 0; i < list.length; i++) {
                for (let c of token.constraints) {
                    if (c.test && !c.test(list[i])) {
                        return null;
                    }

                    c.transform && (list[i] = c.transform(list[i]));
                }
            }

            result[name] = token.catchAll ? list : list[0];
        }

        return result;
    };
}

function *tokenize(segment) {
    function throwError() {
        throw new Error(`Invalid parameter definition in '${ segment }'`);
    }

    function parseName(value) {
        return value.match(/^(?<name>[=a-z_$][0-9a-z_$-]*)/i)?.groups?.name ?? "";
    }

    function *constraints(pattern) {
        function parse(i) {
            let name = parseName(pattern.slice(i + 1));
            let p = i + 1 + name.length;
            let value = "";
            let stack = 0;

            for (;p < pattern.length; p++) {
                if (pattern[p] === "(") {
                    stack++;
                    continue;
                }

                if (pattern[p] === ")" && --stack === 0) {
                    value = pattern.slice(i + name.length + 2, p++);
                    break;
                }

                if (stack <= 0) {
                    break;
                }
            }

            if (!value && !name || stack) {
                return throwError();
            }

            name ||= "regex";
            name === "=" && (name = "default");

            const constraint = (() => {
                if (name === "default") {
                    return { default: value };
                }

                let factory = window.routes?.constraints?.[name] ?? factories[name]
                if (factory) {
                    return factory(value);
                }

                throw new Error(`Unknown constraint '${ name }'`);
            })();

            constraint.name = name;
            constraint.pattern = pattern.slice(i + 1, p);

            return constraint;
        }

        let contraint;

        for (let i = 0; i < pattern.length; i += contraint.pattern.length + 1) {
            pattern[i] !== ":" && throwError();

            contraint = parse(i);
            yield contraint;
        }
    }

    function parseToken(pattern) {
        // {id}
        // {id:(\d+):int:default(10)}
        // {id+}
        // {id?:(\d+):int:default(10)}

        const name = parseName(pattern) || throwError();
        const quantifier = "?*+".indexOf(pattern[name.length]) >= 0
            ? pattern[name.length]
            : "";

        const array = [...constraints(pattern.slice(name.length + quantifier.length))];
        const token = {
            name,
            pattern,
            quantifier,
            default: array.find(c => c.name === "default")?.default,
            required: quantifier === "+" || quantifier === "",
            optional: quantifier === "?" || quantifier === "*",
            catchAll: quantifier === "*" || quantifier === "+",
            constraints: array.filter(c => c.name !== "default")
        };

        token.quantifier === "*" && (token.default ??= "");
        return token;
    }

    function parseParameter(i) {
        let stack = 1;

        for (let start = i; i < segment.length; i++) {
            if (segment[i] === "{") {
                stack++;
            }
            else if (segment[i] === "}" && --stack === 0) {
                const value = segment.slice(start, i);
                return {
                    value: value,
                    token: parseToken(value.trim())
                };
            }
        }

        throwError();
    }

    function parseLiteral(i) {
        let index = segment.indexOf("{", i);
        index < 0 && (index = segment.length);
        return segment.slice(i, index);
    }

    for (let i = 0; i < segment.length;) {
        if (segment[i] === "{") {
            const parameter = parseParameter(i + 1);
            yield parameter.token;

            i += parameter.value.length + 2;
        }
        else {
            let literal = parseLiteral(i);
            i += literal.length;

            if ((literal = literal.trim())) {
                yield literal;
            }
        }
    }
}
