import { normalize } from "vinxi/lib/path";
export { client } from "./plugin/client";
import { server } from "./plugin/server";
import { fileURLToPath } from "url";

export const router = {
  name: "socket-fns",
  type: "http",
  base: "/_server",
  handler: "./src/plugin/server-handler.ts",
  target: "server",
  plugins: () => [
    server({
      runtime: normalize(
        fileURLToPath(
          new URL("./src/plugin/server-runtime.js", import.meta.url)
        )
      ),
    }),
  ],
};
