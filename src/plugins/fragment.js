import { isElement, isTemplate, warn } from "@/utilities/utils";

export default function({ directive, addScopeToNode, mutateDom, initTree }) {
    directive("fragment", (el, {}, { cleanup }) => {
        if (!isTemplate(el)) {
            warn("x-fragment can only be used on a 'template' tag");
            return;
        }

        let nodes = [...el.content.cloneNode(true).childNodes];

        mutateDom(() => {
            nodes.forEach(node => {
                isElement(node) && addScopeToNode(node, {}, el);
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
