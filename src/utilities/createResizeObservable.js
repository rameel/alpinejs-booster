const key = Symbol();
let observable = null;

export function createResizeObservable(el, listener) {
    observable ??= new ResizeObserver(entries => {
        for (const e of entries)
            for (const callback of e.target[key].values())
                callback(e);
    });

    el[key] || (el[key] = new Set());
    el[key].add(listener);

    observable.observe(el);

    return () => {
        el[key].delete(listener);

        if (el[key].size === 0) {
            observable.unobserve(el);
            delete el[key];
        }
    };
}
