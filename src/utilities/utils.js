export function assert(value, message) {
    if (__DEV && !value) {
        throw new Error(message || "Assertion failed");
    }
}

export const warn = (...args) => console.warn("alpinejs-booster:", ...args);

export const isArray = Array.isArray;

export const isNullish = value => value === null || value === undefined;

export const isCheckableInput = el => el.type === "checkbox" || el.type === "radio";

export const isNumericInput = el => el.type === "number" || el.type === "range";

export const isTemplate = el => el instanceof HTMLTemplateElement;

export const isElement = el => el.nodeType === Node.ELEMENT_NODE;

export const isFunction = value => typeof value === "function";

export const asArray = value => isArray(value) ? value : [value];

export const asyncify = fn => {
    if (isFunction(fn) && fn.constructor?.name === "AsyncFunction") {
        return fn;
    }

    return function(...args) {
        const result = fn.apply(this, args);
        if (isFunction(result?.then)) {
            return result;
        }

        return Promise.resolve(result);
    }
}

export const listen = (target, type, listener, options) => {
    target.addEventListener(type, listener, options);
    return () => target.removeEventListener(type, listener, options);
}

export const single = (...fns) => (...args) => {
    for (const fn of fns) {
        fn && fn(...args);
    }
};

export const clone = value =>
    typeof value === "object"
        ? JSON.parse(JSON.stringify(value))
        : value

export const closest = (el, callback) => {
    while (el && !callback(el)) {
        el = (el._x_teleportBack ?? el).parentElement;
    }

    return el;
}

export const createMap = keys => new Map(
    keys.split(",").map(v => [v.trim().toLowerCase(), v.trim()]));

export const looseEqual = (a, b) => a == b;

export const looseIndexOf = (array, value) => array.findIndex(v => v == value);

export const hasModifier = (modifiers, modifier) => modifiers.includes(modifier);
