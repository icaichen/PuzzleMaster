import { mkdir, writeFile } from 'node:fs/promises';

const API = 'https://layton.fandom.com/api.php';
const LIST_PAGE = 'Professor Layton and the Azran Legacy/List of puzzles';

async function apiGet(parameters) {
  const url = new URL(API);
  for (const [key, value] of Object.entries({ ...parameters, format: 'json', formatversion: '2' })) {
    url.searchParams.set(key, value);
  }
  const response = await fetch(url, { headers: { 'user-agent': 'PuzzleMasterReferenceAudit/1.0' } });
  if (!response.ok) throw new Error(`API request failed: ${response.status} ${url}`);
  return response.json();
}

async function apiPost(parameters) {
  const body = new URLSearchParams({ ...parameters, format: 'json', formatversion: '2' });
  const response = await fetch(API, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'user-agent': 'PuzzleMasterReferenceAudit/1.0'
    },
    body
  });
  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  return response.json();
}

function extractField(wikitext, field) {
  const pattern = new RegExp(`\\n\\|\\s*${field}\\s*=\\s*([\\s\\S]*?)(?=\\n\\|\\s*[A-Za-z][A-Za-z0-9]*\\s*=|\\n}})`);
  return pattern.exec(`\n${wikitext}`)?.[1]?.trim() ?? '';
}

function cleanText(value) {
  return value
    .replace(/<gallery[\s\S]*?<\/gallery>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[\[(?:[^\]|]+\|)?([^\]]+)]]/g, '$1')
    .replace(/{{[^{}]*}}/g, ' ')
    .replace(/'{2,}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseLuaMetadata(lua) {
  const rows = new Map();
  for (const line of lua.split('\n')) {
    const number = /number\s*=\s*"(\d{3})"/.exec(line)?.[1];
    if (!number) continue;
    rows.set(number, {
      number,
      listedName: /name\s*=\s*"([^"]+)"/.exec(line)?.[1] ?? '',
      listedType: /\["type"\]\s*=\s*"([^"]+)"/.exec(line)?.[1] ?? '',
      picarats: Number(/picarats\s*=\s*(\d+)/.exec(line)?.[1] ?? 0)
    });
  }
  return rows;
}

const linksResponse = await apiGet({ action: 'parse', page: LIST_PAGE, prop: 'links' });
const puzzleTitles = linksResponse.parse.links
  .map(link => link.title)
  .filter(title => title.startsWith('Puzzle:'));
if (puzzleTitles.length !== 165) throw new Error(`Expected 165 puzzle pages, received ${puzzleTitles.length}`);

const moduleResponse = await apiGet({
  action: 'query',
  prop: 'revisions',
  titles: 'Module:PuzzleData/AL',
  rvprop: 'content',
  rvslots: 'main'
});
const moduleWikitext = moduleResponse.query.pages[0].revisions[0].slots.main.content;
const metadata = parseLuaMetadata(moduleWikitext);
if (metadata.size !== 165) throw new Error(`Expected 165 metadata rows, received ${metadata.size}`);

const pages = [];
for (let index = 0; index < puzzleTitles.length; index += 40) {
  const batch = puzzleTitles.slice(index, index + 40);
  const response = await apiPost({
    action: 'query',
    prop: 'revisions',
    titles: batch.join('|'),
    rvprop: 'content',
    rvslots: 'main'
  });
  for (const page of response.query.pages) {
    const wikitext = page.revisions?.[0]?.slots?.main?.content ?? '';
    const number = extractField(wikitext, 'number').match(/\d{3}/)?.[0];
    if (!number) throw new Error(`Missing puzzle number for ${page.title}`);
    const meta = metadata.get(number);
    pages.push({
      number,
      title: page.title.replace(/^Puzzle:/, ''),
      listedName: meta?.listedName ?? '',
      listedType: meta?.listedType ?? '',
      picarats: meta?.picarats ?? 0,
      puzzle: cleanText(extractField(wikitext, 'puzzle')),
      hints: ['hint1', 'hint2', 'hint3', 'hintS'].map(field => cleanText(extractField(wikitext, field))),
      sourceUrl: `https://layton.fandom.com/wiki/${encodeURIComponent(page.title).replace(/%2F/g, '/')}`
    });
  }
}

pages.sort((a, b) => Number(a.number) - Number(b.number));
const numbers = pages.map(page => page.number);
if (new Set(numbers).size !== 165 || numbers[0] !== '001' || numbers.at(-1) !== '165') {
  throw new Error('Reference corpus has missing or duplicate puzzle numbers');
}
if (pages.some(page => !page.puzzle)) throw new Error('At least one puzzle page has no extracted rule text');

const outputDirectory = new URL('../../.cache/reference-audit/', import.meta.url);
await mkdir(outputDirectory, { recursive: true });
await writeFile(new URL('azran-165.raw.json', outputDirectory), `${JSON.stringify({
  source: `https://layton.fandom.com/wiki/${LIST_PAGE}`,
  fetchedAt: new Date().toISOString(),
  count: pages.length,
  puzzles: pages
}, null, 2)}\n`);

const typeCounts = Object.fromEntries([...new Set(pages.map(page => page.listedType))]
  .sort()
  .map(type => [type, pages.filter(page => page.listedType === type).length]));
console.log(JSON.stringify({ count: pages.length, typeCounts, output: '.cache/reference-audit/azran-165.raw.json' }, null, 2));

