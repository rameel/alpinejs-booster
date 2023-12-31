import alias from "@rollup/plugin-alias";
import path from "path";

import { fileURLToPath } from "url";

export default {
    input: "src/index.js",
    output: {
        file: "dist/alpinejs-booster.js",
        format: "iife",
        sourcemap: true
    },
    plugins: [
        alias({
            entries: [
                { find: "@", replacement: path.join(path.dirname(fileURLToPath(import.meta.url)), "src") }
            ]
        })
    ]
}
