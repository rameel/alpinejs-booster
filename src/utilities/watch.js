export function watch(getValue, callback, options = null) {
    const {
        effect,
        release,
        onElRemoved
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
            // To prevent the watcher from detecting its own dependencies
            queueMicrotask(() => {
                callback(newValue, oldValue);
                oldValue = newValue;
            });
        }

        initialized = true;
    });

    const dispose = () => release(handle);
    options?.el && onElRemoved(options.el, dispose);

    return dispose;
}
