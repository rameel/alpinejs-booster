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

const defaultOptions = {
    passive: false,
    prevent: false,
    stop: false
};

const controlKeys = ["ctrlKey", "altKey", "shiftKey", "metaKey"];

export function createShortcut(target, key, handler, eventName = "keydown", options = { }) {
    options = Object.assign({ }, defaultOptions, options);
    const shortcuts = [...(new Set(
        (Array.isArray(key) ? key : [key])
            .map(s => s.replace(/\s+/g, "").toLowerCase())
            .map(s => s.split("+").sort().join("+"))
            .filter(s => s.length)))
    ].map(describeKey);

    return listen(target, eventName, function(e) {
        const code = e.code.toUpperCase();
        for (const key of shortcuts) {
            if (key.code === code && controlKeys.every(n => key[n] === e[n])) {
                options.stop && e.stopPropagation();
                options.prevent && e.preventDefault();
                handler.call(this, e);
            }
        }
    }, { passive: !!options.passive && !options.prevent });

    function describeKey(key) {
        const info = key.split("+").reduce((data, k) => {
            k = aliases[k] ?? k;
            switch (k) {
                case "ctrl":
                case "alt":
                case "shift":
                case "meta":
                    data[`${ k }Key`] = true;
                    break;

                default:
                    k.length || throwError(key);

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

        if (info.code === null) {
            throwError(key);
        }

        return info;
    }
}

function throwError(key) {
    throw new Error(`Invalid shortcut definition: ${ key }`);
}
