# Sarvam Sabarigireesha — Independent Rebuild

This is a zero-cost static rebuild starter based on the public structure/content of the current live site.

## Run locally
Open `index.html` in a browser, or use a simple local server.

## GitHub
Create a new repository and upload:
- index.html
- styles.css
- script.js
- assets/

Do not upload passwords, API keys, `.env` files, or private credentials.

## Cloudflare Pages
1. Create a Cloudflare account.
2. Pages → Create a project → Connect to Git.
3. Select this GitHub repository.
4. For this static build, no build command is required.
5. Output directory: `/`
6. Deploy.

## Domain
After deployment, add `sarvamsabarigireesha.com` as a custom domain in Cloudflare Pages and follow the DNS instructions shown by Cloudflare.

## Important
This rebuild intentionally does not depend on Emergent assets or backend services. The image areas are local CSS placeholders so the site remains independent. Replace them with images you own/have permission to use before publishing.
