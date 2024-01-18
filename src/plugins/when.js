import { createGetter } from "@/utilities/evaluator";
import { isElement, isTemplate, warn } from "@/utilities/utils";

export default function({ addScopeToNode, directive, initTree, mutateDom }) {
    directive("when", (el, { expression }, { cleanup, effect, evaluateLater }) => {
        if (!isTemplate(el)) {
            warn("x-when can only be used on a 'template' tag");
            return;
        }

        let nodes;

        function activate() {
            if (nodes) {
                return;
            }

            nodes = [...el.content.cloneNode(true).childNodes];
            mutateDom(() => {
                nodes.forEach(node => {
                    isElement(node) && addScopeToNode(node, {}, el);
                    el.parentElement.insertBefore(node, el);
                    isElement(node) && initTree(node);
                });
            });
        }

        function clear() {
            nodes && nodes.forEach(node => node.remove());
            nodes = null;
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
