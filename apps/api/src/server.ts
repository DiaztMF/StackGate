import { config } from "dotenv";
import { serve } from "@hono/node-server";
import { createApp } from "./app.js";

config();

const port = Number(process.env.PORT ?? 8000);
serve({ fetch: createApp().fetch, port });
console.log(`stackgate-api listening on ${port}`);
