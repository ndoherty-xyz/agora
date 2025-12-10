import express from "express";
import expressWebsockets from "express-ws";
import { Hocuspocus } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { document } from "./db/schema";

const hocuspocus = new Hocuspocus({
  extensions: [
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
  async onConnect({ documentName }) {
    console.log(`client connected to ${documentName}`);
  },
  async onDisconnect({ documentName }) {
    console.log(`client disconnected from ${documentName}`);
  },
});

const { app } = expressWebsockets(express());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.ws("/collaborate", (websocket, request) => {
  hocuspocus.handleConnection(websocket, request);
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`);
});
