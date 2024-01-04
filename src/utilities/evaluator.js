/**
 * Creates a getter function for the specified expression.
 */
export function createGetter(evaluateLater, ...args) {
    const evaluate = evaluateLater(...args);
    return () => {
        let result;
        evaluate(v => result = v);
        return hasGetter(result) ? result.get() : result;
    };
}

/**
 * Creates a setter function for the specified expression.
 */
export function createSetter(evaluateLater, ...args) {
    const evaluate = evaluateLater(...args);
    args[args.length - 1] = `${ args[args.length - 1] } = __value__`;
    const set = evaluateLater(...args);

    return value => {
        let result;
        evaluate(v => result = v);

        if (hasSetter(result)) {
            result.set(value);
        }
        else {
            set(() => { }, {
                scope: {
                    __value__: value
                }
            });
        }
    };
}

/**
 * Checks if the specified value has a getter function.
 *
 * @param {any} value The value to check.
 * @returns {boolean} `true` if the value has a getter function, `false` otherwise.
 */
function hasGetter(value) {
    return typeof value?.get === "function";
}

/**
 * Checks if the specified value has a setter function.
 *
 * @param {any} value The value to check.
 * @returns {boolean} `true` if the value has a setter function, `false` otherwise.
 */
function hasSetter(value) {
    return typeof value?.set === "function";
}
