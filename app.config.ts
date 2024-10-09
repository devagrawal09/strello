import { defineConfig } from "@solidjs/start/config";
import unocss from "unocss/vite";
import { client, router } from "./socket";

const app = defineConfig({
  ssr: false,
  server: {
    preset: "netlify",
    experimental: {
      websocket: true,
    },
  },
  vite: {
    plugins: [unocss(), client()],
    ssr: { external: ["@prisma/client"] },
  },
});

app.addRouter(router);

export default app;
