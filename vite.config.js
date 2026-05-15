import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function localApiRoutes() {
  return {
    name: "local-api-routes",
    configureServer(server) {
      server.middlewares.use("/api/blob/upload", async (request, response, next) => {
        try {
          const body = await new Promise((resolve, reject) => {
            const chunks = [];

            request.on("data", (chunk) => chunks.push(chunk));
            request.on("error", reject);
            request.on("end", () => resolve(Buffer.concat(chunks)));
          });

          const headers = new Headers();
          Object.entries(request.headers).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              value.forEach((item) => headers.append(key, item));
            } else if (value) {
              headers.set(key, value);
            }
          });

          const apiRequest = new Request(`http://${request.headers.host || "127.0.0.1"}/api/blob/upload`, {
            method: request.method,
            headers,
            body: body.length ? body : undefined
          });
          const { default: handler } = await import("./api/blob/upload.js");
          const apiResponse = await handler(apiRequest);

          response.statusCode = apiResponse.status;
          apiResponse.headers.forEach((value, key) => response.setHeader(key, value));
          response.end(Buffer.from(await apiResponse.arrayBuffer()));
        } catch (error) {
          next(error);
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const serverEnv = loadEnv(mode, process.cwd(), ["BLOB_", "NEXT_PUBLIC_", "VITE_"]);
  Object.assign(process.env, serverEnv);

  return {
    envPrefix: ["VITE_", "NEXT_PUBLIC_"],
    plugins: [react(), localApiRoutes()]
  };
});
