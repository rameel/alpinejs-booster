import { registerHotkey } from "@ramstack/hotkey";
import { single } from "@/utilities/utils";
import { hasModifier } from "../utilities/utils";

const optionKeys = ["capture", "passive", "once", "prevent", "stop", "window", "document"];

export default function({ directive }) {
    directive("hotkey", (el, { expression, value, modifiers }, { evaluateLater, cleanup }) => {
        const evaluate = expression ? evaluateLater(expression) : () => {};
        const listener = e => evaluate(() => { }, { scope: { $event: e }, params: [e] });

        const target = hasModifier(modifiers, "window")   ? window   :
                       hasModifier(modifiers, "document") ? document : el;

        const disposes = modifiers
            .filter(m => !optionKeys.includes(m))
            .flatMap(s => s.split(","))
            .map(hotkey => registerHotkey(
                target,
                hotkey,
                e => {
                    hasModifier(modifiers, "prevent") && e.preventDefault();
                    hasModifier(modifiers, "stop") && e.stopPropogation();

                    e.hotkey = hotkey;
                    listener(e);
                },
                value || "keydown",
                {
                    capture: hasModifier(modifiers, "capture"),
                    passive: hasModifier(modifiers, "passive"),
                    once: hasModifier(modifiers, "once")
                }));

        cleanup(single(...disposes));
    });
}
