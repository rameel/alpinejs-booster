import { createGetter, createSetter } from "@/utilities/evaluator";
import { registerHotkey } from "@/utilities/registerHotkey";
import { watch } from "@/utilities/watch";

export default function(alpine) {
    Object.assign(alpine, {
        createGetter,
        createSetter,
        registerHotkey,
        watch
    });
}
