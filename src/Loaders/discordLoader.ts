import { Document } from 'langchain/document';
import { Client, TextChannel } from 'discord.js';

//This library contains functions to load messages from discord channels

export async function loadData(channelIds: string[], BOT: Client): Promise<Document[]> {
  let results: Document[] = [];
  for (let i in channelIds) {
    const channel = BOT.channels.cache.get(channelIds[i]) as TextChannel;
    //https://discord.com/developers/docs/resources/channel#channel-object-channel-types
    if (channel.type == 0) {
      //console.log(`This is a text channel`, channelIds[i]);
      let channelContent = await readChannel(channel);
      let doc = new Document({ pageContent: channelContent, metadata: { author: `author here` } });
      results.push(doc);
    }
  }
  console.log(`DEBUG:result `, results);
  return results;
}

async function readChannel(channel: TextChannel): Promise<string> {
  let messages: string[] = [];
  let result: string;

  // Create message pointer
  let message = await channel.messages.fetch({ limit: 1 }).then((messagePage) => (messagePage.size === 1 ? messagePage.at(0) : null));

  while (message) {
    await channel.messages.fetch({ limit: 100, before: message.id }).then((messagePage) => {
      messagePage.forEach((msg) => {
        messages.push(msg.content);
        //console.log(`DEBUG:`, msg.content);
      });
      message = 0 < messagePage.size ? messagePage.at(-1) : null;
    });
  }
  result = messages.join('\n\n');
  return result;
}
