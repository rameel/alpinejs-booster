export default function(alpine) {
    alpine.directive("destroy", (el, { expression }, { cleanup, evaluate }) => {
        cleanup(() => evaluate(expression));
    });
}
