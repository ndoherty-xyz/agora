import * as Y from "yjs";
import { extractTextFromElement, extractTextFromYText, ImageNode } from "./doc";
import OpenAI from "openai";
import { db } from "../db";
import { moderatedImage } from "../db/schema";
import { eq } from "drizzle-orm";

interface FlaggedElement {
  parent: Y.XmlFragment | Y.XmlElement;
  index: number;
}

export type FlaggedElementMapping = Map<Y.XmlFragment | Y.XmlElement, number[]>;

const openAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function parseModerationResponse(
  moderationResponse: OpenAI.Moderations.ModerationCreateResponse
): { flagged: boolean; categories: string[] } {
  const result = moderationResponse.results[0];
  const flaggedCategories = Object.entries(result.categories)
    .filter(([_, flagged]) => flagged)
    .map(([category]) => category);

  return { flagged: result.flagged, categories: flaggedCategories };
}

export function mergeDeletionMaps(
  map1: FlaggedElementMapping,
  map2: FlaggedElementMapping
): FlaggedElementMapping {
  const merged = new Map(map1);

  map2.forEach((indices, parent) => {
    const existing = merged.get(parent) || [];
    merged.set(
      parent,
      [...existing, ...indices].sort((a, b) => b - a)
    );
  });

  return merged;
}

export async function checkTextForFlaggedContent(
  text: string
): Promise<{ flagged: boolean; categories: string[] }> {
  if (text.trim() === "") {
    return { flagged: false, categories: [] };
  }

  try {
    const moderationRes = await openAI.moderations.create({
      input: text,
      model: "omni-moderation-latest",
    });

    return parseModerationResponse(moderationRes);
  } catch (err: unknown) {
    console.error(
      "[Moderation] API Call Error - ",
      err instanceof Error ? err.message : "Unknown error"
    );
    return { flagged: false, categories: [] };
  }
}

export async function findFlaggedNodes(
  fragment: Y.XmlFragment
): Promise<FlaggedElementMapping> {
  const topLevelElements = fragment.toArray();
  let flaggedElements: FlaggedElement[] = await binarySearchFlagged(
    topLevelElements as (Y.XmlElement | Y.XmlText)[],
    fragment,
    0
  );

  const flaggedElementMapping = new Map<
    Y.XmlFragment | Y.XmlElement,
    number[]
  >();

  flaggedElements.forEach((el) => {
    const current = flaggedElementMapping.get(el.parent) ?? [];
    flaggedElementMapping.set(el.parent, current.concat([el.index]));
  });

  // now sort each array
  flaggedElementMapping.forEach((indices, parent) => {
    flaggedElementMapping.set(
      parent,
      indices.sort((a, b) => b - a)
    );
  });

  return flaggedElementMapping;
}

async function binarySearchFlagged(
  elements: (Y.XmlElement | Y.XmlText)[],
  parent: Y.XmlFragment | Y.XmlElement,
  startIndex: number // offset within parent
): Promise<FlaggedElement[]> {
  let flaggedElements: FlaggedElement[] = [];

  if (elements.length === 0) {
    return [];
  } else if (elements.length === 1) {
    const element = elements[0];
    if (element instanceof Y.XmlText) {
      const flagged = await checkTextNode(element);
      if (flagged) {
        return [{ index: startIndex, parent }];
      }
      return [];
    } else {
      const elementText = extractTextFromElement(element);
      if (elementText.trim() === "") return [];

      const { flagged } = await checkTextForFlaggedContent(elementText);
      if (!flagged) return []; // element is clean, skip children

      // element is flagged, recurse into children
      const children: (Y.XmlElement | Y.XmlText)[] = [];
      element.forEach((child) => children.push(child));
      return await binarySearchFlagged(children, element, 0);
    }
  } else {
    const splitIndex = Math.floor(elements.length / 2);
    const firstHalf = elements.slice(0, splitIndex);
    const secondHalf = elements.slice(splitIndex);

    const firstHalfText = firstHalf
      .map((el) => {
        return el instanceof Y.XmlElement
          ? extractTextFromElement(el)
          : extractTextFromYText(el);
      })
      .join("\n");

    const secondHalfText = secondHalf
      .map((el) => {
        return el instanceof Y.XmlElement
          ? extractTextFromElement(el)
          : extractTextFromYText(el);
      })
      .join("\n");

    const [firstHalfFlagged, secondHalfFlagged] = await Promise.all([
      checkTextForFlaggedContent(firstHalfText),
      checkTextForFlaggedContent(secondHalfText),
    ]);

    if (firstHalfFlagged.flagged) {
      const flaggedElementsInFirstHalf = await binarySearchFlagged(
        firstHalf,
        parent,
        startIndex
      );
      flaggedElements = flaggedElements.concat(flaggedElementsInFirstHalf);
    }
    if (secondHalfFlagged.flagged) {
      const flaggedElementsInSecondHalf = await binarySearchFlagged(
        secondHalf,
        parent,
        startIndex + splitIndex
      );
      flaggedElements = flaggedElements.concat(flaggedElementsInSecondHalf);
    }
  }

  return flaggedElements;
}

async function checkTextNode(textNode: Y.XmlText): Promise<boolean> {
  const text = extractTextFromYText(textNode);
  const { flagged } = await checkTextForFlaggedContent(text);
  return flagged;
}

export async function getFlaggedImages(
  imageNodes: ImageNode[]
): Promise<FlaggedElementMapping> {
  const urls = new Set<string>();
  imageNodes.forEach((node) => urls.add(node.url));

  const flaggedImageUrls = await moderateImages([...urls]);
  const flaggedSet = new Set(flaggedImageUrls);
  const flaggedImageNodes = imageNodes.filter((node) =>
    flaggedSet.has(node.url)
  );

  const flaggedImageMapping: FlaggedElementMapping = new Map();
  flaggedImageNodes.forEach((node) => {
    const current = flaggedImageMapping.get(node.parent) ?? [];
    flaggedImageMapping.set(node.parent, current.concat([node.index]));
  });
  flaggedImageMapping.forEach((indices, parent) => {
    flaggedImageMapping.set(
      parent,
      indices.sort((a, b) => b - a)
    );
  });

  return flaggedImageMapping;
}

async function moderateImages(urls: string[]): Promise<string[]> {
  const results = await Promise.all(
    urls.map(async (url) => {
      const result = await moderateAndStoreImage(url);
      return { url, flagged: result.flagged };
    })
  );

  return results.filter((r) => r.flagged).map((r) => r.url);
}

async function moderateAndStoreImage(
  url: string
): Promise<{ flagged: boolean; categories?: string[] }> {
  const alreadyChecked = await checkDatabaseForModeratedImage(url);

  if (alreadyChecked.found) {
    return { flagged: !!alreadyChecked.flagged };
  } else {
    try {
      const moderationRes = await openAI.moderations.create({
        model: "omni-moderation-latest",
        input: [
          {
            type: "image_url",
            image_url: { url },
          },
        ],
      });

      const parsed = parseModerationResponse(moderationRes);

      try {
        await db.insert(moderatedImage).values({
          url,
          flagged: parsed.flagged,
        });
      } catch (err) {
        // ignore, we can re-parse later, but don't want to throw
        console.error("[Moderation] DB insert failed, will retry later:", err);
      }

      return parsed;
    } catch (err: unknown) {
      console.error(
        "[Moderation - Image] API Call Error - ",
        err instanceof Error ? err.message : "Unknown error"
      );
      return { flagged: false, categories: [] };
    }
  }
}

async function checkDatabaseForModeratedImage(
  url: string
): Promise<{ found: boolean; flagged?: boolean }> {
  const [image] = await db
    .select()
    .from(moderatedImage)
    .where(eq(moderatedImage.url, url))
    .limit(1);

  if (!image) {
    return { found: false };
  } else {
    return { found: true, flagged: image.flagged };
  }
}
