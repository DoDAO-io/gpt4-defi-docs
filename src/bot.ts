import { Client, GatewayIntentBits, Events, TextChannel } from 'discord.js';
import { PineconeClient } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { PineconeStore } from 'langchain/vectorstores';
import { Document as LGCDocument } from 'langchain/document';
import { loadData, Metadata } from './Loaders/discordLoader.js';

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

    const allDocs = await loadData(channelIds, c);

    console.log(`Done fetching all messages from discord channels, ${allDocs.length} messages`);
    await indexChat(allDocs);
  });

  await BOT.login(process.env.DISCORD_TOKEN);
})();

async function indexChat(documents: LGCDocument[]) {
  const client = new PineconeClient();
  await client.init({
    apiKey: process.env.PINECONE_API_KEY!,
    environment: process.env.PINECONE_ENVIRONMENT!,
  });
  const pineconeIndex = client.Index(process.env.PINECONE_INDEX!);

  await pineconeIndex.delete1({ deleteAll: true });

  console.log('start indexing chats :', documents.length);
  //console.log(`DEBUG: Documents: \n`,documents)
  let pineconeStore = await PineconeStore.fromDocuments(documents, new OpenAIEmbeddings(), {
    pineconeIndex,
  });
  console.log('done indexing chat');
  console.log('textKey', pineconeStore.textKey);
  await runDocumentSearch();
}

async function runDocumentSearch() {
  const client = new PineconeClient();
  await client.init({
    apiKey: process.env.PINECONE_API_KEY!,
    environment: process.env.PINECONE_ENVIRONMENT!,
  });
  const pineconeIndex = client.Index(process.env.PINECONE_INDEX!);

  console.log(`index stats: before operations \n`, await pineconeIndex.describeIndexStats1(), `\n\n`);

  //await deleteById(pineconeIndex,"1098960246279516261")
  await deleteByTime(pineconeIndex, 1682167267717);

  console.log(`index stats: after operations \n`, await pineconeIndex.describeIndexStats1(), `\n\n`);
}
//This function deletes vectors with the discord id passed in
async function deleteById(pineconeIndex, id: string) {
  await pineconeIndex._delete({ deleteRequest: { filter: { id: { $eq: id } } } });
}
//This function deletes vectors with a timestamp less than the timestamp passed in
async function deleteByTime(pineconeIndex, createdTimestamp: number) {
  await pineconeIndex._delete({ deleteRequest: { filter: { createdTimestamp: { $lt: createdTimestamp } } } });
}
