import * as Y from "yjs";

export function extractTextFromYText(textNode: Y.XmlText): string {
  let text = "";
  const delta = textNode.toDelta();
  for (const op of delta) {
    if (op.insert) {
      text += op.insert;
    }
  }
  return text;
}

export function extractTextFromElement(element: Y.XmlElement): string {
  let text = "";

  element.forEach((child) => {
    if (child instanceof Y.XmlText) {
      text += extractTextFromYText(child);
    } else if (child instanceof Y.XmlElement) {
      text += extractTextFromElement(child);
    }
  });

  text += "\n";
  return text;
}

export function extractText(fragment: Y.XmlFragment): string {
  let text = "";

  const children = fragment.toArray();
  for (const child of children) {
    if (child instanceof Y.XmlElement) {
      text += extractTextFromElement(child);
    } else if (child instanceof Y.XmlText) {
      text += extractTextFromYText(child) + "\n";
    }
  }

  return text.trim();
}

export type ImageNode = {
  url: string;
  element: Y.XmlElement;
  parent: Y.XmlFragment | Y.XmlElement;
  index: number;
};

export function extractImageNodes(
  elementOrFragment: Y.XmlElement | Y.XmlFragment
): ImageNode[] {
  let images: ImageNode[] = [];

  let children: (Y.XmlElement | Y.XmlText)[];
  if (elementOrFragment instanceof Y.XmlElement) {
    children = [];
    elementOrFragment.forEach((child) => children.push(child));
  } else {
    children = elementOrFragment.toArray() as (Y.XmlElement | Y.XmlText)[];
  }

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child instanceof Y.XmlElement) {
      if (child.nodeName === "image") {
        const source = child.getAttribute("src");
        if (source)
          images.push({
            element: child,
            index: i,
            parent: elementOrFragment,
            url: source,
          });
      } else {
        // recursive
        images = images.concat(extractImageNodes(child));
      }
    }
  }

  return images;
}
