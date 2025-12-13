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
        className="block border rounded-lg overflow-hidden my-2 hover:bg-gray-50 no-underline text-inherit"
        contentEditable={false}
      >
        {image && (
          <img
            src={image}
            alt={title || ""}
            className="w-full h-40 object-cover"
          />
        )}
        <div className="p-3">
          <div className="text-xs text-gray-500 mb-1">{siteName}</div>
          <div className="font-medium">{title}</div>
          {description && (
            <div className="text-sm text-gray-600 mt-1 line-clamp-2">
              {description}
            </div>
          )}
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
