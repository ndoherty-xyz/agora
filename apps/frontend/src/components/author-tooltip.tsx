"use client";

import { useEffect, useState, useRef } from "react";

type AuthorInfo = {
  name: string;
  color: string;
  handle: string;
  avatar: string;
  x: number;
  y: number;
};

export const AuthorTooltip = () => {
  const [author, setAuthor] = useState<AuthorInfo | null>(null);
  const [isHoveringTooltip, setIsHoveringTooltip] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const authorEl = target.closest("[data-author]") as HTMLElement;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (authorEl) {
        const rect = authorEl.getBoundingClientRect();
        setAuthor({
          name: authorEl.dataset.author || "",
          color: authorEl.dataset.authorColor || "",
          handle: authorEl.dataset.authorHandle || "",
          avatar: authorEl.dataset.authorAvatar || "",
          x: rect.left + rect.width / 2,
          y: rect.bottom + 8,
        });
      } else if (!isHoveringTooltip) {
        timeoutRef.current = setTimeout(() => setAuthor(null), 100);
      }
    };

    document.addEventListener("mouseover", handleMouseOver);
    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isHoveringTooltip]);

  if (!author) return null;

  return (
    <div
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 flex items-center gap-3"
      style={{
        left: author.x,
        top: author.y,
        transform: "translateX(-50%)",
      }}
      onMouseEnter={() => setIsHoveringTooltip(true)}
      onMouseLeave={() => {
        setIsHoveringTooltip(false);
        setAuthor(null);
      }}
    >
      {author.avatar ? (
        <img
          src={author.avatar}
          alt={author.name}
          className="w-8 h-8 rounded-full"
        />
      ) : (
        <div
          className="w-8 h-8 rounded-full"
          style={{ backgroundColor: author.color }}
        />
      )}
      <div className="flex flex-col">
        <span className="text-sm font-medium">{author.name}</span>
        {author.handle && (
          <a
            href={`https://x.com/${author.handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline"
          >
            @{author.handle}
          </a>
        )}
      </div>
    </div>
  );
};
