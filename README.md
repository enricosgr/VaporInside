# Vapor Inside – sito web

Sito statico (HTML/CSS/JS, nessuna build) del negozio di sigarette elettroniche Vapor Inside, Castelfranco Veneto.

Aprire `index.html` nel browser, oppure pubblicare con GitHub Pages (Settings → Pages → branch principale, cartella root).

## Pubblicazione (GitHub Pages)
La workflow `.github/workflows/pages.yml` pubblica il sito a ogni push e **ogni 3 ore**,
scaricando prima gli ultimi video del canale YouTube in `data/videos.json` (`scripts/fetch-videos.mjs`).

Requisito una tantum: *Settings → Pages → Build and deployment → Source: **GitHub Actions***.


I marchi del banner scorrevole si modificano nell'array `BRANDS` in `js/main.js`.
