import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";

export const ydoc = new Y.Doc();

export const provider = new HocuspocusProvider({
  url: "ws://localhost:3001/collaborate",
  name: "example-document",
  document: ydoc,
});
