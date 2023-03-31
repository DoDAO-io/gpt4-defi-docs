import { indexDocuments } from './indexer';
import { add } from './index';

test('my first test', async () => {
  await indexDocuments();

  await expect(add(4, 6)).toBe(10);
});
