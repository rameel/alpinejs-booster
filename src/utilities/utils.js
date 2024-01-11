export function warn(...args) {
    console.warn("alpinejs-booster:", ...args);
}

export function error(...args) {
    console.error("alpinejs-booster:", ...args);
}

export function isNullish(value) {
    return value === null || value === undefined;
}

export function isTemplate(el) {
    return el.tagName === "TEMPLATE";
}

export function isElement(el) {
    return el.nodeType === Node.ELEMENT_NODE;
}

export function isFunction(value) {
    return typeof(value) === "function";
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
