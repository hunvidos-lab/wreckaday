# Provider investigation — 2026-11-02

## Recommendation and evidence limits

Use Llama as the scenario writer and a reference-image editor as the image model.
These are separate jobs. A text-only Llama model cannot put the uploaded person's
face into a generated photograph. Llama 3.3 70B Instruct is a reasonable baseline
for the short structured scene plans required here; that is an engineering
inference from its intended instruction-following role, not a Wreckaday quality
benchmark. Compare smaller models only after testing output validity and writing.

| Candidate | Intended role | Verified upstream facts | Decision |
| --- | --- | --- | --- |
| Meta Llama 3.3 70B Instruct | Review/plan premises, captions, image prompts | Instruction-tuned text model; custom Llama 3.3 Community License; upstream shows chat-compatible serving | Configurable baseline; not described as Apache/open-source without qualification |
| FLUX.2 Klein 4B | Put the uploader into a photorealistic scene | Apache 2.0 weights; image editing and multiple reference images supported | Initial hosted adapter, official BFL reference-photo endpoint |
| Qwen-Image-Edit | Alternative reference-image editor | Apache 2.0 model card; semantic and appearance editing | Comparison candidate via an operator-provided compatible editing endpoint |
| Dolphin 3.0 Llama 3.1 8B | Optional controlled comparison of creative writing | Instruct fine-tune of Llama, Llama 3.1 license; publisher emphasizes steerability and control of alignment | Investigated, not selected or downloaded; no claim that fewer refusals improve story or image quality |

Model license and hosting-service terms are different. Check the exact weight
revision, host's commercial terms, retention, transfer locations, supported schema
mode and image-edit contract before enabling. Do not assume different FLUX
variants, Qwen versions or Llama descendants inherit the same license.

## Founder terminology and model access

The founder clarified that “jailbroken” means models whose weights, deployment,
system prompts and creative direction we can control ourselves. Treat this as a
request for open/self-hostable models and steerable fine-tunes, not as a request
to attack a closed service. Evaluate weight availability, ungated downloads,
commercial license, self-hosting support and default refusal behavior separately.
Open weights do not automatically imply ungated access or a permissive license.

### Steerability and quality

A jailbreak is an attempt to defeat safeguards; an uncensored/steerable fine-tune
is a model variant. Neither label establishes photorealism, facial continuity,
scene coherence, reliable structured output, cost or speed. Dolphin is a concrete
upstream example of a model marketed around control of alignment. Its model card
is evidence of that positioning, not evidence of suitability for this app.

Useful next-level work is better art direction, consistent reference conditioning,
stronger multi-frame continuity, sharper captions, controlled rerolls and quality
scoring. Compare any fine-tune on those outcomes under the same application rules.
Do not add safeguard-bypass prompts or choose a model to enable threats,
nonconsensual imagery, fabricated evidence, doxxing or targeted abuse. No jailbreak
weights, bypass controls or ablation workflow were installed by this change.

## Implemented adapter contracts

Text: full chat-completions URL, server-owned model and key, JSON-schema output,
60-second per-call timeout, two calls (premise review and scene planning). The host
must support this schema mode; no guarantee every “compatible” server does.

BFL: `POST /v1/flux-2-klein-4b` with a normalized reference photo in `input_image`
and a scene prompt. Poll the returned URL on the same configured origin or an official BFL regional API host, bounded
to 30 polls and 90 seconds of polling. Fetch result only from HTTPS BFL delivery
hosts without forwarding API credentials. No safety-tolerance override, submission
retry, alternate-model fallback or public photo URL.

Self-hosted/image-edits: a server that accepts multipart `image`, `model`, `prompt`,
`n=1`, `response_format=b64_json`, `size=1024x1536`, and returns
`data[0].b64_json`. Qwen's Diffusers pipeline does not itself implement this HTTP
contract; it needs an operator-provided serving wrapper. ComfyUI/fal/Replicate and
other services have distinct APIs and need their own adapters if selected. This
revision does not claim those services work simply by changing their URL.

Configuration is in `.env.example`. Keys stay on the server, live generation is
off by default, and blank cost ceilings leave it unavailable. No provider account
was connected and no configured-provider inference request was made during this
work. Tests use httpx MockTransport and explicitly mocked browser API responses.

## Benchmark before committing to a provider

Run ten real hero stories with authorized adult self-photos, plus the master
spec's broader 30 scenario/variation comparison. Record model/weight revision,
provider, prompt version, dimensions, number of rerolls, actual invoice/usage
cost (including failures), total time and manual quality scores.

Score 1–5: identity match, face/hands, wardrobe/location continuity, premise
adherence, physical realism, framing, caption quality and impact of the reveal.
Compare equal delivered-story quality, not just base image price. Measure P50/P95
latency, valid JSON rate and failure/rejection behavior. Review inputs/outputs for
unsupported content as a separate criterion. Do not use lower refusal rate as a
proxy for quality.

No ten-story quality or cost result exists yet. The new marketing photographs
were generated with the built-in imagegen tool, not with these configured
providers; the interface identifies them as illustrative art direction.

## Primary sources consulted

- [Meta Llama 3.3 model card and license](https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct)
- [BFL FLUX.2 Klein 4B model card](https://huggingface.co/black-forest-labs/FLUX.2-klein-4B)
- [BFL generation/edit API](https://docs.bfl.ai/api-reference/models/generate-or-edit-an-image-with-flux2-%5Bklein%5D-4b)
- [BFL polling and delivery-host documentation](https://docs.bfl.ai/quick_start/generating_images)
- [Qwen-Image-Edit upstream model card](https://huggingface.co/Qwen/Qwen-Image-Edit)
- [Dolphin 3.0 Llama 3.1 model card](https://huggingface.co/dphn/Dolphin3.0-Llama3.1-8B)
