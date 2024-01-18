import { html, test } from "../utils";

test("x-format", html`
    <main x-data="{ name: 'Foo', title: 'Bar' }" x-format>
        [{{ name }},{{ title }}]
    </main>`, ({ get }) => {

    get("main").should("contain.text", "[Foo,Bar]");
});

test("x-format: recursively", html`
    <main x-data="{ name: 'Foo', title: 'Bar' }" x-format>
        [<span>{{ name }}</span>,<span>{{ title }}</span>]
    </main>`, ({ get }) => {

    get("main").should("contain.text", "[Foo,Bar]");
});

test("x-format: attributes", html`
    <main x-data="{ name: 'Foo', title: 'Bar' }" x-format>
        [<i title="({{ name }}:{{ title }})">{{ name }},{{ title }}</i>]
    </main>`, ({ get }) => {

    get("main").should("contain.text", "[Foo,Bar]");
    get("main i").should("have.attr", "title").and("eq", "(Foo:Bar)");
});
