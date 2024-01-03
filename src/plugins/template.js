import { error, isTemplate } from "@/utilities/utils.js";

export default function(alpine) {
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

        // Adding a queued task ensures asynchronous content update, allowing Alpine.js
        // to handle context propagation for cloned elements properly.
        // This is important because manipulation can occur within the mutateDom function
        // when mutation observing is disabled, preventing proper context propagation
        // for cloned elements
        queueMicrotask(() => {
            el.innerHTML = "";
            el.appendChild(tpl.content.cloneNode(true));
        });
    });
}
