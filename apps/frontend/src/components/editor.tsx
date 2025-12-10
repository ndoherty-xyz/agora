"use client";

import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import { Toolbar } from "./toolbar";

const ydoc = new Y.Doc();

const provider = new HocuspocusProvider({
  url: "ws://localhost:3001/collaborate",
  name: "example-document",
  document: ydoc,
});

export const Editor = () => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCaret.configure({
        provider,
        user: { name: "John Doe", color: "#ffcc00" },
      }),
    ],
    content: "<p>Hello World! 🌎️</p>",
    immediatelyRender: false,
  });

  return (
    <div>
      <EditorContent editor={editor} />;
      <div className="fixed w-screen flex items-center justify-center bottom-0 left-0 p-[24px]">
        <Toolbar editor={editor} />
      </div>
    </div>
  );
};
