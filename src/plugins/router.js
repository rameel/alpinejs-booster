import route from "@/plugins/router/route";
import router from "@/plugins/router/router";

export default function(alpine) {
    alpine.plugin([router, route]);
}
