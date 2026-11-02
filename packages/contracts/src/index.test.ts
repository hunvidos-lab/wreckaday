import { describe, expect, it } from "vitest";
import { storyInput } from "./index";
import { readFileSync } from "node:fs";
const fixtures = JSON.parse(
  readFileSync(new URL("../fixtures.json", import.meta.url), "utf8"),
) as { input: unknown; valid: boolean }[];
describe("mobile/API contract fixtures", () => {
  for (const [i, fixture] of fixtures.entries()) {
    it(`validates shared fixture ${i}`, () => {
      expect(storyInput.safeParse(fixture.input).success).toBe(fixture.valid);
    });
  }
  it("applies the documented defaults", () => {
    expect(
      storyInput.parse({ template_slug: "seven-foot-fiancee" }),
    ).toMatchObject({
      frame_count: 3,
      cast_mode: "fictional",
      photo_realism: 85,
    });
  });
});

it("matches API field names, defaults, and constraints", async () => {
  const { z } = await import("zod");
  const server = JSON.parse(
    readFileSync(
      new URL("../story-input.schema.json", import.meta.url),
      "utf8",
    ),
  );
  const mobile = z.toJSONSchema(storyInput);
  expect(Object.keys(mobile.properties ?? {}).sort()).toEqual(
    Object.keys(server.properties).sort(),
  );
  for (const [name, field] of Object.entries(mobile.properties ?? {})) {
    const normalize = (value: Record<string, unknown>) =>
      Object.fromEntries(
        Object.entries(value).filter(([key]) =>
          [
            "const",
            "default",
            "minimum",
            "maximum",
            "minLength",
            "maxLength",
          ].includes(key),
        ),
      );
    expect(normalize(field as Record<string, unknown>)).toEqual(
      normalize(server.properties[name]),
    );
  }
  expect(mobile.additionalProperties).toBe(false);
});
