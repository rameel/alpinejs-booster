import { error, isElement, isTemplate } from "@/utilities/utils.js";

export default function({ directive, addScopeToNode, mutateDom, initTree }) {
    directive("when", (el, { expression }, { cleanup, effect, evaluate }) => {
        if (!isTemplate(el)) {
            error("x-when can only be used on a 'template' tag");
            return;
        }

        let nodes;

        function activate() {
            if (nodes?.length) {
                return;
            }

            nodes = [...el.content.cloneNode(true).childNodes];
            nodes.forEach(node => {
                isElement(node) && addScopeToNode(node, {}, el);

                mutateDom(() => {
                    el.parentElement.insertBefore(node, el);
                    isElement(node) && initTree(node);
                });
            });
        }

        function clear() {
            if (nodes?.length) {
                nodes.forEach(node => node.remove());
                nodes = null;
            }
        }

        effect(() => {
            if (evaluate(expression)) {
                activate();
            }
            else {
                clear();
            }
        });

        cleanup(clear);
    });
}
