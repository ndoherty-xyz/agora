"use client";

import { useState } from "react";
import { Editor } from "@tiptap/react";
import { SERVER_URL } from "@/lib/ydoc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const LinkPreviewModal = ({
  open,
  editor,
  initialUrl = "",
  onClose,
}: {
  open: boolean;
  editor: Editor;
  initialUrl?: string;
  onClose: () => void;
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${SERVER_URL}/api/link-preview?url=${encodeURIComponent(url)}`
      );

      if (!res.ok) throw new Error("Failed to fetch preview");

      const preview = await res.json();

      editor
        .chain()
        .focus()
        .insertContent({
          type: "linkPreview",
          attrs: preview,
        })
        .run();

      onClose();
    } catch {
      setError("couldn't fetch preview for that url");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogTitle>Add link preview</DialogTitle>

        <div className="py-[16px] px-[20px] flex flex-col gap-[16px]">
          <Input
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            autoFocus
          />
          <div className="flex flex-row w-full gap-[8px] items-center justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Loading..." : "Add"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
