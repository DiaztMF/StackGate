import type { IncomingMessage, ServerResponse } from "node:http";
import { createApp } from "../src/app.js";

const app = createApp();

function readBody(req: IncomingMessage): Promise<Buffer | undefined> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(chunks.length > 0 ? Buffer.concat(chunks) : undefined));
    req.on("error", reject);
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const host = req.headers.host ?? "localhost";
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const v of value) headers.append(key, v);
      } else {
        headers.set(key, value);
      }
    }
    const hasBody = req.method !== undefined && !["GET", "HEAD"].includes(req.method);
    const request = new Request(`https://${host}${req.url ?? "/"}`, {
      method: req.method,
      headers,
      body: hasBody ? await readBody(req) : undefined,
    });
    const response = await app.fetch(request);
    res.statusCode = response.status;
    const setCookies = response.headers.getSetCookie();
    for (const [key, value] of response.headers) {
      if (key.toLowerCase() === "set-cookie") continue;
      res.setHeader(key, value);
    }
    if (setCookies.length > 0) res.setHeader("Set-Cookie", setCookies);
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }));
  }
}
