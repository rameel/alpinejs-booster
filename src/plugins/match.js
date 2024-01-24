import { anchorBlock } from "@/utilities/anchorBlock";
import { createGetter } from "@/utilities/evaluator";
import { isTemplate, warn } from "@/utilities/utils";

export default function({ addScopeToNode, directive, initTree, mutateDom }) {
    directive("match", (el, { }, { cleanup, effect, evaluateLater }) => {
        if (!isTemplate(el)) {
            warn("x-match can only be used on a 'template' tag");
            return;
        }

        const branches = [];
        const hasDefault = () => branches.some(b => b.default);

        for (let node of el.content.children) {
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
            if (el._b_block?.template !== branch.el) {
                clear();
                anchorBlock(el, branch.el, {
                    addScopeToNode,
                    cleanup,
                    initTree,
                    mutateDom
                });
            }
        }

        function clear() {
            el._b_block?.delete();
        }

        effect(() => {
            let active;

            for (let branch of branches) {
                if (branch.getValue() && !active) {
                    active = branch;
                }
            }

            active
                ? activate(active)
                : clear();
        });
    });
}
