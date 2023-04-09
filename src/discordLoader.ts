import { Client, GatewayIntentBits, TextChannel, Partials } from 'discord.js';
import { PineconeClient } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PineconeStore } from 'langchain/vectorstores';
import { Document as LGCDocument } from 'langchain/document';

import * as dotenv from 'dotenv';

dotenv.config();

(async () => {
  const BOT = new Client({
    intents: [
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildBans,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
  });

  BOT.on('ready', async () => {
    console.log(`Logged in as ${BOT.user.tag}!`);
    const channel = BOT.channels.cache.get(process.env.CHANNEL_ID) as TextChannel;

    await indexChat(channel);
  });

  await BOT.login(process.env.DISCORD_TOKEN);
})();

async function fetchAllMessages(channel: TextChannel): Promise<string[]> {
  let messages: string[] = [];

  // Create message pointer
  let message = await channel.messages.fetch({ limit: 1 }).then((messagePage) => (messagePage.size === 1 ? messagePage.at(0) : null));

  while (message) {
    await channel.messages.fetch({ limit: 100, before: message.id }).then((messagePage) => {
      messagePage.forEach((msg) => {
        messages.push(msg.content);
        console.log(`DEBUG:`, msg.content);
      });

      //console.log(`DEBUG:messagePage size`,messagePage.size)
      // Update our message pointer to be last message in page of messages

      message = 0 < messagePage.size ? messagePage.at(-1) : null;
    });
  }

  return messages; // Print all messages
}

async function indexChat(channel: TextChannel) {
  const messages = await fetchAllMessages(channel);
  console.log('start indexing chat');
  const client = new PineconeClient();
  await client.init({
    apiKey: process.env.PINECONE_API_KEY!,
    environment: process.env.PINECONE_ENVIRONMENT!,
  });
  const pineconeIndex = client.Index(process.env.PINECONE_INDEX!);

  await pineconeIndex.delete1({ deleteAll: true });

  const chat = await loadChat(messages);

  console.log('chat :', chat);
  console.log('start indexing chats :', chat.length);
  let pineconeStore = await PineconeStore.fromDocuments(chat, new OpenAIEmbeddings(), {
    pineconeIndex,
  });
  console.log('done indexing chat');

  console.log('textKey', pineconeStore.textKey);
}

async function loadChat(messages: string[]): Promise<LGCDocument[]> {
  let allDocs: LGCDocument[] = [];
  for (const message of messages) {
    let docs = new LGCDocument({ pageContent: message, metadata: { author: `author here` } });

    //const output = await split(docs);

    allDocs = allDocs.concat(docs);
  }
  return allDocs;
}

async function split(docs: LGCDocument[]) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const output = await splitter.splitDocuments(docs);
  return output;
}
