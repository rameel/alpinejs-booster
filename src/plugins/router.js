import { loadTemplate } from "@/utilities/loadTemplate";
import { RoutePattern } from "@/utilities/RoutePattern";
import { useLocation } from "@/utilities/useLocation";
import { error, isElement, isNullish, isTemplate, listen, warn } from "@/utilities/utils";

export default function({ directive, addScopeToNode, mutateDom, initTree, reactive }) {
    const location = useLocation();

    directive("link", (el, { modifiers }, { cleanup }) => {
        const method = modifiers.includes("replace")
            ? "replaceState" : "pushState";

        const unsubscribe = listen(el, "click", e => {
            e.preventDefault();
            e.stopPropagation();

            history[method]({}, "", el.href);
            location.refresh();
        });

        cleanup(unsubscribe);
    });

    directive("router", (el, { value }, { cleanup, effect, evaluate }) => {
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

        const router = {
            "go"(path, replace = false) {
                if (api === "hash") {
                    path = "#" + path;
                }

                const method = replace ? "replaceState" : "pushState";
                history[method]({}, "", path);
                location.refresh();
            }
        };

        addScopeToNode(el, { $router: router, $route: state });

        [...el.content.children].forEach(node => {
            const route = node.getAttribute("x-route")?.trim();

            if (isNullish(route)) {
                warn("Element has no x-route directive and will be ignored", node);
                return;
            }

            const view = (() => {
                if (node.hasAttribute("x-view")) {
                    return () => loadTemplate(node.getAttribute("x-view"));
                }

                if (node.hasAttribute("x-view.prefetch")) {
                    const promise = loadTemplate(node.getAttribute("x-view.prefetch"));
                    return () => promise;
                }

                return () => new Promise(resolve => {
                    const nodes = isTemplate(node)
                        ? [...node.content.cloneNode(true).childNodes]
                        : [node.cloneNode(true)];

                    const fragment = new DocumentFragment();
                    fragment.append(...nodes);
                    resolve(fragment);
                });
            })();

            let handlers = node.getAttribute("x-handler") ?? "[]";
            if (!handlers.startsWith("[")) {
                handlers = `[${ handlers }]`;
            }

            handlers = evaluate(handlers);

            table.push(Object.assign(
                new RoutePattern(route),
                {
                    el: node,
                    view: view,
                    handler: context => handlers.every(h => h(context) !== false)
                }));
        });

        function activate(route, path, params) {
            if (route.nodes?.length && state.path === path) {
                return;
            }

            state.path = path;
            state.pattern = route.template;
            state.params = params;

            clear();

            route.view().then(html => {
                if (state.path !== path
                    || state.pattern !== route.template
                    || JSON.stringify(state.params) !== JSON.stringify(params)) {
                    return;
                }

                route.nodes = [...html.cloneNode(true).childNodes];
                route.nodes.forEach(node => {
                    isElement(node) && addScopeToNode(node, {}, el);
                    mutateDom(() => {
                        el.parentElement.insertBefore(node, el);
                        isElement(node) && initTree(node);
                    });
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
            path = RoutePattern.normalize(path);

            for (let route of table) {
                const params = route.match(path);
                if (params !== null) {
                    const context = { router, route, params, path };
                    if (route.handler(context) !== false) {
                        return context;
                    }
                }
            }

            return null;
        }

        const getPath = () => api === "history"
            ? location.pathname
            : location.hash.slice(1);

        effect(() => {
            const path = getPath();

            queueMicrotask(() => {
                const result = match(path);
                if (result && path === getPath()) {
                    activate(result.route, result.path, result.params);
                }
                else {
                    clear();
                }
            });
        });

        cleanup(clear);
    });
}
