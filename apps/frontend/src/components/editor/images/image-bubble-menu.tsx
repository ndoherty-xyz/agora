"use client";

import { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { useEffect, useState } from "react";

import { MaximizeIcon, MinimizeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ImageBubbleMenu = ({ editor }: { editor: Editor }) => {
  const [currentSize, setCurrentSize] = useState("large");

  useEffect(() => {
    const updateSize = () => {
      const attrs = editor.getAttributes("imageBlock");
      setCurrentSize(attrs.size || "large");
    };

    editor.on("selectionUpdate", updateSize);
    editor.on("transaction", updateSize);

    return () => {
      editor.off("selectionUpdate", updateSize);
      editor.off("transaction", updateSize);
    };
  }, [editor]);

  return (
    <BubbleMenu
      options={{
        offset: -42,
      }}
      className="transition-all"
      pluginKey="imgBubbleMenu"
      editor={editor}
      shouldShow={({ editor, state }) => {
        console.log("image bubble should show");
        return editor.isActive("imageBlock");
      }}
    >
      <div className="bg-parchment/95 backdrop-blur-[1px] p-[4px] gap-[6px] border border-black/5 rounded-full flex overflow-hidden">
        <Button
          disabled={currentSize === "large"}
          variant={"ghost"}
          size="icon-sm"
          className="p-[2px]"
          onClick={() => {
            editor
              .chain()
              .focus()
              .updateAttributes("imageBlock", { size: "large" })
              .run();
          }}
        >
          <MinimizeIcon size={16} />
        </Button>
        <Button
          disabled={currentSize === "full"}
          variant="ghost"
          size="icon-sm"
          className="p-[2px]"
          onClick={() => {
            editor
              .chain()
              .focus()
              .updateAttributes("imageBlock", { size: "full" })
              .run();
          }}
        >
          <MaximizeIcon size={16} />
        </Button>
      </div>
    </BubbleMenu>
  );
};
