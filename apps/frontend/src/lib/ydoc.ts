import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";

export const WEBSOCKET_URL =
  process.env.NEXT_PUBLIC_WEBSOCKET_URL ?? "ws://localhost:3001";

export const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3001";

export const ydoc = new Y.Doc();

export const provider = new HocuspocusProvider({
  url: `${WEBSOCKET_URL}/collaborate`,
  name: "example-document",
  document: ydoc,
});
