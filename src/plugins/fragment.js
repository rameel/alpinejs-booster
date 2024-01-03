import { error, isElement, isTemplate } from "@/utilities/utils.js";

export default function({ directive, addScopeToNode, mutateDom, initTree }) {
    directive("fragment", (el, {}, { cleanup }) => {
        if (!isTemplate(el)) {
            error("x-fragment can only be used on a 'template' tag");
            return;
        }

        let nodes = [...el.content.cloneNode(true).childNodes];

        nodes.forEach(node => {
            isElement(node) && addScopeToNode(node, {}, el);

            mutateDom(() => {
                el.parentElement.insertBefore(node, el);
                isElement(node) && initTree(node);
            });
        });

        cleanup(() => {
            nodes.forEach(node => node.remove());
            nodes = null;
        });
    });
}
