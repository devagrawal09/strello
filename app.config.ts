import { defineConfig } from "@solidjs/start/config";
import unocss from "unocss/vite";
import { client, router } from "./socket";

const app = defineConfig({
  server: {
    preset: "netlify",
  },
  vite: {
    plugins: [unocss(), client()],
    ssr: { external: ["@prisma/client"] },
  },
});

app.addRouter(router);

export default app;
