"use client";

import { useState } from "react";
import { Editor } from "@tiptap/react";

export const ImageModal = ({
  editor,
  onClose,
}: {
  editor: Editor;
  onClose: () => void;
}) => {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      editor.chain().focus().setImage({ src: url }).run();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-96">
        <h3 className="font-medium mb-3">Add Image</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="url"
            placeholder="https://example.com/image.png"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-3"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 text-gray-600"
            >
              cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-blue-500 text-white rounded"
            >
              add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
