import { createResizeObservable } from "@/utilities/createResizeObservable";
import { error } from "@/utilities/utils";

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

export default function({ directive, mutateDom }) {
    directive("bound", (el, { expression, value }, { effect, evaluateLater, cleanup }) => {
        if (!value) {
            error("x-bound directive ???");
            return;
        }

        expression = expression.trim();

        const property = names.get(
            value.trim().replace("-", "").toLowerCase()
            );

        expression || (expression = property);

        const getValue = createGetter(evaluateLater, expression);
        const setValue = createSetter(evaluateLater, expression);

        const updateProperty = () => el[property] !== getValue() && mutateDom(() => el[property] = getValue());
        const updateVariable = () => setValue(el[property]);

        const tagName = el.tagName.toUpperCase();

        switch (property) {
            case "value":
                processValue();
                break;

            case "checked":
                processChecked();
                break;

            case "files":
                processFiles();
                break;

            case "innerHTML":
            case "innerText":
            case "textContent":
                processContentEditable();
                break;

            case "videoHeight":
            case "videoWidth":
                processMediaSizing("VIDEO", "resize");
                break;

            case "naturalHeight":
            case "naturalWidth":
                processMediaSizing("IMG", "load");
                break;

            case "clientHeight":
            case "clientWidth":
            case "offsetHeight":
            case "offsetWidth":
                processResizable();
                break;

            case "open":
                processDetails();
                break;

            case "group":
                processGroup();
                break;
        }

        function processValue() {
            switch (tagName) {
                case "INPUT":
                case "TEXTAREA":
                    effect(updateProperty);
                    cleanup(listen(el, "input", updateVariable));
                    break;

                case "SELECT":
                    effect(() => applySelectValues(el, getValue() ?? []));
                    cleanup(listen(el, "change", () => setValue(collectSelectedValues(el))));
                    break;
            }
        }

        function processChecked() {
            if (isCheckable(el)) {
                effect(updateProperty);
                cleanup(listen(el, "change", updateVariable));
            }
        }

        function processFiles() {
            if (tagName === "INPUT" && el.type === "file") {
                cleanup(listen(el, "input", updateVariable));
            }
        }

        function processContentEditable() {
            if (el.hasAttribute("contenteditable")) {
                effect(updateProperty);
                cleanup(listen(el, "input", updateVariable));
            }
        }

        function processMediaSizing(name, eventName) {
            if (tagName === name) {
                updateVariable();
                cleanup(listen(el, eventName, updateVariable));
            }
        }

        function processResizable() {
            cleanup(createResizeObservable(el, updateVariable));
        }

        function processDetails() {
            if (tagName === "DETAILS") {
                effect(updateProperty);
                cleanup(listen(el, "toggle", updateVariable));
            }
        }

        function processGroup() {
            if (isCheckable(el)) {
                el.name || mutateDom(() => el.name = expression);

                effect(() =>
                    mutateDom(() =>
                        applyGroupValues(el, getValue() ?? [])));

                cleanup(listen(el, "input", () => setValue(collectGroupValues(el, getValue()))));
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
