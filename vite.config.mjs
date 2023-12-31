import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

export default defineConfig({
    test: {
        globals: true,
        environment: "jsdom"
    },
    resolve: {
        alias: {
            "@": path.join(path.dirname(fileURLToPath(import.meta.url)), "src")
        }
    }
});
