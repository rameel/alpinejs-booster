import alias from "@rollup/plugin-alias";
import path from "path";
import replace from "@rollup/plugin-replace";
import resolve from "@rollup/plugin-node-resolve";
import size from "rollup-plugin-bundle-size";
import stripComments from "strip-comments";
import terser from "@rollup/plugin-terser";

import {
    fileURLToPath
} from "url";

const __SRC = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "src");

const production = process.env.NODE_ENV === "production";

const terserOptions = {
    output: {
        comments: false
    },
    compress: {
        passes: 5,
        ecma: 2020,
        drop_console: false,
        drop_debugger: true,
        pure_getters: true,
        arguments: true,
        unsafe_comps: true,
        unsafe_math: true,
        unsafe_methods: true
    }
};

const plugins = [
    resolve(),
    strip(),
    production && size(),
    replace({
        "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
        "__DEV": !production,
        preventAssignment: true
    }),
    alias({
        entries: [
            { find: "@", replacement: __SRC }
        ]
    })
];

export default [{
    input: "src/index.js",
    treeshake: "smallest",
    output: [{
        file: "dist/alpinejs-booster.js",
        format: "iife"
    }, production && {
        file: "dist/alpinejs-booster.min.js",
        format: "iife",
        plugins: [terser(terserOptions)]
    }],
    plugins
}, production && {
    input: "src/plugins/index.js",
    treeshake: "smallest",
    output: [{
        file: "dist/alpinejs-booster.esm.js",
        format: "esm"
    }, {
        file: "dist/alpinejs-booster.esm.min.js",
        format: "esm",
        plugins: [terser(terserOptions)]
    }],
    plugins
}].filter(Boolean);

function strip() {
    return {
        name: "strip",
        transform(source) {
            return {
                code: stripComments(source)
            };
        }
    };
}
