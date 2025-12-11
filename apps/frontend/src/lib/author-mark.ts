import { Mark, getMarkType } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { ReplaceStep } from "@tiptap/pm/transform";

export interface AuthorMarkOptions {
  getUser: () => {
    name: string;
    color: string;
    handle?: string;
    avatar?: string;
  };
}

export const AuthorMark = Mark.create<AuthorMarkOptions>({
  name: "author",

  addOptions() {
    return {
      getUser: () => ({ name: "Anonymous", color: "#888888" }),
    };
  },

  addAttributes() {
    return {
      name: { default: null },
      color: { default: null },
      handle: { default: null },
      avatar: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-author]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      {
        "data-author": HTMLAttributes.name,
        "data-author-color": HTMLAttributes.color,
        "data-author-handle": HTMLAttributes.handle || "",
        "data-author-avatar": HTMLAttributes.avatar || "",
        style: `border-bottom: 2px solid ${HTMLAttributes.color}`,
      },
      0,
    ];
  },

  addProseMirrorPlugins() {
    const getUser = this.options.getUser;

    return [
      new Plugin({
        key: new PluginKey("author"),
        appendTransaction(transactions, oldState, newState) {
          // only care about transactions that changed the doc
          const docChanged = transactions.some((tr) => tr.docChanged);
          if (!docChanged) return null;

          const tr = newState.tr;
          let modified = false;

          for (const transaction of transactions) {
            // skip remote yjs changes
            if (transaction.getMeta("y-sync$")) continue;

            for (const step of transaction.steps) {
              if (step instanceof ReplaceStep) {
                const { from } = step;
                const slice = step.slice;

                // if inserting content (not just deleting)
                if (slice && slice.content.size > 0) {
                  const user = getUser();
                  const markType = getMarkType("author", newState.schema);
                  const mark = markType.create({
                    name: user.name,
                    color: user.color,
                    handle: user.handle,
                    avatar: user.avatar,
                  });

                  // calculate inserted range in new doc
                  const insertEnd = from + slice.content.size;
                  tr.addMark(from, insertEnd, mark);
                  modified = true;
                }
              }
            }
          }

          return modified ? tr : null;
        },
      }),
    ];
  },
});
