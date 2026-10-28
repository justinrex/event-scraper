const { JSDOM } = require('jsdom');
const Events = require('../models/events');
const { months } = require('./months');

function parseEvents(html) {
  const dom = new JSDOM(html);
  try {
    return Array.from(dom.window.document.querySelectorAll('article')).flatMap(article => {
      const title = article.querySelector('h3')?.textContent.trim();
      const date = article.querySelector('.date')?.textContent.trim().toLowerCase();
      return title && date ? [{ title, date }] : [];
    });
  } finally {
    dom.window.close();
  }
}

async function init({ fetchPage = fetch, save = Events.save, monthNames = months } = {}) {
  let count = 0;
  for (const month of monthNames) {
    const response = await fetchPage(`https://www.events12.com/atlanta/${month}`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Unable to fetch ${month}: HTTP ${response.status}`);
    const events = parseEvents(await response.text());
    await save(events);
    count += events.length;
  }
  return count;
}

if (require.main === module) {
  init().then(count => console.log(`Saved ${count} event listings.`)).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { init, parseEvents };
