export function format({ directive, mutateDom }) {
    directive("format", (el, { modifiers }, { effect, evaluate }) => {
        const placeholderRegex = /{{(?<expr>.+?)}}/g;
        const isOnce = modifiers.includes("once");

        function update(callback) {
            if (isOnce) {
                mutateDom(() => {
                    callback();
                });
            }
            else {
                effect(() => {
                    mutateDom(() => {
                        callback();
                    });
                });
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
                        const text = document.createTextNode("");
                        fragment.appendChild(text);
                        update(() => text.textContent = evaluate(tokens[i]));
                    }
                }

                mutateDom(() => {
                    node.parentElement.replaceChild(fragment, node);
                })
            }
        }

        function processAttributes(node) {
            for (let attr of node.attributes) {
                const matches = [...attr.value.matchAll(placeholderRegex)];
                if (matches.length) {
                    const template = attr.value;
                    update(() => attr.value = template.replace(placeholderRegex, (_, expr) => evaluate(expr)));
                }
            }
        }

        function processNodes(node) {
            for (let child of node.childNodes) {
                process(child);
            }
        }

        process(el);
    });
}
