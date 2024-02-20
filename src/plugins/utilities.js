import { createGetter, createSetter } from "@/utilities/evaluator";
import { registerHotkey } from "@ramstack/hotkey";
import { RoutePattern } from "@/plugins/router/RoutePattern";
import { watch } from "@/utilities/watch";

export default function(alpine) {
    window.RoutePattern = RoutePattern;

    Object.assign(alpine, {
        createGetter,
        createSetter,
        registerHotkey,
        watch
    });
}
