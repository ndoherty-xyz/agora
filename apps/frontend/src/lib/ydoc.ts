import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";

export const SERVER_DOMAIN =
  process.env.NEXT_PUBLIC_SERVER_DOMAIN ?? "localhost:3001";

export const ydoc = new Y.Doc();

export const provider = new HocuspocusProvider({
  url: `ws://${SERVER_DOMAIN}/collaborate`,
  name: "example-document",
  document: ydoc,
});
