import { Client, GatewayIntentBits, Events } from 'discord.js';
import { PineconeClient } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { PineconeStore } from 'langchain/vectorstores';
import { Document as LGCDocument } from 'langchain/document';
import { loadData } from './Loaders/discordLoader.js';

import * as dotenv from 'dotenv';

dotenv.config();

(async () => {
  const BOT = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  });

  BOT.on(Events.ClientReady, async (c) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
    const discordServer = c.guilds.cache.get(process.env.DISCORD_SERVER_ID);
    const channelIds = discordServer?.channels ? JSON.parse(JSON.stringify(discordServer.channels)).guild.channels : [];
    //console.log(`DEBUGchannelIDs:`,channelIds);
    const documents = await loadData(channelIds, c);
    console.log(`Done fetching documents`, documents);
    await indexChat(documents);
  });

  await BOT.login(process.env.DISCORD_TOKEN);
})();

async function indexChat(documents: LGCDocument[]) {
  console.log('start indexing chat');
  const client = new PineconeClient();
  await client.init({
    apiKey: process.env.PINECONE_API_KEY!,
    environment: process.env.PINECONE_ENVIRONMENT!,
  });
  const pineconeIndex = client.Index(process.env.PINECONE_INDEX!);

  await pineconeIndex.delete1({ deleteAll: true });

  console.log('chat :', documents);
  console.log('start indexing chats :', documents.length);
  let pineconeStore = await PineconeStore.fromDocuments(documents, new OpenAIEmbeddings(), {
    pineconeIndex,
  });
  console.log('done indexing chat');

  console.log('textKey', pineconeStore.textKey);
}
