"use client";

import { useState } from "react";
import { Editor } from "@tiptap/react";

export const LinkPreviewModal = ({
  editor,
  initialUrl = "",
  onClose,
}: {
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
        `http://localhost:3001/api/link-preview?url=${encodeURIComponent(url)}`
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-96">
        <h3 className="font-medium mb-3">Add Link Preview</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-2"
            autoFocus
          />
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 text-gray-600"
              disabled={loading}
            >
              cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "loading..." : "add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
