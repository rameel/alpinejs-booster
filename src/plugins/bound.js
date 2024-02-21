import { createGetter, createSetter } from "@/utilities/evaluator";
import { observeResize } from "@/utilities/observeResize";
import { watch } from "@/utilities/watch";
import {
    asArray,
    clone,
    closest,
    createMap,
    hasModifier,
    isArray,
    isCheckableInput,
    isNullish,
    isNumericInput,
    listen,
    looseEqual,
    looseIndexOf,
    warn
} from "@/utilities/utils";

const canonicalNames = createMap(
    "value,checked,files," +
    "innerHTML,innerText,textContent," +
    "videoHeight,videoWidth," +
    "naturalHeight,naturalWidth," +
    "clientHeight,clientWidth,offsetHeight,offsetWidth," +
    "open," +
    "group");

export default function({ directive, entangle, evaluateLater, mapAttributes, mutateDom, prefixed }) {
    // creating a shortcut for the directive,
    // when an attribute name starting with & will refer to our directive,
    // allowing us to write like this: &value="prop",
    // which is equivalent to x-bound:value="prop"
    mapAttributes(attr => ({
        name: attr.name.replace(/^&/, () => prefixed("bound:")),
        value: attr.value
    }));

    directive("bound", (el, { expression, value, modifiers }, { effect, cleanup }) => {
        if (!value) {
            warn("x-bound directive expects the presence of a bound property name");
            return;
        }

        expression = expression?.trim();

        // since attributes come in a lowercase,
        // we need to convert the bound property name to its canonical form
        const property = canonicalNames.get(
            value.trim().replace("-", "").toLowerCase());

        // if the expression is omitted, then we assume it corresponds
        // to the bound property name, allowing us to write expressions more concisely,
        // and write &value instead of &value="value"
        expression ||= property;

        const getValue = createGetter(evaluateLater, el, expression);
        const setValue = createSetter(evaluateLater, el, expression);

        const updateProperty = () => looseEqual(el[property], getValue()) || mutateDom(() => el[property] = getValue());
        const updateVariable = () => setValue(isNumericInput(el) ? toNumber(el[property]) : el[property]);

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
                processed = processContenteditable();
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
                processed = processDimensions();
                break;

            case "open":
                processed = processDetails();
                break;

            case "group":
                processed = processGroup();
                break;
        }

        if (!processed) {
            const modifier =
                hasModifier(modifiers, "in")  ? "in"  :
                hasModifier(modifiers, "out") ? "out" : "inout";

            const sourceEl = expression === value
                ? closest(el.parentNode, node => node._x_dataStack)
                : el;

            if (!el._x_dataStack) {
                warn("x-bound directive requires the presence of the x-data directive to bind component properties");
                return;
            }

            if (!sourceEl) {
                warn(`x-bound directive cannot find the parent scope where the '${ value }' property is defined`);
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
                    // if the value of the bound property is "null" or "undefined",
                    // we initialize it with the value from the element.
                    isNullish(getValue()) && updateVariable();

                    effect(updateProperty);
                    cleanup(listen(el, "input", updateVariable));
                    return true;

                case "SELECT":
                    // WORKAROUND:
                    // For the select element, there might be a situation
                    // where options are generated dynamically using the x-for directive,
                    // and in this case, attempting to set the "value" property
                    // will have no effect since there are no options yet.
                    // Therefore, we use a small trick to set the value a bit later
                    // when the x-for directive has finished its work.
                    queueMicrotask(() => {
                        // if the value of the bound property is "null" or "undefined",
                        // we initialize it with the value from the element.
                        isNullish(getValue()) && updateVariable();

                        effect(() => applySelectValues(el, asArray(getValue() ?? [])));
                        cleanup(listen(el, "change", () => setValue(collectSelectedValues(el))));
                    });
                    return true;
            }
        }

        function processChecked() {
            if (isCheckableInput(el)) {
                effect(updateProperty);
                cleanup(listen(el, "change", updateVariable));
                return true;
            }
        }

        function processFiles() {
            if (el.type === "file") {
                cleanup(listen(el, "input", updateVariable));
                return true;
            }
        }

        function processContenteditable() {
            if (el.contentEditable === "true") {
                isNullish(getValue()) && updateVariable();

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

        function processDimensions() {
            cleanup(observeResize(el, updateVariable));
            return true;
        }

        function processDetails() {
            if (tagName === "DETAILS") {
                // if the value of the bound property is "null" or "undefined",
                // we initialize it with the value from the element.
                isNullish(getValue()) && updateVariable();

                effect(updateProperty);
                cleanup(listen(el, "toggle", updateVariable));
                return true;
            }
        }

        function processGroup() {
            if (isCheckableInput(el)) {
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

function toNumber(value) {
    return value === "" ? null : +value;
}

function applySelectValues(el, values) {
    for (const option of el.options) {
        option.selected = looseIndexOf(values, option.value) >= 0;
    }
}

function collectSelectedValues(el) {
    if (el.multiple) {
        return [...el.selectedOptions].map(o => o.value);
    }

    return el.value;
}

function applyGroupValues(el, values) {
    el.checked = isArray(values)
        ? looseIndexOf(values, el.value) >= 0
        : looseEqual(el.value, values);
}

function collectGroupValues(el, values) {
    if (el.type === "radio") {
        return el.value;
    }

    values = asArray(values);
    const index = looseIndexOf(values, el.value);

    if (el.checked) {
        index >= 0 || values.push(el.value);
    }
    else {
        index >= 0 && values.splice(index, 1);
    }

    return values;
}
