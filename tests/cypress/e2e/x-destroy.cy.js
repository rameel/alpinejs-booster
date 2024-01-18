import { html, test } from "../utils";

test("x-destroy", html`
    <main x-data="{ value: 'Foo', show: true }">
        <span x-text="value"></span>
        <template x-when="show">
            <i x-destroy="value = 'Bar'"></i>
        </template>
        <button @click="show = false">Hide</button>
    </main>`, ({ get }) => {

    get("span").should("contain.text", "Foo");
    get("button").click();
    get("span").should("contain.text", "Bar");
});
