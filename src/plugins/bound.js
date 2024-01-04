import { error } from "@/utilities/utils";

const names = new Map(
    [
        "value",
        "checked",
        "files",

        "innerHTML",
        "innerText",
        "textContent",

        "open"
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

            case "open":
                processDetails();
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

        function processDetails() {
            if (tagName === "DETAILS") {
                effect(updateProperty);
                cleanup(listen(el, "toggle", updateVariable));
            }
        }
    });
}

function isCheckable(el) {
    return el.nodeName === "INPUT" && (el.type === "checkbox" || el.type === "radio");
}

function applySelectValues(el, values) {
    for (const option of el.options) {
        option.selected = values.indexOf(option.value || option.text) >= 0;
    }
}

function collectSelectedValues(el) {
    if (el.multiple) {
        const values = [];
        for (const option of el.selectedOptions) {
            values.push(option.value || option.text);
        }
        return values;
    }

    return el.value;
}
