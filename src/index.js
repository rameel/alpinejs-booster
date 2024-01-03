import { _switch } from "@/plugins/switch.js";
import { destroy } from "@/plugins/destroy.js";
import { format } from "@/plugins/format";
import { fragment } from "@/plugins/fragment.js";
import { router } from "@/plugins/router";
import { template } from "@/plugins/template.js";
import { when } from "@/plugins/when.js";

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
