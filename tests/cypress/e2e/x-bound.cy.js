import { html, group, test } from "../utils";

group("x-bound: checkbox", () => {
    test("checkbox", html`
        <div x-data="{ checked: true }">
            <input type="checkbox" &checked />
            <span x-format>{{ checked }}</span>
        </div>`, ({ get }) => {

        get(":checkbox").should("be.checked");
        get("span").should("have.text", "true");
        get(":checkbox").click();
        get(":checkbox").should("not.be.checked");
        get("span").should("have.text", "false");
    });
});

group("x-bound: input", () => {
    test("input", html`
        <div x-data="{ value: 'John' }">
            <input &value />
            <button @click="value = 'Smith'">Click</button>
            <span x-format>{{ value }}</span>
        </div>`, ({ get }) => {

        get("input").should("have.value", "John");
        get("span").should("have.text", "John");

        get("button").click();
        get("input").should("have.value", "Smith");
        get("span").should("have.text", "Smith");

        get("input").clear().type("John Smith");
        get("input").should("have.value", "John Smith");
        get("span").should("have.text", "John Smith");
    });

    test("initialize from element when property is null", html`
        <div x-data="{ value: null }">
            <input &value value="John" />
            <span x-format>{{ value }}</span>
        </div>`, ({ get }) => {

        get("input").should("have.value", "John");
        get("span").should("have.text", "John");
    });

    test("initialize from element when property is undefined", html`
        <div x-data="{ value: undefined }">
            <input &value value="John" />
            <span x-format>{{ value }}</span>
        </div>`, ({ get }) => {

        get("input").should("have.value", "John");
        get("span").should("have.text", "John");
    });
});

group("x-bound: select", () => {
    test("select", html`
        <div x-data="{ value: '2' }">
            <select &value>
                <option value="1">One</option>
                <option value="2">Two</option>
                <option value="3">Three</option>
            </select>
            <button @click="value = '3'">Click</button>
            <span x-format>{{ value }}</span>
        </div>`, ({ get }) => {

        get("select").should("have.value", "2");
        get("span").should("have.text", "2");

        get("button").click();
        get("select").should("have.value", "3");
        get("span").should("have.text", "3");

        get("select").select("1");
        get("select").should("have.value", "1");
        get("span").should("have.text", "1");
    });

    test("select (render options)", html`
        <div x-data="{ value: '2', options: ['1', '2', '3'] }">
            <select &value>
                <template x-for="v in options">
                    <option :value="v" x-text="v"></option>
                </template>
            </select>
            <button @click="value = '3'">Click</button>
            <span x-format>{{ value }}</span>
        </div>`, ({ get }) => {

        get("select").should("have.value", "2");
        get("span").should("have.text", "2");

        get("button").click();
        get("select").should("have.value", "3");
        get("span").should("have.text", "3");

        get("select").select("1");
        get("select").should("have.value", "1");
        get("span").should("have.text", "1");
    });

    test("initialize from element when property is null", html`
        <div x-data="{ value: null }">
            <select &value>
                <option value="1">One</option>
                <option value="2" selected>Two</option>
                <option value="3">Three</option>
            </select>
            <span x-format>{{ value }}</span>
        </div>`, ({ get }) => {

        get("select").should("have.value", "2");
        get("span").should("have.text", "2");
    });

    test("initialize from element when property is undefined", html`
        <div x-data="{ value: undefined }">
            <select &value>
                <option value="1">One</option>
                <option value="2" selected>Two</option>
                <option value="3">Three</option>
            </select>
            <span x-format>{{ value }}</span>
        </div>`, ({ get }) => {

        get("select").should("have.value", "2");
        get("span").should("have.text", "2");
    });

    test("select multiple", html`
        <div x-data="{ value: ['One', 'Three'], options: ['One', 'Two', 'Three'] }">
            <select &value multiple>
                <template x-for="option in options">
                    <option :value="option" x-text="option"></option>
                </template>
            </select>
            <span x-format>{{ JSON.stringify(value) }}</span>
        </div>`, ({ get }) => {

        get("select").invoke("val").should("deep.equal", ["One", "Three"]);
        get("span").should("have.text", `["One","Three"]`);

        get("select").select(["Two", "Three"]);
        get("select").invoke("val").should("deep.equal", ["Two", "Three"]);
        get("span").should("have.text", `["Two","Three"]`);

        get("select").select([]);
        get("select").invoke("val").should("deep.equal", []);
        get("span").should("have.text", `[]`);
    });

    test("select multiple (from primitive value)", html`
        <div x-data="{ value: 'Two', options: ['One', 'Two', 'Three'] }">
            <select &value multiple>
                <template x-for="option in options">
                    <option :value="option" x-text="option"></option>
                </template>
            </select>
            <span x-format>{{ JSON.stringify(value) }}</span>
        </div>`, ({ get }) => {

        get("select").invoke("val").should("deep.equal", ["Two"]);
        get("span").should("have.text", `"Two"`);

        get("select").select([]);
        get("select").invoke("val").should("deep.equal", []);
        get("span").should("have.text", `[]`);

        get("select").select(["Two", "Three"]);
        get("select").invoke("val").should("deep.equal", ["Two", "Three"]);
        get("span").should("have.text", `["Two","Three"]`);
    });
});

group("x-bound: contenteditable", () => {
    test("innerHTML", html`
        <div x-data="{ innerHTML: '<h1>Sample</h1>' }">
            <pre contenteditable &innerHTML></pre>
            <button @click="innerHTML='Hello!'">Click</button>
            <span x-format>{{ innerHTML }}</pre>
        </div>`, ({ get }) => {

        get("span").should("contain.text", "<h1>Sample</h1>")
        get("button").click();
        get("span").should("contain.text", "Hello!")
        get("pre").clear().type("Hello World!");
        get("span").should("contain.text", "Hello World!")
    });

    test("innerHTML (initliaze from element when property is null)", html`
        <div x-data="{ innerHTML: null }">
            <pre contenteditable &innerHTML>Hello!</pre>
            <span x-format>{{ innerHTML }}</pre>
        </div>`, ({ get }) => {

        get("span").should("contain.text", "Hello!")
    });

    test("innerText", html`
        <div x-data="{ innerText: 'Sample' }">
            <pre contenteditable &innerText></pre>
            <button @click="innerText='Hello!'">Click</button>
            <span x-format>{{ innerText }}</pre>
        </div>`, ({ get }) => {

        get("span").should("contain.text", "Sample")
        get("button").click();
        get("span").should("contain.text", "Hello!")
        get("pre").clear().type("Hello World!");
        get("span").should("contain.text", "Hello World!")
    });

    test("innerText (initliaze from element when property is null)", html`
        <div x-data="{ innerText: null }">
            <pre contenteditable &innerText>Hello!</pre>
            <span x-format>{{ innerText }}</pre>
        </div>`, ({ get }) => {

        get("span").should("contain.text", "Hello!")
    });

    test("textContent", html`
        <div x-data="{ textContent: 'Sample' }">
            <pre contenteditable &textContent></pre>
            <button @click="textContent='Hello!'">Click</button>
            <span x-format>{{ textContent }}</pre>
        </div>`, ({ get }) => {

        get("span").should("contain.text", "Sample")
        get("button").click();
        get("span").should("contain.text", "Hello!")
        get("pre").clear().type("Hello World!");
        get("span").should("contain.text", "Hello World!")
    });

    test("textContent (initliaze from element when property is null)", html`
        <div x-data="{ textContent: null }">
            <pre contenteditable &textContent>Hello!</pre>
            <span x-format>{{ textContent }}</pre>
        </div>`, ({ get }) => {

        get("span").should("contain.text", "Hello!")
    });
});
