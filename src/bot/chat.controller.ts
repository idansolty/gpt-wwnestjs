import { Controller } from '@nestjs/common';
import { POSSIBLE_AUTHS, whiteListOperation } from 'src/WwjsClient/common/auths/auth.enum';
import { BotAuth } from 'src/WwjsClient/common/decorators/auth.decorator';
import { BotCommand } from 'src/WwjsClient/common/decorators/command.decorator';
import { BotListner } from 'src/WwjsClient/common/decorators/controller.decorator';
import { BotController } from 'src/WwjsClient/common/interfaces/BotController';
import { WhatsappBot } from 'src/WwjsClient/proxy/server';
import { Events, Message, MessageTypes } from 'whatsapp-web.js';
import { WwjsLogger } from 'src/Logger/logger.service';
import { GPTService } from './gpt.service';
import { CHAT_LIST, GPT_LIST, STT_LIST } from './common/constants';
import { readFile, readFileSync, writeFile, writeFileSync } from 'fs';
import { ChatCompletionRequestMessage } from "openai"

@BotListner(Events.MESSAGE_CREATE)
@Controller()
export class GeneralController extends BotController {
  constructor(
    whatsappBot: WhatsappBot,
    private Logger: WwjsLogger,
    private GPTService: GPTService
  ) {
    super(whatsappBot)

    this._setList(STT_LIST, []);
    this._addAuthObjects(STT_LIST,
      (data) => whiteListOperation(data, STT_LIST)
    )

    this._setList(GPT_LIST, []);
    this._addAuthObjects(GPT_LIST,
      (data) => whiteListOperation(data, GPT_LIST)
    )

    this._setList(CHAT_LIST, []);
    this._addAuthObjects(CHAT_LIST,
      (data) => whiteListOperation(data, CHAT_LIST)
    )
  }

  protected _chooseFunction(functions, ...args) {
    const message = args[0];

    const functionChoosen = functions.find(currentFunction => message.body.startsWith(currentFunction.command));

    if (!functionChoosen) {
      const funcByType = functions.find(currentFunction => message.type === currentFunction.command);

      return funcByType;
    }

    return functionChoosen;
  }

  @BotAuth(POSSIBLE_AUTHS.NOT_FROM_ME)
  @BotAuth(CHAT_LIST)
  @BotCommand(MessageTypes.TEXT)
  async chatWithGpt(message: Message) {
    const chat = await message.getChat();
    const chatId = chat.id._serialized;

    // TODO : later move to mongo
    // TODO : create type of this
    let chatFile: { messages: ChatCompletionRequestMessage[] };
    try {
      chatFile = JSON.parse(readFileSync(`X:/projects/WW-nest-JS/stt-bot/chats/${chatId}.json`, "utf-8"));
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
    const newMessage: ChatCompletionRequestMessage = { role: "user", content: message.body }

    const parsedMessagesToChat = [...systemMessage, ...lastMessages, newMessage];

    const gptResponse = await this.GPTService.chatCompletion(parsedMessagesToChat);

    chatMessages.push(newMessage)
    chatMessages.push({ role: "assistant", content: gptResponse.response.choices[0].message.content })

    writeFileSync(`X:/projects/WW-nest-JS/stt-bot/chats/${chatId}.json`, JSON.stringify({ ...chatFile, messages: chatMessages }))

    if (gptResponse.error) {
      message.reply(`something went wrong :()`);
      this.Logger.logError(`something went wrong :(${JSON.stringify(gptResponse.error?.response?.data)})`);
    } else {
      message.reply(gptResponse.response.choices[0].message.content)
      this.Logger.logInfo(JSON.stringify(gptResponse.response.usage));
    }

    return;
  }

  @BotAuth(POSSIBLE_AUTHS.NOT_FROM_ME)
  @BotAuth(CHAT_LIST)
  @BotCommand("ptt")
  async speakWithGpt(message: Message) {
    const chat = await message.getChat();
    const chatId = chat.id._serialized;

    const sttResponse = await this.GPTService.sttFromMessage(message, "en");

    if (sttResponse.error) {
      message.reply(`something went wrong :()`);
      this.Logger.logError(`something went wrong :(${JSON.stringify(sttResponse.error?.response?.data)})`);
      return;
    }

    const userMessage = sttResponse.response.text;

    // TODO : later move to mongo
    // TODO : create type of this
    let chatFile: { messages: ChatCompletionRequestMessage[] };
    try {
      chatFile = JSON.parse(readFileSync(`X:/projects/WW-nest-JS/stt-bot/chats/${chatId}.json`, "utf-8"));
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
    const newMessage: ChatCompletionRequestMessage = { role: "user", content: userMessage }

    const parsedMessagesToChat = [...systemMessage, ...lastMessages, newMessage];

    const gptResponse = await this.GPTService.chatCompletion(parsedMessagesToChat);

    chatMessages.push(newMessage)
    chatMessages.push({ role: "assistant", content: gptResponse.response.choices[0].message.content })

    writeFileSync(`X:/projects/WW-nest-JS/stt-bot/chats/${chatId}.json`, JSON.stringify({ ...chatFile, messages: chatMessages }))

    if (gptResponse.error) {
      message.reply(`something went wrong :()`);
      this.Logger.logError(`something went wrong :(${JSON.stringify(gptResponse.error?.response?.data)})`);
    } else {
      message.reply(gptResponse.response.choices[0].message.content)
      this.Logger.logInfo(JSON.stringify(gptResponse.response.usage));
    }

    return;
  }

  @BotAuth(POSSIBLE_AUTHS.FROM_ME)
  @BotCommand("!addChatBot")
  addChatBot(message: Message) {
    this.addToList(CHAT_LIST, message.to);

    message.reply("Hello :) i will be ur assistant today! How can I help you?");
  }

  @BotAuth(POSSIBLE_AUTHS.FROM_ME)
  @BotCommand("!removeChatBot")
  removeChatBot(message: Message) {
    this.removeFromList(CHAT_LIST, message.to)
  }
}