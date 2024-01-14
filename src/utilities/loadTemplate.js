import { warn } from "@/utilities/utils";

const cache = new Map();
const pendings = new Map();

export async function loadTemplate(path) {
    const template = cache.get(path);
    if (template) {
        return template;
    }

    const pending = pendings.get(path);
    if (pending) {
        return await pending;
    }

    const request = (async () => {
        let result;
        try {
            result = await fetch(path);
        }
        catch {
        }

        if (!result?.ok) {
            pendings.delete(path);
            warn(`Failed to load template from ${ path }`);

            return new DocumentFragment();
        }

        const document = new DOMParser().parseFromString(
            await result.text(),
            "text/html");

        const fragment = new DocumentFragment();
        fragment.append(...document.body.childNodes);

        cache.set(path, fragment);
        pendings.delete(path);

        return fragment;
    })();

    pendings.set(path, request);
    return await request;
}
