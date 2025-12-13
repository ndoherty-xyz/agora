/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useRef } from "react";

type AuthorInfo = {
  name: string;
  color: string;
  handle: string;
  avatar: string;
};

type Position = { x: number; y: number };

export const AuthorTooltip = () => {
  const [author, setAuthor] = useState<AuthorInfo | null>(null);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isHoveringAuthorMark, setIsHoveringAuthorMark] = useState(false);
  const [isHoveringTooltip, setIsHoveringTooltip] = useState(false);
  const hideMarkTimeout = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = isHoveringAuthorMark || isHoveringTooltip;

  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const authorEl = target.closest("[data-author]") as HTMLElement;

      if (authorEl) {
        // Clear any pending timeouts
        if (hideMarkTimeout.current) {
          clearTimeout(hideMarkTimeout.current);
          hideMarkTimeout.current = null;
        }

        const rect = authorEl.getBoundingClientRect();
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;
        setPosition({
          x: rect.x + scrollX + rect.width / 2,
          y: rect.y + scrollY + rect.height + 6,
        });
        setAuthor({
          name: authorEl.dataset.author || "",
          color: authorEl.dataset.authorColor || "",
          handle: authorEl.dataset.authorHandle || "",
          avatar: authorEl.dataset.authorAvatar || "",
        });
        setTimeout(() => {
          setIsHoveringAuthorMark(true);
        }, 200);
      } else if (!isHoveringTooltip) {
        // Delay hiding to give time to move to tooltip
        if (!hideMarkTimeout.current) {
          hideMarkTimeout.current = setTimeout(() => {
            setIsHoveringAuthorMark(false);
            hideMarkTimeout.current = null;
          }, 100);
        }
      }
    };

    document.addEventListener("mouseover", handleMouseOver);
    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      if (hideMarkTimeout.current) clearTimeout(hideMarkTimeout.current);
    };
  }, [isHoveringTooltip]);

  return (
    <div
      className="absolute z-50 transition-[opacity,transform] duration-200 ease-out bg-parchment/90 backdrop-blur-[1px] rounded-full border-black/10 border p-[4px] pr-[12px] flex items-center gap-[6px]"
      style={{
        left: position.x,
        top: position.y,
        transform: `translateX(-50%) translateY(${
          showTooltip ? "0px" : "4px"
        })`,
        opacity: showTooltip ? 1 : 0,
        pointerEvents: showTooltip ? "auto" : "none",
      }}
      onMouseEnter={() => {
        // Clear hide timeout if moving to tooltip
        if (hideMarkTimeout.current) {
          clearTimeout(hideMarkTimeout.current);
          hideMarkTimeout.current = null;
        }
        setIsHoveringTooltip(true);
      }}
      onMouseLeave={() => {
        setIsHoveringTooltip(false);
        setIsHoveringAuthorMark(false);
      }}
    >
      {author?.avatar ? (
        <img
          src={author.avatar}
          alt={author.name}
          className="w-8 h-8 rounded-full"
        />
      ) : (
        <div
          className="w-8 h-8 rounded-full"
          style={{ backgroundColor: author ? author.color : "white" }}
        />
      )}
      <div className="flex flex-row items-center gap-[4px]">
        {author?.handle ? (
          <a
            href={`https://x.com/${author.handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-primary hover:text-text-tertiary hover:underline"
          >
            <span className="text-sm font-medium">{`@${author.handle}`}</span>
          </a>
        ) : (
          <span className="text-sm font-medium">{author?.name}</span>
        )}
      </div>
    </div>
  );
};
