import { useLocation } from "../utilities/useLocation";
import { error, isElement, isTemplate, listen, warn } from "../utilities/utils";

export function router({ directive, addScopeToNode, mutateDom, initTree, reactive }) {
    const location = useLocation();

    directive("link", (el, {}, { cleanup }) => {
        const unsubscribe = listen(el, "click", e => {
            e.preventDefault();
            e.stopPropagation();

            history.pushState({}, "", el.href);
            location.refresh();
        });

        cleanup(unsubscribe);
    });

    directive("router", (el, { value }, { cleanup, effect }) => {
        if (!isTemplate(el)) {
            error("x-router can only be used on a 'template' tag");
            return;
        }

        const api = value ?? "history";
        if (api !== "history" && api !== "hash") {
            error(`Unknown api: ${ api }`);
            return;
        }

        const table = [];
        const state = reactive({
            pattern: "",
            path: "",
            params: ""
        });

        addScopeToNode(el, { $route: state });

        [...el.content.children].forEach(node => {
            const route = node.getAttribute("x-route")?.trim();
            if (route === null) {
                warn("Element has no x-route directive and will be ignored", node);
                return;
            }

            table.push({
                el: node,
                pattern: normalize(route),
                matcher: createMatcher(route)
            });
        });

        function activate(route, path, params) {
            if (route.nodes?.length && state.path === path) {
                return;
            }

            state.path = path;
            state.pattern = route.pattern;
            state.params = params;

            clear();

            route.nodes = isTemplate(route.el)
                ? [...route.el.content.cloneNode(true).childNodes]
                : [route.el.cloneNode(true)];

            route.nodes.forEach(node => {
                isElement(node) && addScopeToNode(node, {}, el);
                mutateDom(() => {
                    el.parentElement.insertBefore(node, el);
                    isElement(node) && initTree(node);
                });
            });
        }

        function clear() {
            table.forEach(route => {
                route.nodes?.forEach(node => node.remove());
                route.nodes = null;
            })
        }

        function match(path) {
            path = normalize(path);
            for (let route of table) {
                const params = route.matcher(path);
                if (params !== null) {
                    return { route, params, path };
                }
            }

            return null;
        }

        effect(() => {
            const path = api === "history"
                ? location.pathname
                : location.hash.slice(1);

            const result = match(path);
            if (result) {
                activate(result.route, result.path, result.params);
            }
            else {
                clear();
            }
        });

        cleanup(clear);
    });
}

function normalize(path) {
    return path
        .split("/")
        .filter(s => s.length)
        .join("/");
}

function createMatcher(pattern) {
    const segments = normalize(pattern).split("/").map((segment, index) => {
        if (!segment.startsWith(":")) {
            return index ? `/${ segment }` : segment;
        }

        const modifier = "?*".indexOf(segment.slice(-1)) >= 0
            ? segment.slice(-1)
            : "";

        const name = modifier
            ? segment.slice(1, -1)
            : segment.slice(1);

        switch (modifier) {
            case "?": {
                const expr = `(?<${ name }>[^/]+)`;
                return index ? `(?:/${ expr })?` : expr + "?";
            }

            case "*": {
                const expr = `(?<${ name }>.*)$`;
                return index ? `(?:/${ expr })` : expr;
            }

            default: {
                const expr = `(?<${ name }>[^/]+)`;
                return index ? `(?:/${ expr })` : expr;
            }
        }
    });

    try {
        const expression = segments.join("");
        const regex = new RegExp(`^${ expression }$`);

        return path => {
            const result = regex.exec(path);
            if (result) {
                return result.groups ?? {};
            }

            return null;
        };
    }
    catch (e) {
        error(`Invalid pattern: ${ pattern }`, e);
    }
}
