import { Controller } from '@nestjs/common';
import { POSSIBLE_AUTHS, whiteListOperation } from 'src/WwjsClient/common/auths/auth.enum';
import { BotAuth } from 'src/WwjsClient/common/decorators/auth.decorator';
import { BotCommand } from 'src/WwjsClient/common/decorators/command.decorator';
import { BotListner } from 'src/WwjsClient/common/decorators/controller.decorator';
import { BotController } from 'src/WwjsClient/common/interfaces/BotController';
import { WhatsappBot } from 'src/WwjsClient/proxy/whatsappBot';
import { Events, Message, MessageMedia, MessageTypes } from 'whatsapp-web.js';
import { WwjsLogger } from 'src/Logger/logger.service';
import { GPTService } from './services/gpt.service';
import { CHAT_LIST } from './common/constants';
import { readFile, readFileSync, writeFile, writeFileSync } from 'fs';
import { ChatCompletionRequestMessage } from "openai"
import { DiscussionService } from './services/discussion.service';
import { AIService } from './services/ai.service';

@BotListner(Events.MESSAGE_CREATE, "chat bot controller")
@Controller()
export class ChatsController extends BotController {
  constructor(
    whatsappBot: WhatsappBot,
    private Logger: WwjsLogger,
    private GPTService: GPTService,
    private DiscussionService: DiscussionService,
    private AIService: AIService
  ) {
    super(whatsappBot)

    this._setList(CHAT_LIST, [], whiteListOperation);
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

    const Answer = await this.DiscussionService.simpleChat(chatId, message.body);

    message.reply(Answer);

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
      message.reply(`something went wrong in stt :()`);
      this.Logger.logError(`something went wrong in stt:(${JSON.stringify(sttResponse.error?.response?.data)})`);
      return;
    } else {
      this.Logger.logInfo(`stt calculated for discussion -> "${chat.name}" \nfor a message with duration of -> ${message.duration}s`);
    }

    const userMessage = sttResponse.response.text;

    const assistantResponse = await this.DiscussionService.simpleChat(chatId, userMessage);

    const uniqName = new Date().getTime();
    const inputFilePath = `./tts/${uniqName}-input.mp3`;

    await this.AIService.textToSpeech(assistantResponse, inputFilePath);

    this.Logger.logInfo(`tts calculated in the chat -> "${chat.name}"\ncompleted for text with length of -> ${assistantResponse.length}`);

    const messageMedia = await MessageMedia.fromFilePath(inputFilePath)

    message.reply(messageMedia);

    return;
  }

  @BotAuth(POSSIBLE_AUTHS.FROM_ME)
  @BotCommand("!addChatBot")
  addChatBot(message: Message) {
    this.addToList(CHAT_LIST, message.to);

    message.reply("Hello :) i will be ur assistant today! How can I help you?");
  }

  @BotAuth(POSSIBLE_AUTHS.FROM_ME)
  @BotCommand("!addPPTChatBot")
  async addPPTChatBot(message: Message) {
    this.addToList(CHAT_LIST, message.to);

    const messageMedia = await MessageMedia.fromFilePath("./src/bot/common/convStarter.mp3")

    message.reply(messageMedia);
  }

  @BotAuth(POSSIBLE_AUTHS.FROM_ME)
  @BotCommand("!removeChatBot")
  removeChatBot(message: Message) {
    this.removeFromList(CHAT_LIST, message.to)
  }
}