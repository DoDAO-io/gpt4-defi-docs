// https://js.langchain.com/docs/modules/indexes/vector_stores/integrations/pinecone

import { PineconeClient } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { TokenTextSplitter } from 'langchain/text_splitter';
import { PineconeStore } from 'langchain/vectorstores';
import { PuppeteerWebBaseLoader } from 'langchain/document_loaders';
import { Browser, Page } from 'puppeteer';
import { Document as LGCDocument } from 'langchain/document';
import * as dotenv from 'dotenv';

dotenv.config();

const urls = [
  // 'https://whiteboardcrypto.com/impermanent-loss-calculator',
  // 'https://medium.com/auditless/how-to-calculate-impermanent-loss-full-derivation-803e8b2497b7 ',
  // 'https://chainbulletin.com/impermanent-loss-explained-with-examples-math',
  // other
  'https://blockworks.co/news/the-investors-guide-to-navigating-impermanent-loss',
  'https://koinly.io/blog/impermanent-loss/',
  'https://www.ledger.com/academy/glossary/impermanent-loss',
  'https://medium.com/coinmonks/understanding-impermanent-loss-9ac6795e5baa',
  'https://www.blockchain-council.org/defi/impermanent-loss/',
  'https://finematics.com/impermanent-loss-explained/',
  'https://www.finder.com/impermanent-loss',
  'https://www.zenledger.io/blog/what-is-impermanent-loss-in-defi',
];

async function loadDocuments(urls: string[]): Promise<LGCDocument[]> {
  let allDocs: LGCDocument[] = [];
  for (const url of urls) {
    const loader = new PuppeteerWebBaseLoader(url, {
      launchOptions: {
        headless: true,
      },
      gotoOptions: {
        waitUntil: 'domcontentloaded',
      },
      async evaluate(page: Page, browser: Browser) {
        const result = await page.evaluate(() => document.body.innerText);
        return result;
      },
    });
    console.log('downloaded document : ', url);
    const puppeteerDocs: LGCDocument[] = await loader.load();
    const splitter = new TokenTextSplitter({
      encodingName: 'gpt2',
      chunkSize: 10,
      chunkOverlap: 2,
    });

    const contents = puppeteerDocs.pop()!.pageContent;
    console.log('contents', contents);
    const output = await splitter.createDocuments([contents]);

    allDocs = allDocs.concat(output);
  }
  return allDocs;
}

export async function indexDocuments() {
  console.log('start indexing');
  const client = new PineconeClient();
  await client.init({
    apiKey: process.env.PINECONE_API_KEY!,
    environment: process.env.PINECONE_ENVIRONMENT!,
  });
  const pineconeIndex = client.Index(process.env.PINECONE_INDEX!);

  const documents = await loadDocuments(urls);

  console.log('start indexing documents :', documents.length);
  let pineconeStore = await PineconeStore.fromDocuments([documents[0]], new OpenAIEmbeddings(), {
    pineconeIndex,
  });

  console.log('textKey', pineconeStore.textKey);
}

indexDocuments();
