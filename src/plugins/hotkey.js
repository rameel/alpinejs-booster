import { registerHotkey } from "@/utilities/registerHotkey";
import { single } from "@/utilities/utils";

const optionKeys = ["stop", "passive", "prevent", "window", "document"];

export default function({ directive }) {
    directive("hotkey", (el, { expression, value, modifiers }, { evaluateLater, cleanup }) => {
        const evaluate = expression ? evaluateLater(expression) : () => {};
        const listener = e => evaluate(() => { }, {
            scope: {
                $event: e
            },
            params: [e]
        });

        const options = {
            stop: modifiers.includes("stop"),
            passive: modifiers.includes("passive"),
            prevent: modifiers.includes("prevent")
        };

        const target = modifiers.includes("window")   ? window   :
                       modifiers.includes("document") ? document : el;

        const disposes = modifiers
            .filter(m => !optionKeys.includes(m))
            .flatMap(s => s.split(","))
            .map(shortcut =>
                registerHotkey(
                    target,
                    shortcut,
                    listener,
                    value || "keydown",
                    options));

        cleanup(single(...disposes));
    });
}
