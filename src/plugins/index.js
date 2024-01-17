import bound from "@/plugins/bound";
import destroy from "@/plugins/destroy";
import format from "@/plugins/format";
import fragment from "@/plugins/fragment";
import hotkey from "@/plugins/hotkey";
import match from "@/plugins/match";
import router from "@/plugins/router";
import template from "@/plugins/template";
import utilities from "@/plugins/utilities";
import when from "@/plugins/when";

import { createGetter, createSetter } from "@/utilities/evaluator";
import { registerHotkey } from "@/utilities/registerHotkey";
import { useLocation } from "@/utilities/useLocation";
import { watch } from "@/utilities/watch";

export {
    bound,
    destroy,
    format,
    fragment,
    hotkey,
    match,
    router,
    template,
    utilities,
    when,

    createGetter,
    createSetter,
    registerHotkey,
    useLocation,
    watch
}
