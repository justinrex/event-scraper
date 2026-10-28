const { test } = require('node:test');
const assert = require('node:assert/strict');
const { init, parseEvents } = require('../project/lib/appInitialization');
const { createStore } = require('../project/server/mongoClient');
const { formatEvents, createApp } = require('../app');

const article = '<article><h3>  Music &amp; Art  </h3><div class="date"> June 4, 2027 </div></article>';

test('extracts complete listings and skips incomplete calendar markup', () => {
  assert.deepEqual(parseEvents(article + '<article><h3>Missing date</h3></article>'), [
    { title: 'Music & Art', date: 'june 4, 2027' },
  ]);
});

test('awaits each import before fetching the next month', async () => {
  const steps = [];
  const count = await init({
    monthNames: ['june', 'july'],
    fetchPage: async url => { steps.push(url.split('/').pop()); return { ok: true, text: async () => article }; },
    save: async events => { await Promise.resolve(); steps.push('saved'); assert.equal(events.length, 1); },
  });
  assert.equal(count, 2);
  assert.deepEqual(steps, ['june', 'saved', 'july', 'saved']);
});

test('rejects failed downloads and failed persistence', async () => {
  await assert.rejects(init({ monthNames: ['june'], fetchPage: async () => ({ ok: false, status: 503 }) }), /HTTP 503/);
  await assert.rejects(init({ monthNames: ['june'], fetchPage: async () => ({ ok: true, text: async () => article }), save: async () => { throw Error('write failed'); } }), /write failed/);
});

test('upserts repeat imports and closes the client after writes finish', async () => {
  const steps = [];
  const document = { title: 'Music', date: 'june 4' };
  const client = {
    connect: async () => steps.push('connected'),
    db: () => ({ collection: () => ({ bulkWrite: async operations => {
      assert.deepEqual(operations[0].updateOne, { filter: document, update: { $set: document }, upsert: true });
      await Promise.resolve(); steps.push('saved');
    } }) }),
    close: async () => steps.push('closed'),
  };
  await createStore(() => client).save('events', [document]);
  assert.deepEqual(steps, ['connected', 'saved', 'closed']);
});

test('closes clients on connection failure and skips empty writes', async () => {
  let closed = false;
  const store = createStore(() => ({ connect: async () => { throw Error('offline'); }, close: async () => { closed = true; } }));
  await store.save('events', []);
  assert.equal(closed, false);
  await assert.rejects(store.all('events'), /offline/);
  assert.equal(closed, true);
});

test('escapes imported event content and provides an empty state', () => {
  const html = formatEvents([{ title: '<script>alert(1)</script>', date: '"today" & tomorrow' }]);
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('&quot;today&quot; &amp; tomorrow'));
  assert.ok(formatEvents([]).includes('No saved events yet'));
});

test('serves listings and returns a response when the database is unavailable', async t => {
  let offline = false;
  const server = createApp({ all: async () => {
    if (offline) throw Error('database unavailable');
    return [{ title: 'Music', date: 'june 4' }];
  } }).listen(0, '127.0.0.1');
  t.after(() => new Promise(resolve => server.close(resolve)));
  await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(url);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Music/);
  offline = true;
  const failure = await fetch(url);
  assert.equal(failure.status, 500);
  assert.match(await failure.text(), /Unable to load events/);
});
