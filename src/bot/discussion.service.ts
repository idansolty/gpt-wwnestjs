import { Injectable } from '@nestjs/common';
import { readFileSync, writeFileSync } from 'fs';
import { WwjsLogger } from 'src/Logger/logger.service';
import { GPTService } from './gpt.service';
import { ChatCompletionRequestMessage } from "openai"

@Injectable()
export class DiscussionService {
  constructor(
    private Logger: WwjsLogger,
    private GPTService: GPTService
  ) { }

  public async simpleChat(discussionId, text): Promise<string> {
    // TODO : later move to mongo
    // TODO : create type of this
    let chatFile: { messages: ChatCompletionRequestMessage[] };
    try {
      chatFile = JSON.parse(readFileSync(`./chats/${discussionId}.json`, "utf-8"));
    } catch (err) {
      this.Logger.logError("error while reading file");
    }

    if (!chatFile?.messages?.length) {
      chatFile = {
        messages: [
          { "role": "system", "content": "You are a helpful assistant. The assistant is helpful, creative, clever, and very friendly." },
          { "role": "assistant", "content": "Hello i will be ur assistant today! How can I help you?" }
        ]
      }
    }

    const chatMessages = chatFile.messages;

    const systemMessage = chatMessages.slice(0, 1);
    const lastMessages = chatMessages.slice(1).slice(-4);
    const newMessage: ChatCompletionRequestMessage = { role: "user", content: text }
    chatMessages.push(newMessage)

    const parsedMessagesToChat = [...systemMessage, ...lastMessages, newMessage];

    const gptResponse = await this.GPTService.chatCompletion(parsedMessagesToChat);

    const newAssistantMessage: ChatCompletionRequestMessage = { role: "assistant", content: gptResponse.response.choices[0].message.content };
    chatMessages.push(newAssistantMessage)

    if (gptResponse.error) {
      this.Logger.logError(`something went wrong :(${JSON.stringify(gptResponse.error?.response?.data)})`);
      return gptResponse.error;
    }

    writeFileSync(`./chats/${discussionId}.json`, JSON.stringify({ ...chatFile, messages: chatMessages }))

    this.Logger.logInfo(JSON.stringify(gptResponse.response.usage));

    return newAssistantMessage.content;
  }
}