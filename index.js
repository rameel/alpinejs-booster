import { _switch } from "./directives/switch.js";
import { destroy } from "./directives/destroy.js";
import { format } from "./directives/format";
import { fragment } from "./directives/fragment.js";
import { router } from "./directives/router";
import { template } from "./directives/template.js";
import { when } from "./directives/when.js";

document.addEventListener("alpine:init", () => {
    Alpine.plugin([
        _switch,
        destroy,
        format,
        fragment,
        router,
        template,
        when
    ]);
});
