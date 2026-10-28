# Event Scraper

A small Node.js app that imports Atlanta event titles and dates from Events12, saves them in MongoDB, and serves the saved listings as HTML.

## Run locally

Use Node.js 24 LTS (24.15 or newer), npm, and a running MongoDB instance.

```sh
nvm use
npm ci
cp .env.example .env
npm run scrape
npm start
```

Open [localhost:3000](http://localhost:3000). Set `MONGODB_URI`, `MONGODB_DATABASE`, and `PORT` in `.env` if needed. For a local database, one option is:

```sh
docker run --rm --name event-scraper-mongo -p 127.0.0.1:27017:27017 -v event-scraper-data:/data/db mongo:8
```

Importing is an explicit command; starting the web server does not scrape. Imports process month pages sequentially, await database writes, and upsert by title and date so repeat imports update matching listings.

## Checks

```sh
npm run check
```

Tests use HTML fixtures, fake database clients, and a local HTTP server. They cover incomplete markup, import ordering and failures, client cleanup, HTML escaping, and HTTP error responses. CI does not contact the live calendar or require MongoDB.

## Boundaries

This is an experimental scraper for one site's markup. It stores the displayed date string rather than a normalized timestamp, does not remove expired events, and may need parser updates if the site changes. Live source compatibility and a real MongoDB import are separate manual checks. Review the source site's current access rules before importing; the web UI only reads stored data.
