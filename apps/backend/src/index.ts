import "dotenv/config";
import cors from "cors";
import express from "express";
import expressWebsockets from "express-ws";
import { Hocuspocus } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { document, xSession } from "./db/schema";
import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
} from "./utils/auth";
import cookieParser from "cookie-parser";
import * as cheerio from "cheerio";
import { Throttle } from "@hocuspocus/extension-throttle";
import {
  checkTextForFlaggedContent,
  findFlaggedNodes,
  FlaggedElementMapping,
  getFlaggedImages,
  mergeDeletionMaps,
} from "./utils/moderation";
import { extractImageNodes, extractText } from "./utils/doc";

const hocuspocus = new Hocuspocus({
  extensions: [
    new Throttle({
      throttle: 60,
      banTime: 5,
    }),
    new Database({
      async fetch() {
        const dbDocument = await db.query.document.findFirst({
          where: eq(document.id, "main"),
        });

        if (!dbDocument) return null;

        return new Uint8Array(dbDocument.content);
      },
      async store({ state }) {
        await db
          .insert(document)
          .values({ id: "main", content: state })
          .onConflictDoUpdate({
            target: document.id,
            set: { content: state },
          });
      },
    }),
  ],
  async onChange({ transactionOrigin }) {
    if (transactionOrigin === "moderation") {
      console.log("skipping - moderation origin");
      return;
    }

    hasChangedSinceLastModeration = true;
  },
  async onConnect({ request, documentName }) {
    const ip =
      request.headers["x-forwarded-for"]?.toString().split(",")[0] ||
      request.socket.remoteAddress ||
      "unknown";

    console.log(`client connected to ${documentName} from ${ip}`);
    return { ip };
  },
  async onDisconnect({ documentName }) {
    console.log(`client disconnected from ${documentName}`);
  },
});

// Document moderation interval
let hasChangedSinceLastModeration = true;
let isModerating = false;
setInterval(async () => {
  if (!hasChangedSinceLastModeration) return;
  if (isModerating) return;

  const doc = hocuspocus.documents.get("main");
  if (!doc) return;

  try {
    isModerating = true;
    const fragment = doc.getXmlFragment("default");
    const fullDocumentText = extractText(fragment);
    const allImageNodes = extractImageNodes(fragment);

    const [documentFlagged, imagesFlagged] = await Promise.all([
      checkTextForFlaggedContent(fullDocumentText),
      getFlaggedImages(allImageNodes),
    ]);

    let flaggedNodes: FlaggedElementMapping = imagesFlagged;

    if (documentFlagged.flagged) {
      const flaggedElements = await findFlaggedNodes(fragment);

      if (flaggedElements.size === 0) {
        console.error(
          "[MODERATION] Full doc flagged but no specific nodes found. Doc length:",
          extractText(fragment).length
        );
      }

      flaggedNodes = mergeDeletionMaps(flaggedNodes, flaggedElements);
    }

    if (flaggedNodes.size > 0) {
      doc.transact(() => {
        flaggedNodes.forEach((indices, parent) => {
          indices.forEach((index) => {
            parent.delete(index, 1);
          });
        });
      }, "moderation");
    }
  } catch (e: unknown) {
    console.error(e);
  } finally {
    hasChangedSinceLastModeration = false;
    isModerating = false;
  }
}, 10000);

const { app } = expressWebsockets(express());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.ws("/collaborate", (websocket, request) => {
  hocuspocus.handleConnection(websocket, request);
});

app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.get("/api/auth/x", async (req, res) => {
  if (!process.env.X_CLIENT_ID || !process.env.X_CALLBACK_URL) {
    console.error("X environment variables not set up properly");
    return res.status(500);
  }
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  await db.insert(xSession).values({ state, codeVerifier });

  const authUrl = new URL("https://x.com/i/oauth2/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", process.env.X_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", process.env.X_CALLBACK_URL);
  authUrl.searchParams.set("scope", "tweet.read users.read");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  return res.redirect(authUrl.toString());
});

app.get("/api/auth/x/callback", async (req, res) => {
  const { code, state } = req.query;

  if (
    !code ||
    !state ||
    typeof code !== "string" ||
    typeof state !== "string"
  ) {
    return res.status(400).send("Missing code or state");
  }

  // find session by state
  const [session] = await db
    .select()
    .from(xSession)
    .where(eq(xSession.state, state))
    .limit(1);

  if (!session) {
    return res.status(400).send("Invalid state");
  }

  // exchange code for token
  const tokenRes = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.X_CALLBACK_URL!,
      code_verifier: session.codeVerifier!,
    }),
  });

  if (!tokenRes.ok) {
    console.error("Token exchange failed:", await tokenRes.text());
    return res.status(500).send("Token exchange failed");
  }

  const { access_token } = await tokenRes.json();

  // fetch user info
  const userRes = await fetch(
    "https://api.x.com/2/users/me?user.fields=profile_image_url",
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  );

  if (!userRes.ok) {
    console.error("User fetch failed:", await userRes.text());
    return res.status(500).send("User fetch failed");
  }

  const { data: user } = await userRes.json();

  // update session with user info
  await db
    .update(xSession)
    .set({
      xId: user.id,
      xHandle: user.username,
      xAvatarUrl: user.profile_image_url,
      state: null,
      codeVerifier: null,
    })
    .where(eq(xSession.id, session.id));

  // set cookie and redirect
  res.cookie("session", session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
  });

  res.redirect(process.env.FRONTEND_URL || "http://localhost:3000");
});

app.get("/api/auth/me", async (req, res) => {
  const sessionId = req.cookies.session;

  if (!sessionId) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const [session] = await db
    .select()
    .from(xSession)
    .where(eq(xSession.id, sessionId))
    .limit(1);

  if (!session || !session.xId) {
    return res.status(401).json({ error: "Not logged in" });
  }

  res.json({
    id: session.xId,
    handle: session.xHandle,
    avatar: session.xAvatarUrl,
  });
});

app.post("/api/auth/logout", async (req, res) => {
  const sessionId = req.cookies.session;

  if (sessionId) {
    await db.delete(xSession).where(eq(xSession.id, sessionId));
  }

  res.clearCookie("session");
  res.json({ ok: true });
});

app.get("/api/link-preview", async (req, res) => {
  const { url } = req.query;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing url param" });
  }

  // basic validation
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).json({ error: "Invalid url" });
  }

  // SSRF protection - block private/local IPs
  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.startsWith("127.") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("172.") ||
    hostname === "0.0.0.0" ||
    hostname.endsWith(".local")
  ) {
    return res.status(400).json({ error: "URL not allowed" });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LinkPreview/1.0)",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(400).json({ error: "Failed to fetch url" });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const getMeta = (name: string) =>
      $(`meta[property="og:${name}"]`).attr("content") ||
      $(`meta[name="og:${name}"]`).attr("content") ||
      $(`meta[name="${name}"]`).attr("content");

    const preview = {
      url,
      title: getMeta("title") || $("title").text() || null,
      description: getMeta("description") || null,
      image: getMeta("image") || null,
      siteName: getMeta("site_name") || parsed.hostname,
    };

    res.json(preview);
  } catch (err) {
    console.error("Link preview error:", err);
    res.status(500).json({ error: "Failed to fetch preview" });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`);
});
