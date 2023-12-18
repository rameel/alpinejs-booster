export function warn(...args) {
    console.warn("alpinejs-booster:", ...args);
}

export function error(...args) {
    console.error("alpinejs-booster:", ...args);
}

export function isTemplate(el) {
    return el.tagName === "TEMPLATE";
}

export function isElement(el) {
    return el.nodeType === Node.ELEMENT_NODE;
}
