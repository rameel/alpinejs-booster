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

export function listen(target, type, listener, ...args) {
    target.addEventListener(type, listener, ...args);
    return () => {
        target.removeEventListener(type, listener, ...args);
    };
}
