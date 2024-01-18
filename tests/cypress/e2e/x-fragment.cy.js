import { html, test } from "../utils";

test("x-fragment", html`
    <main x-data="{ show: true }">
        <button @click="show = !show">Toggle</button>
        <template x-if="show">
            <template x-fragment>
                Before <span>Content</span> After
            </template>
        </template>
    </main>`, ({ get }) => {

    get("main").should("contain.text", "Before Content After");

    get("button").click();
    get("main").should("not.contain.text", "Before Content After");

    get("button").click();
    get("main").should("contain.text", "Before Content After");
});

test("x-fragment: scope propogation", html`
    <main x-data="{ items: [{ title: 'TITLE' }] }">
        <template x-for="item in items">
            <template x-fragment>
                Before <span x-format>[{{ item.title }}]</span> After
            </template>
        </template>
    </main>`, ({ get }) => {

    get("main").should("contain.text", "Before [TITLE] After");
});
