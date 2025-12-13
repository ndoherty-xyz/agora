"use client";

import { SERVER_URL } from "@/lib/ydoc";
import { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { useState } from "react";

export const LinkBubbleMenu = ({ editor }: { editor: Editor }) => {
  const [loading, setLoading] = useState(false);

  const makePreview = async () => {
    const { from } = editor.state.selection;
    const $pos = editor.state.doc.resolve(from);

    const linkMark = $pos.marks().find((m) => m.type.name === "link");
    if (!linkMark) return;

    // find the full range of the link
    let start = from;
    let end = from;

    while (start > 0) {
      const $before = editor.state.doc.resolve(start - 1);
      if (
        !$before
          .marks()
          .some(
            (m) =>
              m.type.name === "link" && m.attrs.href === linkMark.attrs.href
          )
      )
        break;
      start--;
    }
    while (end < editor.state.doc.content.size) {
      const $after = editor.state.doc.resolve(end);
      if (
        !$after
          .marks()
          .some(
            (m) =>
              m.type.name === "link" && m.attrs.href === linkMark.attrs.href
          )
      )
        break;
      end++;
    }

    const url = linkMark.attrs.href;
    setLoading(true);

    try {
      const res = await fetch(
        `${SERVER_URL}/api/link-preview?url=${encodeURIComponent(url)}`
      );

      if (!res.ok) throw new Error("Failed to fetch");

      const preview = await res.json();

      editor
        .chain()
        .focus()
        .deleteRange({ from: start, to: end })
        .insertContent({
          type: "linkPreview",
          attrs: preview,
        })
        .run();
    } catch (err) {
      console.error("Preview fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BubbleMenu
      pluginKey="linkBubbleMenu"
      editor={editor}
      shouldShow={({ editor }) => {
        console.log("link bubble shouldShow");
        return editor.isActive("link");
      }}
    >
      <div className="bg-white border rounded shadow-lg flex overflow-hidden">
        <button
          onClick={makePreview}
          disabled={loading}
          className="px-3 py-1 text-sm hover:bg-gray-100 disabled:opacity-50"
        >
          {loading ? "loading..." : "make preview"}
        </button>
      </div>
    </BubbleMenu>
  );
};
