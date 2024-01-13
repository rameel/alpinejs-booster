import { useLocation } from "@/utilities/useLocation";
import { error } from "@/utilities/utils";

let location;

const hashApi = {
    get path() {
        return location.hash.slice(1) || "/";
    },
    get "location"() {
        return location;
    },
    resolve(path) {
        const url = new URL(path);
        return url.hash
            ? url.hash.slice(1) || "/"
            : url.pathname;
    },
    "navigate"(path, replace = false) {
        path.indexOf("#") < 0 && (path = "#" + path);
        navigate(path, replace);
    }
};

const html5Api = {
    get path() {
        return location.pathname;
    },
    get "location"() {
        return location;
    },
    resolve(path) {
        return new URL(path).pathname;
    },
    "navigate"(path, replace = false) {
        navigate(path, replace);
    }
};

function navigate(path, replace) {
    history[replace ? "replaceState" : "pushState"]({}, "", path);
    location.refresh();
}

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
