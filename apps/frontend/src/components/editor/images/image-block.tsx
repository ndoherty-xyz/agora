/* eslint-disable @next/next/no-img-element */
import {
  ReactNodeViewRenderer,
  Node,
  mergeAttributes,
  ReactNodeViewProps,
  CommandProps,
} from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";

declare module "@tiptap/react" {
  interface Commands<ReturnType> {
    imageBlock: {
      setImageBlock: (options: { src: string; size?: string }) => ReturnType;
    };
  }
}

export const ImageBlock = Node.create({
  name: "imageBlock",
  group: "block",
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      size: { default: "large" }, // 'large' | 'full'
    };
  },

  parseHTML() {
    return [{ tag: "div[data-image-block]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-image-block": "" }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageBlockComponent);
  },

  addCommands() {
    return {
      setImageBlock:
        (options: { src: string; size?: string }) =>
        ({ commands }: CommandProps) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});

const ImageBlockComponent = ({
  node,
  getPos,
  editor,
}: ReactNodeViewProps<HTMLElement>) => {
  const { src, size } = node.attrs;

  const sizeClasses = {
    small: "max-w-sm",
    large: "max-w-2xl",
    full: "max-w-full",
  };

  return (
    <NodeViewWrapper
      onClick={() => {
        const pos = getPos();
        if (pos) editor.chain().setNodeSelection(pos).run();
      }}
      className="flex justify-center py-[48px]"
    >
      <img
        src={src}
        contentEditable={false}
        alt=""
        className={`${
          sizeClasses[size as keyof typeof sizeClasses]
        } w-full h-auto pointer-events-none rounded-[16px] border-black/5 border`}
      />
    </NodeViewWrapper>
  );
};
