import { destroy } from "@/plugins/index.js";
import { format } from "@/plugins/index.js";
import { fragment } from "@/plugins/index.js";
import { match } from "@/plugins/index.js";
import { router } from "@/plugins/index.js";
import { template } from "@/plugins/index.js";
import { when } from "@/plugins/index.js";

document.addEventListener("alpine:init", () => {
    Alpine.plugin([
        destroy,
        format,
        fragment,
        match,
        router,
        template,
        when
    ]);
});
