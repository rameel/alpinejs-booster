import { anchorBlock } from "@/utilities/anchorBlock";
import { createGetter } from "@/utilities/evaluator";
import { isTemplate, warn } from "@/utilities/utils";

export default function({ addScopeToNode, directive, initTree, mutateDom }) {
    directive("when", (el, { expression }, { cleanup, effect, evaluateLater }) => {
        if (!isTemplate(el)) {
            warn("x-when can only be used on a 'template' tag");
            return;
        }

        const activate = () => anchorBlock(el, el, { addScopeToNode, cleanup, initTree, mutateDom });
        const clear    = () => el._b_block?.delete();

        const get = createGetter(evaluateLater, expression);
        effect(() => get() ? activate() : clear());
    });
}
