import { createGetter } from "@/utilities/evaluator";
import { isElement, isTemplate, warn } from "@/utilities/utils";

export default function({ addScopeToNode, directive, initTree, mutateDom }) {
    directive("match", (el, { }, { cleanup, effect, evaluateLater }) => {
        if (!isTemplate(el)) {
            warn("x-match can only be used on a 'template' tag");
            return;
        }

        const branches = [];
        const hasDefault = () => branches.some(b => b.default);

        for (let node = el.content.firstElementChild; node; node = node.nextElementSibling) {
            const expr = node.getAttribute("x-case");
            if (expr !== null) {
                if (__DEV && hasDefault()) {
                    warn("The x-case directive cannot be appear after x-default");
                }

                branches.push({ el: node, getValue: createGetter(evaluateLater, expr) });
            }
            else if (node.hasAttribute("x-default")) {
                if (__DEV && hasDefault()) {
                    warn("Only one x-default directive is allowed");
                }

                branches.push({ el: node, getValue: () => true, default: true });
            }
            else {
                warn("Element has no x-case or x-default directive and will be ignored", node);
            }
        }

        function activate(branch) {
            if (branch.nodes) {
                return;
            }

            clear();

            branch.nodes = isTemplate(branch.el)
                ? [...branch.el.content.cloneNode(true).childNodes]
                : [branch.el.cloneNode(true)];

            mutateDom(() => {
                branch.nodes.forEach(node => {
                    isElement(node) && addScopeToNode(node, {}, el);
                    el.parentElement.insertBefore(node, el);
                    isElement(node) && initTree(node);
                });
            });
        }

        function clear() {
            const branch = branches.find(b => b.nodes);
            if (branch) {
                branch.nodes.forEach(n => n.remove());
                branch.nodes = null;
            }
        }

        effect(() => {
            let active;

            for (let branch of branches) {
                if (branch.getValue() && !active) {
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
