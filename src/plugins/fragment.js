import { anchorBlock } from "@/utilities/anchorBlock";
import { isTemplate, warn } from "@/utilities/utils";

export default function({ addScopeToNode, directive, initTree, mutateDom }) {
    directive("fragment", (el, {}, { cleanup }) => {
        if (!isTemplate(el)) {
            warn("x-fragment can only be used on a 'template' tag");
            return;
        }

        anchorBlock(el, el, { addScopeToNode, cleanup, initTree, mutateDom });
    });
}
