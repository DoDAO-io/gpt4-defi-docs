// https://js.langchain.com/docs/modules/indexes/vector_stores/integrations/pinecone

import { PineconeClient } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { RecursiveCharacterTextSplitter, TextSplitter, TokenTextSplitter } from 'langchain/text_splitter';
import { PineconeStore } from 'langchain/vectorstores';
import { PuppeteerWebBaseLoader, GithubRepoLoader, GitbookLoader } from 'langchain/document_loaders';
import { Browser, Page } from 'puppeteer';
import { Document as LGCDocument } from 'langchain/document';
import * as dotenv from 'dotenv';

dotenv.config();

const urls = [
  { url: 'https://whiteboardcrypto.com/impermanent-loss-calculator', 
    xpath: '/html/body/div[1]/div/div[1]/div[2]/div[2]/section/div[1]', 
    type: 'article'},
  { url: 'https://chainbulletin.com/impermanent-loss-explained-with-examples-math', 
    xpath: '/html/body/div[1]/div/div/div[2]', 
    type: 'article'},
  // other
  {
    url: 'https://blockworks.co/news/the-investors-guide-to-navigating-impermanent-loss',
    xpath: '/html/body/div[1]/div/main/section[1]/div[1]/article/div[3]',
    type: 'article'
  },
  { url: 'https://www.ledger.com/academy/glossary/impermanent-loss', 
    xpath: '/html/body/main/div/div',
    type: 'article' },
  {
    url: 'https://medium.com/coinmonks/understanding-impermanent-loss-9ac6795e5baa',
    xpath: '/html/body/div[1]/div/div[3]/div[2]/div/main/div/div[3]/div/div/article/div/div[2]/section/div/div[2]',
    type: 'article'
  },
  {
    url: 'https://github.com/Uniswap/v3-core',
    xpath: 'NA',
    type: 'github'
  },
  {
    url: 'https://docs.uniswap.org/',
    xpath: 'NA',
    type: 'gitbook'
  }
  // 'https://www.blockchain-council.org/defi/impermanent-loss/',
  // 'https://finematics.com/impermanent-loss-explained/',
  // 'https://www.finder.com/impermanent-loss',
  // 'https://www.zenledger.io/blog/what-is-impermanent-loss-in-defi',
];

async function split(docs: LGCDocument[]){
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });

    const output = await splitter.splitDocuments(docs);
    return output;
}

async function loadDocuments(urls: { url: string; xpath: string, type: string }[]): Promise<LGCDocument[]> {
  let allDocs: LGCDocument[] = [];
  for (const url of urls) {
    let docs: LGCDocument[];
    if(url.type == 'article'){
        const loader = new PuppeteerWebBaseLoader(url.url, {
            launchOptions: {
              headless: true,
            },
            gotoOptions: {
              waitUntil: 'networkidle2',
            },
            async evaluate(page: Page, browser: Browser) {
              const [element] = await page.$x(url.xpath);
              await page.waitForXPath(url.xpath);
              const contents = await page.evaluate((el) => el.textContent, element);
              console.log('contents : ', contents);
              return contents;
            },
        });
        docs = await loader.load();
    }
    else if(url.type == 'github'){
        const githubLoader = new GithubRepoLoader(url.url,
            { branch: "main", recursive: false, unknown: "warn" }
        );
        docs = await githubLoader.load();
    }
    else{
        const gitbookLoader = new GitbookLoader(url.url, {
            shouldLoadAllPaths: true,
        });

        docs = await gitbookLoader.load();
    }
    console.log('downloaded document : ', url);
    
    const output = await split(docs);

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

  await pineconeIndex.delete1({ deleteAll: true });

  const documents = await loadDocuments(urls);

  console.log('start indexing documents :', documents.length);
  let pineconeStore = await PineconeStore.fromDocuments(documents, new OpenAIEmbeddings(), {
    pineconeIndex,
  });

  console.log('textKey', pineconeStore.textKey);
}

indexDocuments();
