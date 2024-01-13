import { createHistory } from "@/plugins/router/helpers/history";
import { createGetter } from "@/utilities/evaluator";
import { asArray, closest, isNullish, isTemplate, listen, warn } from "@/utilities/utils";
import { watch } from "@/utilities/watch";

export default function({ directive, magic, reactive }) {
    directive("router", (el, { expression, value }, { cleanup, effect, evaluate, evaluateLater }) => {
        value || (value = "html5");

        const router = closest(el, node => node._x_router)?._x_router;

        if (isNullish(router) && (value === "outlet" || value === "link")) {
            warn(`no x-router directive found`);
            return;
        }

        switch (value) {
            case "outlet":
                processOutlet();
                break;

            case "link":
                processLink();
                break;

            default:
                processRouter();
                break;
        }

        function processRouter() {
            const values = reactive({
                pattern: "",
                path: "",
                params: ""
            });

            const api = isNullish(value) && expression
                ? evaluate(expression)
                : createHistory(value);

            const router = {
                routes: [],
                outlet: null,
                active: null,
                history: api,
                values: values,
                async match(path) {
                    for (let route of this.routes) {
                        const params = route.match(path);
                        if (params) {
                            const context = { router, route, params, path };
                            if (route.handler && await route.handler(context) !== false) {
                                return context;
                            }
                        }
                    }
                },
                navigate(path, replace = false) {
                    api.navigate(path, replace);
                }
            };

            el._x_router = router;

            function activate(route, path, params) {
                if (route.nodes?.length && values.path === path) {
                    return;
                }

                clear();

                values.path = path;
                values.pattern = route.template;
                values.params = params;

                router.active = route;

                const outlet = router.outlet;
                if (outlet) {
                    route.view().then(html => {
                        if (values.path !== path
                            || values.pattern !== route.template
                            || JSON.stringify(values.params) !== JSON.stringify(params)) {
                            return;
                        }

                        route.nodes = [...html.cloneNode(true).childNodes];
                        isTemplate(outlet)
                            ? route.nodes.forEach(node => outlet.parentElement.insertBefore(node, outlet))
                            : route.nodes.forEach(node => outlet.append(node));
                    });
                }
            }

            function clear() {
                router.active?.nodes?.forEach(n => n.remove());
                router.active = null;
            }

            const dispose = watch(() => api.path, async path => {
                const result = await router.match(path);
                if (result && path === api.path) {
                    activate(result.route, result.path, result.params);
                }
                else {
                    clear();
                }
            });

            cleanup(dispose);
            cleanup(clear);
        }

        function processLink() {
            const isBlank = (el.getAttribute("target") ?? "").indexOf("_blank") >= 0;
            const unsubscribe = listen(el, "click", e => {
                if (e.metaKey
                    || e.altKey
                    || e.ctrlKey
                    || e.shiftKey
                    || e.defaultPrevented
                    || e.button > 0
                    || isBlank) {
                    return;
                }

                e.preventDefault();

                router.navigate(`${ el.pathname }${ el.search }${ el.hash }`);
            });

            if (expression) {
                const active = createGetter(evaluateLater, "$active");
                let classlist = evaluate(expression);
                Array.isArray(classlist) || (classlist = [classlist]);

                effect(() => {
                    if (active()) {
                        el.classList.add(...classlist);
                    }
                    else {
                        el.classList.remove(...classlist);
                    }
                });

                cleanup(() => el.classList.remove(...classlist));
            }

            cleanup(unsubscribe);
        }

        function processOutlet() {
            router.outlet && warn("x-router:outlet already specified", router.outlet);
            router.outlet || (router.outlet = el);
            cleanup(() => router.outlet = null);
        }
    });

    magic("router", el => closest(el, n => n._x_router)?._x_router);

    magic("active", el => {
        const router = closest(el, node => node._x_router)?._x_router;
        if (isNullish(router)) {
            warn("No x-router directive found");
            return;
        }

        return router.history.resolve(el.href) === router.values.path;
    });
}
