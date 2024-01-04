import { destroy } from "@/plugins";
import { format } from "@/plugins";
import { fragment } from "@/plugins";
import { match } from "@/plugins";
import { router } from "@/plugins";
import { shortcut } from "@/plugins";
import { template } from "@/plugins";
import { when } from "@/plugins";

document.addEventListener("alpine:init", () => {
    Alpine.plugin([
        destroy,
        format,
        fragment,
        match,
        router,
        shortcut,
        template,
        when
    ]);
});
