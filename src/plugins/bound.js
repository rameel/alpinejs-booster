import { createGetter, createSetter } from "@/utilities/evaluator";
import { observeResize } from "@/utilities/observeResize";
import { clone, closest, listen, warn } from "@/utilities/utils";
import { watch } from "@/utilities/watch";

const names = new Map(
    [
        "value",
        "checked",
        "files",

        "innerHTML",
        "innerText",
        "textContent",

        "videoHeight",
        "videoWidth",

        "naturalHeight",
        "naturalWidth",

        "clientHeight",
        "clientWidth",
        "offsetHeight",
        "offsetWidth",

        "open",

        "group"
    ].map(v => [v.toLowerCase(), v])
);

export default function({ directive, entangle, evaluateLater, mapAttributes, mutateDom, prefixed }) {
    mapAttributes(({ name, value }) => ({
        name: name.replace(/^&/, () => prefixed("bound:")),
        value
    }));

    directive("bound", (el, { expression, value, modifiers }, { effect, cleanup }) => {
        if (!value) {
            warn("x-bound directive ???");
            return;
        }

        expression = expression?.trim();
        expression ||= value;

        const property = names.get(
            value.trim().replace("-", "").toLowerCase()
            );

        expression || (expression = property);

        const getValue = createGetter(evaluateLater, el, expression);
        const setValue = createSetter(evaluateLater, el, expression);

        const updateProperty = () => el[property] !== getValue() && mutateDom(() => el[property] = getValue());
        const updateVariable = () => setValue(el[property]);

        const tagName = el.tagName.toUpperCase();

        let processed;

        switch (property) {
            case "value":
                processed = processValue();
                break;

            case "checked":
                processed = processChecked();
                break;

            case "files":
                processed = processFiles();
                break;

            case "innerHTML":
            case "innerText":
            case "textContent":
                processed = processContentEditable();
                break;

            case "videoHeight":
            case "videoWidth":
                processed = processMediaSizing("VIDEO", "resize");
                break;

            case "naturalHeight":
            case "naturalWidth":
                processed = processMediaSizing("IMG", "load");
                break;

            case "clientHeight":
            case "clientWidth":
            case "offsetHeight":
            case "offsetWidth":
                processed = processResizable();
                break;

            case "open":
                processed = processDetails();
                break;

            case "group":
                processed = processGroup();
                break;
        }

        if (!processed) {
            const modifier = modifiers.includes("in")  ? "in"  :
                             modifiers.includes("out") ? "out" : "inout";

            const sourceEl = expression === value
                ? closest(el.parentNode, node => node._x_dataStack)
                : el;

            if (!el._x_dataStack || !sourceEl) {
                warn("x-bound directive ???");
                return;
            }

            const source = {
                get: createGetter(evaluateLater, sourceEl, expression),
                set: createSetter(evaluateLater, sourceEl, expression),
            };

            const target = {
                get: createGetter(evaluateLater, el, value),
                set: createSetter(evaluateLater, el, value),
            };

            switch (modifier) {
                case "in":
                    cleanup(watch(() => source.get(), v => target.set(clone(v))));
                    break;
                case "out":
                    cleanup(watch(() => target.get(), v => source.set(clone(v))));
                    break;
                default:
                    cleanup(entangle(source, target));
                    break;
            }
        }

        function processValue() {
            switch (tagName) {
                case "INPUT":
                case "TEXTAREA":
                    effect(updateProperty);
                    cleanup(listen(el, "input", updateVariable));
                    return true;

                case "SELECT":
                    effect(() => applySelectValues(el, getValue() ?? []));
                    cleanup(listen(el, "change", () => setValue(collectSelectedValues(el))));
                    return true;
            }
        }

        function processChecked() {
            if (isCheckable(el)) {
                effect(updateProperty);
                cleanup(listen(el, "change", updateVariable));
                return true;
            }
        }

        function processFiles() {
            if (tagName === "INPUT" && el.type === "file") {
                cleanup(listen(el, "input", updateVariable));
                return true;
            }
        }

        function processContentEditable() {
            if (el.hasAttribute("contenteditable")) {
                effect(updateProperty);
                cleanup(listen(el, "input", updateVariable));
                return true;
            }
        }

        function processMediaSizing(name, eventName) {
            if (tagName === name) {
                updateVariable();
                cleanup(listen(el, eventName, updateVariable));
                return true;
            }
        }

        function processResizable() {
            cleanup(observeResize(el, updateVariable));
            return true;
        }

        function processDetails() {
            if (tagName === "DETAILS") {
                effect(updateProperty);
                cleanup(listen(el, "toggle", updateVariable));
                return true;
            }
        }

        function processGroup() {
            if (isCheckable(el)) {
                el.name || mutateDom(() => el.name = expression);

                effect(() =>
                    mutateDom(() =>
                        applyGroupValues(el, getValue() ?? [])));

                cleanup(listen(el, "input", () => setValue(collectGroupValues(el, getValue()))));
                return true;
            }
        }
    });
}

function isCheckable(el) {
    return el.tagName === "INPUT" && (el.type === "checkbox" || el.type === "radio");
}

function applySelectValues(el, values) {
    for (const option of el.options) {
        option.selected = values.indexOf(option.value || option.text) >= 0;
    }
}

function collectSelectedValues(el) {
    if (el.multiple) {
        return [...el.selectedOptions.map(o => o.value || o.text)];
    }

    return el.value;
}

function applyGroupValues(el, values) {
    switch (el.type) {
        case "checkbox":
            el.checked = values.indexOf(el.value) >= 0;
            break;

        case "radio":
            el.checked = Array.isArray(values)
                ? values.indexOf(el.value) >= 0
                : el.value === values;
            break;
    }
}

function collectGroupValues(el, values) {
    if (el.type === "radio") {
        return el.value;
    }

    Array.isArray(values) || (values = [values]);
    const index = values.indexOf(el.value);

    if (el.checked) {
        index >= 0 || values.push(el.value);
    }
    else {
        index >= 0 && values.splice(index, 1);
    }

    return values;
}
