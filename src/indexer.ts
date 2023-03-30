// https://js.langchain.com/docs/modules/indexes/vector_stores/integrations/pinecone

import { PineconeClient } from "@pinecone-database/pinecone";
import * as dotenv from "dotenv";
import { OpenAIEmbeddings } from "langchain/embeddings";
import { PineconeStore } from "langchain/vectorstores";
import { PuppeteerWebBaseLoader } from "langchain/document_loaders";
import {Browser, Page} from "puppeteer";
import { Document as LGCDocument} from "langchain/document";

dotenv.config();

const client = new PineconeClient();
await client.init({
  apiKey: process.env.PINECONE_API_KEY,
  environment: process.env.PINECONE_ENVIRONMENT,
});
const pineconeIndex = client.Index(process.env.PINECONE_INDEX);


const loader = new PuppeteerWebBaseLoader("https://www.tabnews.com.br/", {
  launchOptions: {
    headless: true,
  },
  gotoOptions: {
    waitUntil: "domcontentloaded",
  },
  /** Pass custom evaluate, in this case you get page and browser instances */
  async evaluate(page: Page, browser: Browser) {
    await page.waitForResponse("https://www.tabnews.com.br/va/view");

    const result = await page.evaluate(() => (document as Document).body.innerHTML);
    return result;
  },
});

const puppeteerDocs: LGCDocument[] = await loader.load();

await PineconeStore.fromDocuments(puppeteerDocs, new OpenAIEmbeddings(), {
  pineconeIndex,
});
