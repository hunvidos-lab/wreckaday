export const PACKAGES = [
  {
    id: "flicker",
    name: "Flicker",
    cents: 599,
    scenes: 1,
    heat: "One image. Point made.",
    description:
      "A photorealistic scene built around your photo and your premise.",
  },
  {
    id: "blaze",
    name: "Blaze",
    cents: 1999,
    scenes: 3,
    heat: "Let the story do the damage.",
    description:
      "Three scenes. A slow burn, a sharp escalation, a final reveal.",
  },
  {
    id: "inferno",
    name: "Inferno",
    cents: 2999,
    scenes: 5,
    heat: "The full production.",
    description:
      "Five scenes of extravagant payback fiction. Built to make them look twice.",
  },
] as const;
export const EXAMPLES = [
  {
    title: "Your seat’s been taken.",
    tag: "THE UPGRADE",
    premise:
      "Put me on a private yacht at dusk, impeccably dressed, looking straight into the camera. The life they thought I couldn't have. A cold, cinematic fictional reveal.",
    caption: "Turns out the baggage was optional.",
    image: 0,
  },
  {
    title: "Living rent-free.",
    tag: "THE TAKEOVER",
    premise:
      "Put me on a throne surrounded by hundreds of red roses in a penthouse above the city. Expensive, excessive, completely unbothered. End with a payback-fiction reveal.",
    caption: "You wanted space. I upgraded mine.",
    image: 1,
  },
  {
    title: "A table for everyone who matters.",
    tag: "THE FINAL WORD",
    premise:
      "Put me at the head of an empty banquet table in a candlelit restaurant, raising a glass to my own exit. Make the empty seats the punchline. Clearly fictional.",
    caption: "Your invitation got lost. Deliberately.",
    image: 2,
  },
] as const;
export type PackageId = (typeof PACKAGES)[number]["id"];
export type Scene = {
  id: string;
  caption: string;
  imageUri: string | null;
  artwork: number;
};
export type Draft = {
  packageId: PackageId;
  brief: string;
  photoUri: string | null;
  scenes: Scene[];
  selected: number;
  generated: boolean;
};
export const FICTION_LABEL = "WRECKADAY · AI FICTION";
export const REVEAL = "A fictional prank. No real events depicted.";
export const CAPTION_LIMIT = 140;
export const BRIEF_LIMIT = 1000;
export function packageFor(id: string) {
  return PACKAGES.find((item) => item.id === id) ?? PACKAGES[0];
}
export function createDraft(packageId: PackageId = "flicker"): Draft {
  return {
    packageId,
    brief: "",
    photoUri: null,
    selected: 0,
    generated: false,
    scenes: Array.from(
      { length: packageFor(packageId).scenes },
      (_, index) => ({
        id: `${packageId}-${index}`,
        caption: "",
        imageUri: null,
        artwork: index % 3,
      }),
    ),
  };
}
export type Action =
  | { type: "package"; id: PackageId }
  | { type: "brief"; value: string }
  | { type: "photo"; uri: string }
  | { type: "result"; scenes: { caption: string; image_data_url: string }[] }
  | { type: "caption"; value: string }
  | { type: "select"; index: number }
  | { type: "move"; direction: -1 | 1 }
  | { type: "clear" };
export function reducer(draft: Draft, action: Action): Draft {
  switch (action.type) {
    case "package":
      return {
        ...createDraft(action.id),
        brief: draft.brief,
        photoUri: draft.photoUri,
      };
    case "brief":
      return {
        ...draft,
        brief: action.value.slice(0, BRIEF_LIMIT),
        generated: false,
        scenes: createDraft(draft.packageId).scenes,
        selected: 0,
      };
    case "photo":
      return {
        ...draft,
        photoUri: action.uri,
        generated: false,
        scenes: createDraft(draft.packageId).scenes,
        selected: 0,
      };
    case "result": {
      if (
        action.scenes.length !== packageFor(draft.packageId).scenes ||
        action.scenes.some(
          (scene) =>
            !scene.image_data_url.startsWith("data:image/") ||
            !scene.caption.trim() ||
            scene.caption.length > CAPTION_LIMIT,
        )
      )
        throw new Error("The provider returned an invalid story.");
      return {
        ...draft,
        generated: true,
        selected: 0,
        scenes: action.scenes.map((scene, index) => ({
          id: `${draft.packageId}-${index}`,
          caption: scene.caption,
          imageUri: scene.image_data_url,
          artwork: index % 3,
        })),
      };
    }
    case "select":
      return Number.isInteger(action.index) &&
        action.index >= 0 &&
        action.index < draft.scenes.length
        ? { ...draft, selected: action.index }
        : draft;
    case "caption":
      return {
        ...draft,
        scenes: draft.scenes.map((scene, index) =>
          index === draft.selected
            ? { ...scene, caption: action.value.slice(0, CAPTION_LIMIT) }
            : scene,
        ),
      };
    case "move": {
      const target = draft.selected + action.direction;
      if (target < 0 || target >= draft.scenes.length) return draft;
      const scenes = [...draft.scenes];
      [scenes[draft.selected], scenes[target]] = [
        scenes[target],
        scenes[draft.selected],
      ];
      return { ...draft, scenes, selected: target };
    }
    case "clear":
      return createDraft();
  }
}
