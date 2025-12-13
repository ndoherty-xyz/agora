"use client";

import { Editor } from "@tiptap/react";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { ImageModal } from "./image-modal";
import { LinkPreviewModal } from "./link-preview-modal";
import {
  BoldIcon,
  ImageIcon,
  ItalicIcon,
  Link2Icon,
  UnderlineIcon,
} from "lucide-react";

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
    <div className="bg-parchment/95 backdrop-blur-[1px] flex flex-row gap-[16px] items-center align-center p-[16px] rounded-full border border-black/10">
      <div className="flex items-center gap-[4px]">
        <Button
          size="icon"
          variant={editor.isActive("bold") ? "default" : "ghost"}
          onClick={() => {
            editor.chain().focus().toggleBold().run();
          }}
        >
          <BoldIcon />
        </Button>
        <Button
          size="icon"
          variant={editor.isActive("italic") ? "default" : "ghost"}
          onClick={() => {
            editor.chain().focus().toggleItalic().run();
          }}
        >
          <ItalicIcon />
        </Button>
        <Button
          size="icon"
          variant={editor.isActive("underline") ? "default" : "ghost"}
          onClick={() => {
            editor.chain().focus().toggleUnderline().run();
          }}
        >
          <UnderlineIcon />
        </Button>
      </div>
      <div className="w-[1px] h-[24px] bg-black/10" />
      <div className="flex items-center gap-[4px]">
        <Button
          size="icon"
          variant={"ghost"}
          onClick={() => setShowImageModal(true)}
        >
          <ImageIcon />
        </Button>
        {editor && (
          <ImageModal
            open={showImageModal}
            editor={editor}
            onClose={() => setShowImageModal(false)}
          />
        )}
        <Button
          size="icon"
          variant={"ghost"}
          onClick={() => setShowLinkModal(true)}
        >
          <Link2Icon />
        </Button>
        {editor && (
          <LinkPreviewModal
            open={showLinkModal}
            editor={editor}
            onClose={() => setShowLinkModal(false)}
          />
        )}
      </div>
    </div>
  );
};
