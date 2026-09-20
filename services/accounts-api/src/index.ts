import express from "express";
import { timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const tokenFile = process.env.ACCOUNTS_API_TOKEN_FILE;
if (!tokenFile) {
  throw new Error("ACCOUNTS_API_TOKEN_FILE is required");
}
const token = readFileSync(tokenFile, "utf8").trim();
if (!/^[A-Za-z0-9_-]{43,128}$/.test(token)) {
  throw new Error("Invalid service token configuration");
}
const expectedAuthorization = Buffer.from(`Bearer ${token}`);
const app = express();
app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.use("/api", (req, res, next) => {
  const supplied = Buffer.from(req.headers.authorization ?? "");
  if (
    supplied.length !== expectedAuthorization.length ||
    !timingSafeEqual(supplied, expectedAuthorization)
  ) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
});
app.use(express.json());

// For this service we connect using the trusted ybny_access_service role
// (or admin locally). Do NOT put hardcoded secrets in the code.
const resolveConnectionString = (): string => {
  const file = process.env.ACCOUNTS_DATABASE_URL_FILE;
  if (file) {
    return readFileSync(file, "utf8").trim();
  }
  const inline = process.env.ACCOUNTS_DATABASE_URL;
  if (inline) {
    return inline;
  }
  throw new Error(
    "ACCOUNTS_DATABASE_URL_FILE or ACCOUNTS_DATABASE_URL is required"
  );
};
const pool = new pg.Pool({
  connectionString: resolveConnectionString(),
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 5,
  statement_timeout: 15000,
  query_timeout: 15000,
});
// Without this listener an idle-client error (for example the accounts
// database restarting) would crash the process. Never log credentials.
pool.on("error", (error: Error) => {
  console.error("Accounts pool error:", (error as { code?: string }).code ?? error.name);
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "ybny-accounts-api" });
});

/**
 * Access check endpoint.
 * Called by OSW Studio / Webstudio backend to verify if a user has access.
 * Protected by the shared service Bearer token guard above.
 */
app.post("/api/access", async (req, res) => {
  try {
    const { memberId, environment } = req.body ?? {};

    if (
      typeof memberId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(memberId) ||
      (environment !== "test" && environment !== "live")
    ) {
      return res.status(400).json({
        error: "memberId (uuid) and environment ('test'|'live') are required",
      });
    }

    // Call the database function to verify active subscription/access.
    // expires_at is part of the function contract: consumers need it to bound
    // any cached authorization to the end of the subscription.
    const result = await pool.query(
      "SELECT product_key, expires_at FROM accounts_api.get_access($1, $2)",
      [memberId, environment]
    );

    res.json({
      hasAccess: result.rows.length > 0,
      products: result.rows.map(
        (row: { product_key: string; expires_at: string | Date }) => ({
          productKey: row.product_key,
          expiresAt: new Date(row.expires_at).toISOString(),
        })
      ),
    });
  } catch (error) {
    const code = (error as { code?: string }).code;
    console.error("Error checking access", code ?? "unknown");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Express would otherwise answer with an HTML error page, which breaks JSON clients.
app.use(
  (
    error: { type?: string },
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    const isParseError = error?.type === "entity.parse.failed";
    res
      .status(isParseError ? 400 : 500)
      .json({ error: isParseError ? "Invalid JSON body" : "Internal server error" });
  }
);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`[ybny-accounts-api] listening on port ${port}`);
});
