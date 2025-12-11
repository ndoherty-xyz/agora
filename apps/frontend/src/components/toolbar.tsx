"use client";

import { Editor } from "@tiptap/react";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { ImageModal } from "./image-modal";
import { LinkPreviewModal } from "./link-preview-modal";

export const Toolbar = ({ editor }: { editor: Editor | null }) => {
  const [, forceUpdate] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  useEffect(() => {
    if (!editor) return;

    const update = () => forceUpdate((n) => n + 1);

    editor.on("selectionUpdate", update);
    editor.on("transaction", update);

    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="bg-neutral-50 flex flex-row gap-[8px] items-center align-center p-[16px] rounded-[16px] border border-black/5 shadow-sm">
      <Button
        variant={editor.isActive("bold") ? "default" : "ghost"}
        onClick={() => {
          editor.chain().focus().toggleBold().run();
        }}
      >
        BOLD
      </Button>
      <Button
        variant={editor.isActive("italic") ? "default" : "ghost"}
        onClick={() => {
          editor.chain().focus().toggleItalic().run();
        }}
      >
        Italic
      </Button>
      <Button
        variant={editor.isActive("underline") ? "default" : "ghost"}
        onClick={() => {
          editor.chain().focus().toggleUnderline().run();
        }}
      >
        Underline
      </Button>
      <Button onClick={() => setShowImageModal(true)}>Image</Button>
      {showImageModal && editor && (
        <ImageModal editor={editor} onClose={() => setShowImageModal(false)} />
      )}
      <Button onClick={() => setShowLinkModal(true)}>Link</Button>
      {showLinkModal && editor && (
        <LinkPreviewModal
          editor={editor}
          onClose={() => setShowLinkModal(false)}
        />
      )}
    </div>
  );
};
