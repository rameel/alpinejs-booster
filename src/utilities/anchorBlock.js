import { isElement, isTemplate } from "@/utilities/utils";

export function anchorBlock(el, template, { addScopeToNode, cleanup, initTree, mutateDom, scope = {} }) {
    if (el._b_block) {
        return;
    }

    document.body._b_linker || initialize();

    let nodes =  isTemplate(template)
        ? [...template.content.cloneNode(true).childNodes]
        : [template.cloneNode(true)];

    mutateDom(() => {
        for (let node of nodes) {
            isElement(node) && addScopeToNode(node, scope, el);
            el.parentElement.insertBefore(node, el);
            isElement(node) && initTree(node);
        }
    });

    el._b_block = {
        template,
        update() {
            mutateDom(() => {
                for (let node of nodes ?? []) {
                    el.parentElement.insertBefore(node, el);
                }
            })
        },
        delete() {
            el._b_block = null;
            for (let node of nodes ?? []) {
                node.remove();
            }
            nodes = null;
        }
    }

    cleanup(() => el._b_block?.delete());
}

function initialize() {
    const observer = new MutationObserver(mutations => {
        for (let mutation of mutations) {
            for (let node of mutation.addedNodes) {
                node._b_block?.update();
            }
        }
    });

    observer.observe(document.body, { subtree: true, childList: true });
    document.body._b_linker = observer;
}
