/* eslint-disable react-hooks/refs */
"use client";

import "../css/editor.css";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import Image from "@tiptap/extension-image";
import { Toolbar } from "./toolbar";
import { provider, ydoc } from "@/lib/ydoc";
import { Users } from "./users";
import { useAuth } from "./auth-context";
import { AuthorMark } from "@/lib/author-mark";
import { useEffect, useRef } from "react";
import { LinkPreview } from "./link-preview";
import { LinkBubbleMenu } from "./link-bubble.menu";

export const Editor = () => {
  const { user, xUser } = useAuth();
  const userRef = useRef<{ user: typeof user; xUser: typeof xUser } | null>(
    null
  );

  useEffect(() => {
    userRef.current = { user, xUser };
  }, [user, xUser]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCaret.configure({
        provider,
        user: { ...user },
        render(user) {
          const cursor = document.createElement("span");
          cursor.style.borderLeft = `2px solid ${user.color}`;
          cursor.style.position = "relative";

          const label = document.createElement("span");
          label.textContent = user.name;
          label.style.cssText = `
            position: absolute;
            top: -1.4em;
            left: -2px;
            font-size: 10px;
            padding: 1px 4px;
            border-radius: 3px;
            background: ${user.color};
            color: white;
            white-space: nowrap;
            pointer-events: none;
          `;
          cursor.appendChild(label);
          return cursor;
        },
        selectionRender(user) {
          return {
            nodeName: "span",
            style: `background-color: ${user.color}33`, // 33 = 20% opacity in hex
          };
        },
      }),
      AuthorMark.configure({
        getUser: () => {
          const current = userRef.current;
          if (!current) return { name: "Anonymous", color: "#888888" };
          return {
            name: current.xUser
              ? `@${current.xUser.handle}`
              : current.user.name,
            color: current.user.color,
            handle: current.xUser?.handle,
            avatar: current.xUser?.avatar,
          };
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
      LinkPreview,
    ],
    content: "<p>Hello World! 🌎️</p>",
    immediatelyRender: false,
  });

  return (
    <div>
      <EditorContent
        autoFocus
        placeholder="Looks like nothing is here, write to start..."
        height={"100%"}
        className="h-full"
        editor={editor}
      />
      {editor && <LinkBubbleMenu editor={editor} />}
      <div className="fixed w-screen flex items-center justify-center bottom-0 left-0 p-[24px]">
        <Toolbar editor={editor} />
        <Users />
      </div>
    </div>
  );
};
