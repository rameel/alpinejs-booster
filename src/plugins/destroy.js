export function destroy(alpine) {
    alpine.directive("destroy", (el, { expression }, { cleanup, evaluate }) => {
        cleanup(() => evaluate(expression));
    });
}
