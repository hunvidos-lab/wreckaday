import { z } from "zod";
export const storyInput = z
  .object({
    template_slug: z.literal("seven-foot-fiancee"),
    name: z.string().trim().min(1).max(32).default("Alex"),
    setting: z.string().trim().min(1).max(100).default("our city apartment"),
    custom_details: z.string().trim().max(240).default(""),
    photo_realism: z.number().int().min(0).max(100).default(85),
    satire_intensity: z.number().int().min(0).max(100).default(80),
    frame_count: z.literal(3).default(3),
    cast_mode: z.literal("fictional").default("fictional"),
  })
  .strict();
export type StoryInput = z.infer<typeof storyInput>;
export type Frame = {
  id: string;
  key: string;
  caption: string;
  still_url?: string | null;
  beat: string;
  url: string;
};
export type Story = {
  latest_job_id?: string | null;
  id: string;
  title: string;
  state: string;
  template_slug: string;
  revision: number;
  frames: Frame[];
  reveal: string;
  export_url: string | null;
  provider: "mock";
  created_at: string;
};
export type Job = {
  id: string;
  story_id: string;
  kind: "generate" | "export";
  state: string;
  progress: number;
  error_code: string | null;
  provider_cost_usd: number;
  provider: "mock";
  credits_reserved: number;
};
export type Template = {
  slug: string;
  title: string;
  category: string;
  premise: string;
  duration: string;
  credits: number;
  frame_count: number;
  tagline: string;
  captions: string[];
  reveal: string;
};
