import { error, isElement, isTemplate, warn } from "../utilities/utils.js";

export function _switch({ directive, addScopeToNode, mutateDom, initTree }) {
    directive("switch", (el, { expression }, { cleanup, effect, evaluate }) => {
        if (!isTemplate(el)) {
            error("x-switch can only be used on a 'template' tag");
            return;
        }

        const branches = [];
        const hasDefault = () => branches.some(b => b.default);

        for (let node = el.content.firstElementChild; node; node = node.nextElementSibling) {
            const expr = node.getAttribute("x-case");
            if (expr !== null) {
                if (hasDefault()) {
                    warn("The x-case directive cannot be appear after x-default");
                    continue;
                }

                branches.push({ el: node, expression: expr });
            }
            else if (node.hasAttribute("x-default")) {
                if (hasDefault()) {
                    warn("Only one x-default directive is allowed");
                    continue;
                }

                branches.push({ el: node, expression: "true", default: true });
            }
            else {
                warn("Element has no x-case or x-default directive and will be ignored", node);
            }
        }

        function activate(branch) {
            if (branch.nodes?.length) {
                return;
            }

            clear();

            branch.nodes = isTemplate(branch.el)
                ? [...branch.el.content.cloneNode(true).childNodes]
                : [branch.el.cloneNode(true)];

            branch.nodes.forEach(node => {
                isElement(node) && addScopeToNode(node, {}, el);
                mutateDom(() => {
                    el.parentElement.insertBefore(node, el);
                    isElement(node) && initTree(node);
                });
            });
        }

        function clear() {
            const branch = branches.find(b => b.nodes?.length);
            if (branch) {
                branch.nodes.forEach(n => n.remove());
                branch.nodes = null;
            }
        }

        effect(() => {
            let active;

            for (let branch of branches) {
                if (evaluate(branch.expression) && !active) {
                    active = branch;
                }
            }

            if (active) {
                activate(active);
            }
            else {
                clear();
            }
        });

        cleanup(clear);
    });
}
