import { listen } from "@/utilities/utils";

let data;

export function useLocation() {
    if (!data) {
        data = Alpine.reactive({
            hash: "",
            host: "",
            hostname: "",
            href: "",
            origin: "",
            pathname: "",
            port: 0,
            protocol: "",
            search: "",
            refresh() {
                populate();
            }
        });

        populate();

        listen(window, "hashchange", populate);
        listen(window, "popstate", populate);
    }

    return data;
}

function populate() {
    for (let name in data) {
        if (name in location) {
            data[name] = location[name];
        }
    }
}
