import { RoutePattern } from "@/plugins/router/helpers/RoutePattern";
import { loadTemplate } from "@/utilities/loadTemplate";
import { asyncify, closest, isNullish, isTemplate, warn } from "@/utilities/utils";

export default function({ directive, magic }) {
    directive("route", (el, { expression, value, modifiers }, { cleanup, evaluate }) => {
        if (!isTemplate(el)) {
            warn("x-route can only be used on a 'template' tag");
            return;
        }

        const route = closest(el, n => n._x_route)?._x_route;

        if (isNullish(route) && (value === "view" || value === "handler")) {
            warn(`no x-route directive found`);
            return;
        }

        switch (value) {
            case "view":
                processView();
                break;

            case "handler":
                processHandler();
                break;

            default:
                processRoute();
                break;
        }

        function processRoute() {
            const router = closest(el, n => n._x_router)?._x_router;
            if (isNullish(router)) {
                warn(`no x-router directive found`);
                return;
            }

            const view = () => new Promise(resolve => resolve(el.content));

            el._x_route = Object.assign(new RoutePattern(expression), { el, view, handler: () => Promise.resolve() });
            router.routes.push(el._x_route);

            cleanup(() => {
                router.routes = router.routes.filter(r => r !== el._x_route);
            });
        }

        function processHandler() {
            expression || (expression = "[]");
            expression.startsWith("[") || (expression = `[${ expression }]`);
            const handlers = evaluate(expression).map(asyncify);

            route.handler = async context => {
                for (let handler of handlers) {
                    if (await handler(context) === false) {
                        return false;
                    }
                }
            };

            cleanup(() => route.handler = null);
        }

        function processView() {
            route.view = () => loadTemplate(expression);
            modifiers.includes("prefetch") && loadTemplate(expression);

            cleanup(() => {
                route.view = () => new Promise(resolve => resolve(new DocumentFragment()));
            });
        }
    });

    magic("route", el => closest(el, n => n._x_router)?._x_router.values);
}
