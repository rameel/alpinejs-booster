import { useLocation } from "@/utilities/useLocation";
import { error } from "@/utilities/utils";

let location;

const hashApi = {
    get path() {
        return location.hash.slice(1);
    },
    get "location"() {
        return location;
    },
    "navigate"(path, replace = false) {
        const index = path.indexOf("#");
        index >= 0 && (path = path.slice(0, index));

        history[replace ? "replaceState" : "pushState"]({}, "", "#" + path);
        location.refresh();
    }
};

const html5Api = {
    get path() {
        return location.pathname;
    },
    get "location"() {
        return location;
    },
    "navigate"(path, replace = false) {
        history[replace ? "replaceState" : "pushState"]({}, "", path);
        location.refresh();
    }
};

const knownApi = {
    html5: html5Api,
    hash: hashApi,
};

export function createHistory(name) {
    location ??= useLocation();

    name ||= "html5";
    let api = knownApi[name];

    if (!api) {
        error(`Unknown history API: '${ name }'`);
        api = html5Api;
    }

    return api;
}
