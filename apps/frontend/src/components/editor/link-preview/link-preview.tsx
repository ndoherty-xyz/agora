/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";
import {
  ReactNodeViewRenderer,
  Node,
  mergeAttributes,
  ReactNodeViewProps,
} from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";

const LinkPreviewComponent = ({ node }: ReactNodeViewProps<HTMLElement>) => {
  const { url, title, description, image, siteName } = node.attrs;

  return (
    <NodeViewWrapper>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "linkPreview bg-parchment/95 hover:bg-parchment/70 transition-all duration-150 ease-out border border-black/5 flex flex-row gap-[16px] items-center rounded-[16px] overflow-hidden my-[8px] group no-underline text-inherit hover:no-underline",
          image ? "p-[16px]" : "p-[20px]"
        )}
        contentEditable={false}
      >
        {image && (
          <img
            src={image}
            alt={title || ""}
            className="w-[160px] object-cover aspect-square rounded-[8px] border border-black/5"
          />
        )}
        <div className="flex flex-col gap-[16px]">
          <div className="flex flex-col gap-[2px]">
            <div className="font-semibold text-[24px] group-hover:underline font-hedvig text-text-primary">
              {title}
            </div>

            {description && (
              <div className="text-[16px] text-text-primary/60 mt-1 line-clamp-2 group-hover:no-underline">
                {description}
              </div>
            )}
          </div>

          <div className="text-[14px] text-text-tertiary group-hover:no-underline">
            {siteName}
          </div>
        </div>
      </a>
    </NodeViewWrapper>
  );
};

export const LinkPreview = Node.create({
  name: "linkPreview",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      url: { default: null },
      title: { default: null },
      description: { default: null },
      image: { default: null },
      siteName: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-link-preview]" }];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    return [
      "div",
      mergeAttributes({ "data-link-preview": "" }, HTMLAttributes),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LinkPreviewComponent);
  },
});
