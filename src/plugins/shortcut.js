import { createShortcut } from "@/utilities/createShortcut";

const optionKeys = ["stop", "passive", "prevent", "window", "document"];

export default function({ directive }) {
    directive("shortcut", (el, { expression, value, modifiers }, { evaluateLater, cleanup }) => {
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

        el.dataset.shortcut && modifiers.push(el.dataset.shortcut);
        modifiers = modifiers.filter(m => !optionKeys.includes(m));

        const shortcuts = modifiers.flatMap(s => s.split(","));
        const stop = createShortcut(target, shortcuts, listener, value || "keydown", options);

        cleanup(stop);
    });
}
