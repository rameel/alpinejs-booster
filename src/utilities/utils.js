export function assert(value, message) {
    if (__DEV && !value) {
        throw new Error(message || "Assertion failed");
    }
}

export function warn(...args) {
    console.warn("alpinejs-booster:", ...args);
}

export function isNullish(value) {
    return value === null || value === undefined;
}

export function isTemplate(el) {
    return el instanceof HTMLTemplateElement;
}

export function isElement(el) {
    return el.nodeType === Node.ELEMENT_NODE;
}

export function isFunction(value) {
    return typeof(value) === "function";
}

export function asArray(value) {
    return Array.isArray(value) ? value : [value];
}

export function asyncify(fn) {
    if (isFunction(fn) && fn.constructor?.name === "AsyncFunction") {
        return fn;
    }

    return function(...args) {
        const result = fn.apply(this, args);
        if (isFunction(result.then)) {
            return result;
        }

        return Promise.resolve(result);
    }
}

export function listen(target, type, listener, ...args) {
    target.addEventListener(type, listener, ...args);
    return () => {
        target.removeEventListener(type, listener, ...args);
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
