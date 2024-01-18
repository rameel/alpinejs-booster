import { html, test } from "../utils";

test("x-match", html`
    <main x-data="{ value: 1 }">
        <button @click="value++">Increment</button>

        <template x-match>
            <template x-case="value == 1">1</template>
            <template x-case="value == 2">2</template>
            <template x-case="value == 3">3</template>
            <template x-default>Other</template>
        </template>
    </main>`, ({ get }) => {

    get("main").should("contain.text", "1");

    get("button").click();
    get("main").should("contain.text", "2");

    get("button").click();
    get("main").should("contain.text", "3");

    get("button").click();
    get("main").should("contain.text", "Other");
});

test("x-match: x-for", html`
    <main x-data="{ items: [1,2,3,4] }">
        <template x-for="item in items">
            <template x-match>
                <template x-case="item == 1">[<span>1</span>]</template>
                <template x-case="item == 2">[<span>2</span>]</template>
                <template x-case="item == 3">[<span>3</span>]</template>
                <template x-default>[<span>Other</span>]</template>
            </template>
        </template>
    </main>`, ({ get }) => {

    get("main").should("contain.text", "[1][2][3][Other]");
});

test("x-match: scope propogation", html`
    <main x-data="{ items: [1,2,3,4] }">
        <template x-for="item in items">
            <template x-match>
                <template x-case="item == 1">[<span x-text="item"></span>]</template>
                <template x-case="item == 2">[<span x-text="item"></span>]</template>
                <template x-case="item == 3">[<span x-text="item"></span>]</template>
                <template x-default>[<span>Other</span>]</template>
            </template>
        </template>
    </main>`, ({ get }) => {

    get("main").should("contain.text", "[1][2][3][Other]");
});

test("x-match: non-template element on x-case arms", html`
    <main x-data="{ items: [1,2,3,4] }">
        <template x-for="item in items">
            <template x-match>
                <span x-case="item == 1">[<span x-text="item"></span>]</span>
                <span x-case="item == 2">[<span x-text="item"></span>]</span>
                <span x-case="item == 3">[<span x-text="item"></span>]</span>
                <span x-default>[<span>Other</span>]</span>
            </template>
        </template>
    </main>`, ({ get }) => {

    get("main").should("contain.text", "[1][2][3][Other]");
});
