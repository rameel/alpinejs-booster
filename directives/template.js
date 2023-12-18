import { error, isTemplate } from "../utilities/utils.js";

export function template(alpine) {
    alpine.directive("template", (el, { expression }) => {
        if (isTemplate(el)) {
            error("x-template cannot be used on a 'template' tag");
            return;
        }

        const tpl = document.getElementById(expression);
        if (!tpl) {
            error(`Template #'${ expression }' not found`);
            return;
        }

        if (!isTemplate(tpl)) {
            error("x-template directive can only reference the template tag");
            return;
        }

        // Adding a delayed task to update the content is necessary
        // because otherwise, Alpine.js doesn't include the current context
        // for the cloned elements (or might not have enough time to react to)
        queueMicrotask(() => {
            el.innerHTML = "";
            el.appendChild(tpl.content.cloneNode(true));
        });
    });
}
