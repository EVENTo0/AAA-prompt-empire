import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const appRoot = new URL('../', import.meta.url)

async function json(url) {
  return JSON.parse(await readFile(url, 'utf8'))
}

test('EVENTO pilot snapshot matches canonical registry', async () => {
  const local = await json(new URL('data/evento-modernization-pilots.json', appRoot))
  const canonical = await json(new URL('../../registry/evento-modernization-pilots.json', appRoot))
  assert.deepEqual(local, canonical)
})

test('EVENTO agent capability snapshot matches canonical registry', async () => {
  const local = await json(new URL('data/evento-agent-capabilities.json', appRoot))
  const canonical = await json(new URL('../../registry/evento-agent-capabilities.json', appRoot))
  assert.deepEqual(local, canonical)
})
