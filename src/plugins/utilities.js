import { RoutePattern } from "@/plugins/router/RoutePattern";
import { createGetter, createSetter } from "@/utilities/evaluator";
import { registerHotkey } from "@/utilities/registerHotkey";
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
