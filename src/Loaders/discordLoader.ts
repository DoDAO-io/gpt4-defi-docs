import {  Document } from 'langchain/document';
import {  TextChannel } from 'discord.js';



//This library contains functions to load messages from discord channels


export async function loadData(channel:TextChannel):Promise<Document[]>{
     let channelContent=await readChannel(channel);
     let results:Document[]=[];
     let doc=new Document({pageContent:channelContent,metadata:{author:`author here`}})
     //iterate over results to get multiple chats from channels
     results.push(doc);
     console.log(`DEBUG:`,results)
     return results;
}

async function readChannel(channel:TextChannel):Promise<string> {
    let messages:string[] = [];
    let result:string;
  
    // Create message pointer
    let message = await channel.messages
      .fetch({ limit: 1 })
      .then(messagePage => (messagePage.size === 1 ? messagePage.at(0) : null));
  
    while (message) {
      await channel.messages
        .fetch({ limit: 100, before: message.id })
        .then(messagePage => {
          messagePage.forEach(msg => {messages.push(msg.content);console.log(`DEBUG:`,msg.content)});
          message = 0 < messagePage.size ? messagePage.at(-1) : null;
          
        })
    }
    result=messages.join("\n\n")
    return result;  
  }  
