import { createGetter } from "@/utilities/evaluator";
import { isNullish } from "@/utilities/utils";

export default function({ directive, mutateDom }) {
    directive("format", (el, { modifiers }, { effect, evaluateLater }) => {
        const cache = new Map;
        const placeholderRegex = /{{(?<expr>.+?)}}/g;
        const isOnce = modifiers.includes("once");

        process(el);

        function createEval(expression) {
            let getter = cache.get(expression);
            if (isNullish(getter)) {
                getter = createGetter(evaluateLater, expression);
                cache.set(expression, getter);
            }

            return getter;
        }

        function update(callback) {
            if (isOnce) {
                mutateDom(() => callback());
                cache.clear();
            }
            else {
                effect(() => mutateDom(() => callback()));
            }
        }

        function process(node) {
            switch (node.nodeType) {
                case Node.TEXT_NODE:
                    processTextNode(node);
                    break;

                case Node.ELEMENT_NODE:
                    processNodes(node);
                    processAttributes(node);
                    break;
            }
        }

        function processTextNode(node) {
            const tokens = node.textContent.split(placeholderRegex);

            if (tokens.length > 1) {
                const fragment = new DocumentFragment();

                for (let i = 0; i < tokens.length; i++) {
                    if ((i % 2) === 0) {
                        fragment.appendChild(document.createTextNode(tokens[i]));
                    }
                    else {
                        const getValue = createEval(tokens[i]);
                        const text = document.createTextNode("");

                        fragment.append(text);
                        update(() => text.textContent = getValue());
                    }
                }

                mutateDom(() =>
                    node.parentElement.replaceChild(fragment, node));
            }
        }

        function processAttributes(node) {
            for (let attr of node.attributes) {
                const matches = [...attr.value.matchAll(placeholderRegex)];
                if (matches.length) {
                    const template = attr.value;
                    update(() => attr.value = template.replace(placeholderRegex, (_, expr) => createEval(expr)()));
                }
            }
        }

        function processNodes(node) {
            for (let child of node.childNodes) {
                process(child);
            }
        }
    });
}
