# Netlify testing preview

Build from the repository root with `node scripts/build-netlify.cjs`.
The result is `apps/mobile/dist`; `netlify.toml` supplies the same build settings
when importing the GitHub repository into Netlify. Use source branch
`feat/local-launcher-key-console` for this revision.

The preview supports browsing the gallery, captions, package selection, photo
selection, premise entry and consent controls. Its capabilities response reports
generation as unavailable. It does not simulate generated results or send photos
to any provider. No backend or inference is included in this static deployment.

Netlify serves the app at the domain root. The build clears the GitHub Pages base
path, disables dotenv loading, checks that the local key console is absent from
the release, and writes SPA redirects so direct links and refreshes work.

To connect a hosted backend later, set `EXPO_PUBLIC_API_URL` to its HTTPS origin
and rebuild. Provider keys belong on that backend. The backend must allow the
Netlify site's origin and implement authenticated generation and spending limits.

An anonymous Netlify deployment can be used immediately, but must be claimed
within one hour to keep it. Account-based hosting can use Netlify's Free plan
within its usage allowance. This deployment does not include inference.

Netlify's AI Gateway supports GPT Image 2 and can charge inference against the
Free plan's included credits. This is a possible route to a limited generation
beta after claiming the project, not an implemented feature of this preview.
It needs a server-side gateway integration, private access, and spending controls.
External fal/BFL calls instead use the corresponding provider's billing.

Official references checked 2026-11-03:
- https://www.netlify.com/changelog/gpt-image-2-ai-gateway/
- https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/pricing-for-ai-features/
