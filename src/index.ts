import { indexDocuments } from './indexer';
import { search } from './searcher';

export function add(a: number, b: number) {
  return a + b;
}

export async function run() {
  await indexDocuments();
  await search();
}

run();
