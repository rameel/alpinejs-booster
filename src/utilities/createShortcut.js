import { listen } from "./utils";

const aliases = {
    "esc": "escape",
    "ins": "insert",
    "del": "delete",
    "up": "arrowup",
    "down": "arrowdown",
    "right": "arrowright",
    "left": "arrowleft",
    "pgup": "pageup",
    "pgdn": "pagedown",
    "pu": "pageup",
    "pd": "pagedown",
    "break": "pause",
    "scroll": "scrolllock",
    "scrlk": "scrolllock",
    "prtscr": "printscreen",
    "win": "meta",
    "windows": "meta",
    "cmd": "meta",
    "command": "meta",
    "comma": ",",
    "dot": ".",
    "period": ".",
    "quote": "\"",
    "singlequote": "'",
    "colon": ":",
    "semicolon": ";",
    "plus": "+",
    "minus": "-",
    "tilde": "~",
    "equal": "=",
    "slash": "/"
};

const controlKeys = ["ctrlKey", "altKey", "shiftKey", "metaKey"];

export function createShortcut(target, shortcut, handler, eventName = "keydown", options = {}) {
    options = {
        ...options
    };

    shortcut = describe(shortcut
        .replace(/\s+/g, "")
        .toLowerCase()
        .split("+")
        .sort()
        .join("+"));

    return listen(target, eventName, function(e) {
        const code = e.code.toUpperCase();

        if (shortcut.code === code && controlKeys.every(n => shortcut[n] === e[n])) {
            options.prevent && e.preventDefault();
            options.stop && e.stopPropagation();
            handler.call(this, e);
        }
    }, { passive: !!options.passive && !options.prevent });
}

function describe(shortcut) {
    const info = shortcut.split("+").reduce((data, k) => {
        k = aliases[k] ?? k;
        switch (k) {
            case "ctrl":
            case "alt":
            case "shift":
            case "meta":
                data[`${ k }Key`] = true;
                break;

            default:
                k.length || invalidKey(shortcut);
                k = k.toUpperCase();

                data.code = k.length === 1 && k >= 'A' && k <= 'Z' ? `KEY${ k }` : k;
                break;
        }
        return data;
    }, {
        code: null,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false
    });

    info.code === null && invalidKey(shortcut);
    return info;
}

function invalidKey(shortcut) {
    throw new Error(`Invalid shortcut: '${ shortcut }'`);
}
