import { bound } from "@/plugins";
import { destroy } from "@/plugins";
import { format } from "@/plugins";
import { fragment } from "@/plugins";
import { hotkey } from "@/plugins";
import { match } from "@/plugins";
import { router } from "@/plugins";
import { template } from "@/plugins";
import { utilities } from "@/plugins";
import { when } from "@/plugins";

document.addEventListener("alpine:init", () => {
    Alpine.plugin([
        bound,
        destroy,
        format,
        fragment,
        hotkey,
        match,
        router,
        template,
        utilities,
        when
    ]);
});
