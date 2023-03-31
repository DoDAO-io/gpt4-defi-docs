import { PineconeClient } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';
import { VectorDBQAChain } from 'langchain/chains';
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { OpenAI } from 'langchain/llms';
import { PineconeStore } from 'langchain/vectorstores';

dotenv.config();

export async function search() {
  const client = new PineconeClient();
  await client.init({
    apiKey: process.env.PINECONE_API_KEY!,
    environment: process.env.PINECONE_ENVIRONMENT!,
  });
  const pineconeIndex = client.Index(process.env.PINECONE_INDEX!);

  const vectorStore = await PineconeStore.fromExistingIndex(new OpenAIEmbeddings(), { pineconeIndex });

  const model = new OpenAI();
  const chain = VectorDBQAChain.fromLLM(model, vectorStore, {
    returnSourceDocuments: false,
  });
  const response = await chain.call({ query: 'What is impermanent loss?' });
  console.log(response);
  /*
  {
    text: ' A pinecone is the woody fruiting body of a pine tree.',
    sourceDocuments: [
      Document {
        pageContent: 'pinecones are the woody fruiting body and of a pine tree',
        metadata: [Object]
      }
    ]
  }
  */
}

search();
