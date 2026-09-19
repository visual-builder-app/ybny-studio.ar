/**
 * Production server for the builder.
 *
 * Behaves like `remix-serve build/server/index.js` (same static file handling
 * and request handler) with one deliberate difference: it trusts the reverse
 * proxy in front of it.
 *
 * Why: on Render (and any TLS-terminating proxy) the app receives plain HTTP,
 * so Express reports `req.protocol === "http"` and `request.url` becomes
 * `http://...`. The builder's OAuth flow (`/oauth/ws/authorize`) compares the
 * request origin with the `redirect_uri` origin, and `parseBuilderUrl` forces
 * `https` for builder subdomains (`p-<uuid>.<host>`). With `http` on one side
 * and `https` on the other the check always fails with a 400
 * ("redirect_uri does not match the registered redirect URIs"), so no project
 * can be opened. `trust proxy` makes Express read `X-Forwarded-Proto`, which
 * restores `https`.
 */
import path from "node:path";
import { pathToFileURL } from "node:url";
import { installGlobals } from "@remix-run/node";
import { createRequestHandler } from "@remix-run/express";
import express from "express";

process.env.NODE_ENV = process.env.NODE_ENV ?? "production";

const port = Number(process.env.PORT ?? 3000);
// Overridable only so the server can be smoke-tested against another build.
const buildPath = path.resolve(
  process.env.SERVER_BUILD_PATH ?? "build/server/index.js"
);

const build = await import(pathToFileURL(buildPath).href);
installGlobals({ nativeFetch: build.future?.v3_singleFetch });

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", true);

app.use(
  build.publicPath,
  express.static(build.assetsBuildDirectory, { immutable: true, maxAge: "1y" })
);
app.use(express.static("public", { maxAge: "1h" }));

app.all("*", createRequestHandler({ build, mode: process.env.NODE_ENV }));

app.listen(port, () => {
  console.log(`[server] http://localhost:${port}`);
});
