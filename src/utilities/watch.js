import { assert } from "@/utilities/utils";

export function watch(getValue, callback, options = null) {
    assert(Alpine, "Alpine is not defined");

    const {
        effect,
        release
    } = Alpine;

    let newValue;
    let oldValue;
    let initialized = false;

    const handle = effect(() => {
        newValue = getValue();

        if (!initialized) {
            options?.deep && JSON.stringify(newValue);
            oldValue = newValue;
        }

        if (initialized || (options?.immediate ?? true)) {
            // Prevent the watcher from detecting its own dependencies
            setTimeout(() => {
                callback(newValue, oldValue);
                oldValue = newValue;
            }, 0);
        }

        initialized = true;
    });

    return () => release(handle);
}
