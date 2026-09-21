# WIPAHS OfficeHub

Production portal: [https://office.wipahs.org/](https://office.wipahs.org/)

This repository preserves the deployable OfficeHub frontend recovered from the cPanel production host. Supabase remains the backend and is not copied into this repository. Secrets, production user data, and private keys are intentionally excluded.

## Repository layout

- `index.html` — React application entry document.
- `assets/` — compiled JavaScript, CSS, and lazy-loaded modules.
- `.htaccess` — Apache routing, caching, and compression rules.
- `scripts/deploy-officehub.sh` — guarded cPanel deployment script.
- `.cpanel.yml` — cPanel deployment entry point.

## Deployment

The cPanel checkout is `/home/wipahs/officehub-repo` and the live document root is `/home/wipahs/office.wipahs.org`.

The deployment script fetches `main`, accepts only fast-forward updates, validates the release, backs up the live entry files, and publishes the compiled assets without deleting older assets.

Do not commit Supabase service-role keys, cPanel credentials, user exports, or `.env` files.

## Source-code status

The original uncompiled React/Vite source was not present on cPanel when this repository was recovered. The current repository is a production snapshot, not a reconstructed source tree. A maintainable React source project should be introduced separately and verified feature-by-feature before replacing the live build.
