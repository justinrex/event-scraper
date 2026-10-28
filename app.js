const express = require('express');
const Events = require('./project/models/events');

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function formatEvents(events) {
  const items = events.map(event => `<li>${escapeHtml(event.title)} — ${escapeHtml(event.date)}</li>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Atlanta Events</title></head><body><main><h1>Atlanta Events</h1>${items ? `<ul>${items}</ul>` : '<p>No saved events yet. Run npm run scrape to import listings.</p>'}</main></body></html>`;
}

function createApp(events = Events) {
  const app = express();
  app.get('/', async (_req, res) => res.type('html').send(formatEvents(await events.all())));
  app.use((error, _req, res, _next) => {
    console.error(error.message);
    res.status(500).send('Unable to load events. Check the database connection.');
  });
  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  createApp().listen(port, '127.0.0.1', () => console.log(`App listening on http://127.0.0.1:${port}`));
}

module.exports = { createApp, formatEvents };
