import { assert, describe, expect, test } from "vitest";
import { createMatcher } from "../../utilities/createMatcher";

describe("createMatcher", () => {
    test("pattern: ignores edge slashes", () => {
        let match1 = createMatcher("/home");
        let match2 = createMatcher("home/");
        let match3 = createMatcher("/home/");
        let match4 = createMatcher("home");

        [match1, match2, match3, match4].forEach(match => {
            expect(match("/home")).toBeTruthy();
            expect(match("/home/")).toBeTruthy();
            expect(match("home/")).toBeTruthy();
            expect(match("home")).toBeTruthy();
        });

        let match5 = createMatcher("/");
        let match6 = createMatcher("");

        [match5, match6].forEach(match => expect(match("/")).toBeTruthy());
    });

    test("path: ignores trailing slashes", () => {
        let match1 = createMatcher("/home");
        let match2 = createMatcher("/home/");

        [match1, match2].forEach(match => {
            expect(match("/home")).toBeTruthy();
            expect(match("/home/")).toBeTruthy();
            expect(match("home/")).toBeTruthy();
            expect(match("home")).toBeTruthy();
        });
    });

    test("match: /", () => {
        let match = createMatcher("/");
        expect(match("/")).toBeTruthy();
        expect(match("/home")).toBeNull();
    });

    test("match: /index", () => {
        let match = createMatcher("/index");
        expect(match("/index")).toBeTruthy();
        expect(match("/index/")).toBeTruthy();
        expect(match("/index1")).toBeNull();
        expect(match("/inde")).toBeNull();
        expect(match("/indexx")).toBeNull();
        expect(match("/index/value")).toBeNull();
    });

    test("match: /home/index", () => {
        let match = createMatcher("/home/index");
        expect(match("/home/index")).toBeTruthy();
        expect(match("/home/index/")).toBeTruthy();
        expect(match("/door/index")).toBeNull();
        expect(match("/index")).toBeNull();
        expect(match("/home/index1")).toBeNull();
        expect(match("/home/")).toBeNull();
    });

    test("match: /{controller}/{action}/{id}", () => {
        let match = createMatcher("/{controller}/{action}/{id}");
        let parameters = match("products/display/10");

        expect(parameters).toBeTruthy();
        expect(parameters).toEqual({
            controller: "products",
            action: "display",
            id: "10"
        });

        expect(match("/home")).toBeNull();
        expect(match("/home/index")).toBeNull();
        expect(match("/controller/action/index/value")).toBeNull();
    });

    test("match: /{path*}", () => {
        let match = createMatcher("/{path*}");

        expect(match("/products/display/10")).toEqual({
            path: ["products", "display", "10"]
        });

        expect(match("/products/display")).toEqual({
            path: ["products", "display"]
        });

        expect(match("/products")).toEqual({
            path: ["products"]
        });

        expect(match("/")).toEqual({
            path: []
        });
    });

    test("match: /{path*:=(10)", () => {
        let match = createMatcher("/{path*:=(10)}");

        expect(match("/products/display/10")).toEqual({
            path: ["products", "display", "10"]
        });

        expect(match("/products/display")).toEqual({
            path: ["products", "display"]
        });

        expect(match("/products")).toEqual({
            path: ["products"]
        });

        expect(match("/")).toEqual({
            path: ["10"]
        });
    });

    test("match: /{path+}", () => {
        let match = createMatcher("/{path+}");

        expect(match("/products/display/10")).toEqual({
            path: ["products", "display", "10"]
        });

        expect(match("/products/display")).toEqual({
            path: ["products", "display"]
        });

        expect(match("/products")).toEqual({
            path: ["products"]
        });

        expect(match("/")).toBeNull();
    });

    test("match: /{id?}", () => {
        let match = createMatcher("/{id?}");
        expect(match("/")).toEqual({ id: undefined });
        expect(match("/10")).toEqual({ id: "10" });
    });

    test("match: /{a?}/{b?}/{c?}", () => {
        let match = createMatcher("/{a?}/{b?}/{c?}");
        expect(match("/")).toEqual({ a: undefined, b: undefined, c: undefined });
        expect(match("/1")).toEqual({ a: "1", b: undefined, c: undefined });
        expect(match("/1/2")).toEqual({ a: "1", b: "2", c: undefined });
        expect(match("/1/2/3")).toEqual({ a: "1", b: "2", c: "3" });
        expect(match("/1/2/3/4")).toBeNull();
    });

    test("match: /{a}/{b?}/{c?}", () => {
        let match = createMatcher("/{a}/{b?}/{c?}");
        expect(match("/1")).toEqual({ a: "1", b: undefined, c: undefined });
        expect(match("/1/2")).toEqual({ a: "1", b: "2", c: undefined });
        expect(match("/1/2/3")).toEqual({ a: "1", b: "2", c: "3" });

        expect(match("/")).toBeNull();
        expect(match("/1/2/3/4")).toBeNull();
    });

    test("match: /{a?}/{b}/{c?}", () => {
        let match = createMatcher("/{a?}/{b}/{c?}");
        expect(match("/2")).toEqual({ a: undefined, b: "2", c: undefined });
        expect(match("/1/2")).toEqual({ a: "1", b: "2", c: undefined });
        expect(match("/1/2/3")).toEqual({ a: "1", b: "2", c: "3" });

        expect(match("/")).toBeNull();
        expect(match("/1/2/3/4")).toBeNull();
    });

    test("match: /a/{a}/b/{b}/c/{c}", () => {
        let match = createMatcher("/a/{a}/b/{b}/c/{c}");
        expect(match("/a/1/b/2/c/3")).toEqual({ a: "1", b: "2", c: "3" });

        expect(match("/x/1/b/c/3")).toBeNull();
        expect(match("/a/b/c")).toBeNull();
        expect(match("/a/1/b/2/c")).toBeNull();
        expect(match("/a/1/b/c/3")).toBeNull();
    });

    test("match: /a={a}/b={b}/c={c}", () => {
        let match = createMatcher("/a={a}/b={b}/c={c}");
        expect(match("/a=1/b=2/c=3")).toEqual({ a: "1", b: "2", c: "3" });

        expect(match("/a=1/b=/c=3")).toBeNull();
        expect(match("/a=1/c=3")).toBeNull();
        expect(match("/a=/b=2/c=3")).toBeNull();
        expect(match("/b=2/c=3")).toBeNull();
        expect(match("/a=1/b=2")).toBeNull();
    });

    test("match: /a={a}_b={b}_c={c}", () => {
        let match = createMatcher("/a={a}_b={b}_c={c}");
        expect(match("/a=1_b=2_c=3")).toEqual({ a: "1", b: "2", c: "3" });

        expect(match("/a=1_b=_c=3")).toBeNull();
        expect(match("/a=1_c=3")).toBeNull();
        expect(match("/a=_b=2_c=3")).toBeNull();
        expect(match("/b=2_c=3")).toBeNull();
        expect(match("/a=1_b=2")).toBeNull();
    });

    test("match: /a={a?}_b={b?}_c={c?}", () => {
        let match = createMatcher("/a={a?}_b={b?}_c={c?}");
        expect(match("/a=_b=_c=")).toEqual({ a: undefined, b: undefined, c: undefined });
        expect(match("/a=_b=2_c=")).toEqual({ a: undefined, b: "2", c: undefined });
        expect(match("/a=_b=2_c=3")).toEqual({ a: undefined, b: "2", c: "3" });
        expect(match("/a=1_b=2_c=")).toEqual({ a: "1", b: "2", c: undefined });

        expect(match("/a=1_c=3")).toBeNull();
        expect(match("/b=2_c=3")).toBeNull();
        expect(match("/a=1_b=2")).toBeNull();
    });

    test("match: /action/{id?}", () => {
        let match = createMatcher("/action/{id?}");

        expect(match("/action")).toEqual({ id: undefined });
        expect(match("/action/1")).toEqual({ id: "1" });
    });

    test("default parameter: /{id?:=(10)}", () => {
        let match = createMatcher("/{id?:=(10)}");

        expect(match("/")).toEqual({ id: "10" });
        expect(match("/20")).toEqual({ id: "20" });

        expect(match("/10/20")).toBeNull();
    });

    test("default parameter: /{id*:=(10)}", () => {
        let match = createMatcher("/{id*:=(10)}");

        expect(match("/")).toEqual({ id: ["10"] });
        expect(match("/20")).toEqual({ id: ["20"] });
        expect(match("/10/20")).toEqual({ id: ["10", "20"] });
    });

    test("default parameter: /{id*:default(10)}", () => {
        let match = createMatcher("/{id*:=(10)}");

        expect(match("/")).toEqual({ id: ["10"] });
        expect(match("/20")).toEqual({ id: ["20"] });
        expect(match("/10/20")).toEqual({ id: ["10", "20"] });
    });

    test("default parameter: /{id*:=()}", () => {
        let match = createMatcher("/{id*:=()}");

        expect(match("/")).toEqual({ id: [] });
        expect(match("/20")).toEqual({ id: ["20"] });
        expect(match("/10/20")).toEqual({ id: ["10", "20"] });
    });

    test("constraint: /{id:(\\d+)}", () => {
        let match = createMatcher("/{id:(\\d+)}");

        expect(match("/1000")).toEqual({ id: "1000" });
        expect(match("/home")).toBeNull();
    });

    test("constraint: /{id:(\\d+):int:min(1000):max(1002)}", () => {
        let match = createMatcher("/{id:(\\d+):int:min(1000):max(1002)}");

        expect(match("/1000")).toEqual({ id: 1000 });
        expect(match("/1001")).toEqual({ id: 1001 });
        expect(match("/1002")).toEqual({ id: 1002 });

        expect(match("/1003")).toBeNull();
        expect(match("/999")).toBeNull();
        expect(match("/home")).toBeNull();
    });

    test("constraint: /{path*:(\\d+):int:range(100,102):=(100)}", () => {
        let match = createMatcher("/{path*:(\\d+):int:range(100,102):=(100)}");

        expect(match("/")).toEqual({ path: [100] });
        expect(match("/100")).toEqual({ path: [100] });
        expect(match("/100/101/102")).toEqual({ path: [100,101,102] });

        expect(match("/103")).toBeNull();
        expect(match("/103/104")).toBeNull();
        expect(match("/103/104")).toBeNull();
        expect(match("/100/101/103")).toBeNull();
        expect(match("/home")).toBeNull();
    });

    test("constraint: /{path*:int:range(100,105):=(106)}", () => {
        let match = createMatcher("/{path*:int:range(100,105):=(106)}");

        expect(match("/")).toBeNull();
        expect(match("/100/102/106")).toBeNull();
    });

    test("constraint: /{id?:=({})}", () => {
        let match = createMatcher("/{id?:=({default{}})}");
        expect(match("/")).toEqual({ id: "{default{}}"});
    });

    test("constraint(bool): /{id:bool", () => {
        let match = createMatcher("/{id:bool}");
        expect(match("/true")).toEqual({ id: true });
        expect(match("/True")).toEqual({ id: true });
        expect(match("/false")).toEqual({ id: false });
        expect(match("/False")).toEqual({ id: false });

        expect(match("/1")).toBeNull();
    });

    test("constraint: /{id:number", () => {
        let match = createMatcher("/{id:number}");
        expect(match("/156004")).toEqual({ id: 156004 });
        expect(match("/0.156")).toEqual({ id: 0.156 });
        expect(match("/1E+100")).toEqual({ id: 1E100 });
        expect(match("/-10E-10")).toEqual({ id: -10E-10 });

        expect(match("/3,14")).toBeNull();
    });

    test("constraint: /{id:alpha", () => {
        let match = createMatcher("/{id:alpha}");
        expect(match("/value")).toEqual({ id: "value" });

        expect(match("/a.b")).toBeNull();
        expect(match("/a-b")).toBeNull();
        expect(match("/a_b")).toBeNull();
        expect(match("/a1")).toBeNull();
    });

    test("constraint: /{id:length(3)", () => {
        let match = createMatcher("/{id:length(3)}");
        expect(match("/abc")).toEqual({ id: "abc" });

        expect(match("/ab")).toBeNull();
        expect(match("/abcd")).toBeNull();
    });

    test("constraint: /{id:minlength(3)", () => {
        let match = createMatcher("/{id:minlength(3)}");
        expect(match("/abc")).toEqual({ id: "abc" });
        expect(match("/abcd")).toEqual({ id: "abcd" });

        expect(match("/ab")).toBeNull();
    });

    test("constraint: /{id:maxlength(3)", () => {
        let match = createMatcher("/{id:maxlength(3)}");
        expect(match("/abc")).toEqual({ id: "abc" });
        expect(match("/ab")).toEqual({ id: "ab" });

        expect(match("/abcd")).toBeNull();
    });

    test("constraint: /{id:minlength(3):maxlength(5)}", () => {
        let match = createMatcher("/{id:minlength(3):maxlength(5)}");
        expect(match("/abc")).toEqual({ id: "abc" });
        expect(match("/abcd")).toEqual({ id: "abcd" });
        expect(match("/abcde")).toEqual({ id: "abcde" });

        expect(match("/a")).toBeNull();
        expect(match("/ab")).toBeNull();
        expect(match("/abcdef")).toBeNull();
    });

    test("Unclosed brace parameter", () => {
        assert.throws(() => createMatcher("/{id"), "Invalid parameter definition in '{id'");
        assert.throws(() => createMatcher("/{id}/{"), "Invalid parameter definition in '{'");
        assert.throws(() => createMatcher("/{id:=({)}"), "Invalid parameter definition in '{id:=({)}'");
    });

    test("Missing parameter name", () => {
        assert.throws(() => createMatcher("/{}"), "Invalid parameter definition in '{}'");
        assert.throws(() => createMatcher("/{:=(1)}"), "Invalid parameter definition in '{:=(1)}'");
    });

    test("Invalid constraint", () => {
        assert.throws(() => createMatcher("/{id:}"), "Invalid parameter definition in '{id:}'");
        assert.throws(() => createMatcher("/{id::}"), "Invalid parameter definition in '{id::}'");
        assert.throws(() => createMatcher("/{id: : }"), "Invalid parameter definition in '{id: : }'");
        assert.throws(() => createMatcher("/{id :()}"), "Invalid parameter definition in '{id :()}'");
        assert.throws(() => createMatcher("/{id :([a-z])}"), "Invalid parameter definition in '{id :([a-z])}'");
    });

    test("Using all segment parameters as optional is not permitted", () => {
        assert.throws(() => createMatcher("/{a?}{b?}"), "Using all segment parameters as optional is not permitted in /{a?}{b?}");
        assert.throws(() => createMatcher("/{a?}{b?}{c?}"), "Using all segment parameters as optional is not permitted in /{a?}{b?}{c?}");
        assert.throws(() => createMatcher("/{a*}{b*}"), "Using all segment parameters as optional is not permitted in /{a*}{b*}");
        assert.throws(() => createMatcher("/{a?}{b*}"), "Using all segment parameters as optional is not permitted in /{a?}{b*}");
    });

    test("Catch-all parameter in the middle is not permitter", () => {
        assert.throws(() => createMatcher("/{a*}/{b}"), "'Catch-all' parameter is not permitter in the middle in /{a*}/{b}");
        assert.throws(() => createMatcher("/{a}/{b*}/c"), "'Catch-all' parameter is not permitter in the middle in /{a}/{b*}/c");
        assert.throws(() => createMatcher("/{a+}{b+}"), "'Catch-all' parameter is not permitter in the middle in /{a+}{b+}");
        assert.throws(() => createMatcher("/{a}/{b*}/{c}"), "'Catch-all' parameter is not permitter in the middle in /{a}/{b*}/{c}");
        assert.throws(() => createMatcher("/{a*}-b"), "'Catch-all' parameter is not permitter in the middle in /{a*}-b");
        assert.throws(() => createMatcher("/a-{b*}-c"), "'Catch-all' parameter is not permitter in the middle in /a-{b*}-c");
        assert.throws(() => createMatcher("/{a?}{b*}{c+}"), "'Catch-all' parameter is not permitter in the middle in /{a?}{b*}{c+}");
        assert.throws(() => createMatcher("/{b*}{c+}"), "'Catch-all' parameter is not permitter in the middle in /{b*}{c+}");
        assert.throws(() => createMatcher("/{a?}{b+}{c+}"), "'Catch-all' parameter is not permitter in the middle in /{a?}{b+}{c+}");
        assert.throws(() => createMatcher("/{a+}{b+}{c+}"), "'Catch-all' parameter is not permitter in the middle in /{a+}{b+}{c+}");
    });

    test("Unknown constraint", () => {
        assert.throws(() => createMatcher("/{a:uuid}"), "Unknown constraint 'uuid'");
    });
});
