export function assert(value, message) {
    if (__DEV && !value) {
        throw new Error(message || "Assertion failed");
    }
}

export function warn(...args) {
    console.warn("alpinejs-booster:", ...args);
}

export const isArray = Array.isArray;

export function isNullish(value) {
    return value === null || value === undefined;
}

export function isCheckableInput(el) {
    return el.type === "checkbox" || el.type === "radio";
}

export function isNumericInput(el) {
    return el.type === "number" || el.type === "range";
}

export function isTemplate(el) {
    return el instanceof HTMLTemplateElement;
}

export function isElement(el) {
    return el.nodeType === Node.ELEMENT_NODE;
}

export function isFunction(value) {
    return typeof value === "function";
}

export function asArray(value) {
    return isArray(value) ? value : [value];
}

export function asyncify(fn) {
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

export function listen(target, type, listener, options) {
    target.addEventListener(type, listener, options);
    return () => {
        target.removeEventListener(type, listener, options);
    };
}

export const single = (...fns) => (...args) => {
    for (const fn of fns) {
        fn && fn(...args);
    }
};

export function clone(value) {
    return typeof value === "object"
        ? JSON.parse(JSON.stringify(value))
        : value
}

export function closest(el, callback) {
    while (el) {
        if (callback(el)) {
            break;
        }

        el = el._x_teleportBack ?? el;
        el = el.parentElement;
    }

    return el;
}

export function createMap(keys) {
    return new Map(
        keys.split(",").map(v => [
            v.trim().toLowerCase(),
            v.trim()]));
}

export function looseEqual(a, b) {
    return a == b;
}

export function looseIndexOf(array, value) {
    return array.findIndex(v => v == value);
}
