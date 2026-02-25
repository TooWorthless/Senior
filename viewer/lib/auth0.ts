import { Auth0Client } from "@auth0/nextjs-auth0/server";

for (const k of [
  "APP_BASE_URL",
  "AUTH0_DOMAIN",
  "AUTH0_CLIENT_ID",
  "AUTH0_CLIENT_SECRET",
  "AUTH0_SECRET",
]) {
  if (!process.env[k]) throw new Error(`[auth0] Missing env: ${k}`);
}

export const auth0 = new Auth0Client();
