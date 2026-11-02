import { describe, expect, it } from "vitest";
import {
  BRIEF_LIMIT,
  CAPTION_LIMIT,
  PACKAGES,
  createDraft,
  packageFor,
  reducer,
} from "./composer-model";
function generated() {
  return reducer(createDraft("blaze"), {
    type: "result",
    scenes: [1, 2, 3].map((i) => ({
      caption: `Scene ${i}`,
      image_data_url: `data:image/jpeg;base64,${i}`,
    })),
  });
}
describe("photo and premise generation brief", () => {
  it.each(PACKAGES)(
    "opens $name without pretending a story was generated",
    (item) => {
      const draft = createDraft(item.id);
      expect(draft.scenes).toHaveLength(item.scenes);
      expect(draft.generated).toBe(false);
      expect(draft.photoUri).toBeNull();
      expect(
        draft.scenes.every(
          (scene) => scene.caption === "" && scene.imageUri === null,
        ),
      ).toBe(true);
    },
  );
  it("uses integer prices and a safe unknown package fallback", () => {
    expect(PACKAGES.map((item) => item.cents)).toEqual([599, 1999, 2999]);
    expect(packageFor("unknown").id).toBe("flicker");
  });
  it("preserves the reference and premise when choosing package scope", () => {
    let draft = reducer(createDraft(), { type: "photo", uri: "blob:my-photo" });
    draft = reducer(draft, { type: "brief", value: "My payback scene" });
    draft = reducer(draft, { type: "package", id: "inferno" });
    expect(draft).toMatchObject({
      photoUri: "blob:my-photo",
      brief: "My payback scene",
      generated: false,
    });
    expect(draft.scenes).toHaveLength(5);
  });
  it("keeps generated image and caption paired during reordering", () => {
    const draft = generated();
    const moved = reducer(draft, { type: "move", direction: 1 });
    expect(moved.selected).toBe(1);
    expect(moved.scenes[1]).toEqual(draft.scenes[0]);
    expect(draft.scenes[0].caption).toBe("Scene 1");
  });
  it("invalidates old output after premise or photo changes", () => {
    for (const action of [
      { type: "brief", value: "A different scene" },
      { type: "photo", uri: "blob:new-photo" },
    ] as const) {
      const changed = reducer(generated(), action);
      expect(changed.generated).toBe(false);
      expect(changed.scenes.every((scene) => scene.imageUri === null)).toBe(
        true,
      );
    }
  });
  it("rejects incomplete provider results", () => {
    expect(() =>
      reducer(createDraft("blaze"), {
        type: "result",
        scenes: [
          {
            caption: "Wrong count",
            image_data_url: "data:image/jpeg;base64,A",
          },
        ],
      }),
    ).toThrow();
  });
  it("bounds captions and premises and rejects invalid selection", () => {
    let draft = reducer(generated(), {
      type: "caption",
      value: "a".repeat(200),
    });
    expect(draft.scenes[0].caption).toHaveLength(CAPTION_LIMIT);
    draft = reducer(draft, { type: "brief", value: "b".repeat(2000) });
    expect(draft.brief).toHaveLength(BRIEF_LIMIT);
    for (const index of [-1, 5, 1.5])
      expect(reducer(draft, { type: "select", index })).toBe(draft);
  });
  it("clears photo, premise and generated output", () => {
    expect(reducer(generated(), { type: "clear" })).toEqual(createDraft());
  });
});
