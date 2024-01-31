import { html, test } from "../utils";

test("x-template", html`
    <template id="tpl">
        <template x-if="show">
            <span x-format>{{ value }}</span>
        </template>
    </template>
    <main x-data="{ value: 'Foo', show: true }">
        <div x-template="tpl"></div>
    </main>`, ({ get }) => {

    get("main span").should("contain.text", "Foo");
});
