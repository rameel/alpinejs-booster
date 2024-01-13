import { createGetter } from "@/utilities/evaluator";
import { isElement, isTemplate, warn } from "@/utilities/utils";

export default function({ directive, addScopeToNode, mutateDom, initTree }) {
    directive("when", (el, { expression }, { cleanup, effect, evaluateLater }) => {
        if (!isTemplate(el)) {
            warn("x-when can only be used on a 'template' tag");
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

        const getValue = createGetter(evaluateLater, expression);

        effect(() => {
            if (getValue()) {
                activate();
            }
            else {
                clear();
            }
        });

        cleanup(clear);
    });
}
