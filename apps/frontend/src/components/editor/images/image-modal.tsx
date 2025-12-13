"use client";

import { useState } from "react";
import { Editor } from "@tiptap/react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const ImageModal = ({
  open,
  editor,
  onClose,
}: {
  open: boolean;
  editor: Editor;
  onClose: () => void;
}) => {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      editor.chain().focus().setImageBlock({ src: url }).run();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false}>
        <DialogTitle>Add image via URL</DialogTitle>

        <div className="py-[16px] px-[20px] flex flex-col gap-[16px]">
          <Input
            type="url"
            placeholder="https://example.com/image.png"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            autoFocus
          />
          <div className="flex flex-row w-full gap-[8px] items-center justify-end">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleSubmit}>
              Add
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
