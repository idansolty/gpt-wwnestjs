import { Controller, Inject } from '@nestjs/common';
import { POSSIBLE_AUTHS, whiteListOperation } from 'src/WwjsClient/common/auths/auth.enum';
import { BotAuth } from 'src/WwjsClient/common/decorators/auth.decorator';
import { BotCommand } from 'src/WwjsClient/common/decorators/command.decorator';
import { BotListner } from 'src/WwjsClient/common/decorators/controller.decorator';
import { BotController } from 'src/WwjsClient/common/interfaces/BotController';
import { WhatsappBot } from 'src/WwjsClient/proxy/whatsappBot';
import { Events, Message, MessageMedia, MessageTypes } from 'whatsapp-web.js';
import { WwjsLogger } from 'src/Logger/logger.service';
import { GPTService } from './services/gpt.service';
import { GPT_LIST, STT_LIST } from './common/constants';
import { readFile, readFileSync, writeFile, writeFileSync } from 'fs';
import { ChatCompletionRequestMessage } from "openai"
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { AIService } from './services/ai.service';

@BotListner(Events.MESSAGE_CREATE, "for general porpuses")
@Controller()
export class GeneralController extends BotController {
  private selfTokensQuota = 1000;

  constructor(
    whatsappBot: WhatsappBot,
    private Logger: WwjsLogger,
    private GPTService: GPTService,
    private AIService: AIService
  ) {
    super(whatsappBot)

    this._setList(STT_LIST, [], whiteListOperation);
    this._setList(GPT_LIST, [], whiteListOperation);
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

  @BotAuth(POSSIBLE_AUTHS.FROM_ME)
  @BotCommand("!summarize")
  async debug(message: Message) {
    const numberFromMessage = +message.body.split("!summarize")[1].trim();
    const numberOfMessages = isNaN(numberFromMessage) ? 25 : numberFromMessage;

    const chat = await message.getChat();

    const chatMessages = (await chat.fetchMessages({ limit: numberOfMessages })).filter((message) => !message.body.startsWith("!summarize"));

    const formattedMessages = await Promise.all(chatMessages.map(async (message) => `[${(await message.getContact()).pushname}]: ${message.body}`));

    const gptPrompt = `given the conversation below, summerize it in 2 bullet points. if it contains data about time that was choosen, include it as well - \n ${formattedMessages}`;

    const gptResponse = await this.GPTService.gptCompletion(gptPrompt, 200);
    this.Logger.logInfo(JSON.stringify(gptResponse.response.usage));

    await message.reply(gptResponse.response.choices[0].text);

    return;
  }

  @BotAuth(POSSIBLE_AUTHS.FROM_ME)
  @BotCommand("!tts")
  async tts(message: Message) {
    const toSpeachText = message.body.split("!tts")[1];

    const uniqName = new Date().getTime();
    const inputFilePath = `./tts/${uniqName}-ginput.mp3`;

    await this.AIService.textToSpeech(toSpeachText, inputFilePath);

    this.Logger.logInfo(`tts calculated in the chat -> "${message.to}"\ncompleted for text with length of -> ${toSpeachText.length}`);

    const messageMedia = await MessageMedia.fromFilePath(inputFilePath)

    message.reply(messageMedia);

    return;
  }

  @BotAuth(STT_LIST)
  @BotCommand(MessageTypes.AUDIO)
  async anyAudioStt(message: Message) {
    this.stt(message);
  }

  @BotAuth(STT_LIST)
  @BotCommand("ptt")
  async stt(message: Message) {
    const sttResponse = await this.GPTService.sttFromMessage(message);

    if (sttResponse.error) {
      message.reply(`something went wrong :()`);
      this.Logger.logError(`something went wrong :(${JSON.stringify(sttResponse.error?.response?.data)})`);
    } else {
      await message.reply(`ההודעה שלך אומרת את הדבר הבא: \n ${sttResponse.response.text}`);

      const chat = await message.getChat();

      this.Logger.logInfo(`stt calculated in the chat -> "${chat.name}" \nfor a message with duration of -> ${message.duration}s`);

      const lowerCaseResponseText = sttResponse.response.text.toLowerCase();

      if (lowerCaseResponseText.startsWith("hey gpt") || lowerCaseResponseText.startsWith("gpt") || lowerCaseResponseText.startsWith("ג'פטה")) {
        const gptResponse = await this.GPTService.gptCompletion(sttResponse.response.text);

        if (gptResponse.error) {
          message.reply(`something went wrong :()`);
          this.Logger.logError(`something went wrong :(${JSON.stringify(gptResponse.error?.response?.data)})`);
        } else {
          message.reply(`GPT SAYS: \n ${gptResponse.response.choices[0].text}`)
          this.Logger.logInfo(JSON.stringify(gptResponse.response.usage));
        }
      }

      await chat.markUnread();
    }

    return;
  }

  @BotAuth(GPT_LIST)
  @BotCommand("!GPT")
  async answerQuestion(message: Message) {
    let max_tokens;
    if (message.fromMe) {
      max_tokens = this.selfTokensQuota;
    }

    const gptResponse = await this.GPTService.gptCompletion(message.body.split("!GPT")[1], max_tokens);

    if (gptResponse.error) {
      message.reply(`something went wrong :()`);
      this.Logger.logError(`something went wrong :(${JSON.stringify(gptResponse.error?.response?.data)})`);
    } else {
      message.reply(`GPT SAYS: \n ${gptResponse.response.choices[0].text}`)
      this.Logger.logInfo(JSON.stringify(gptResponse.response.usage));
    }

    return;
  }

  @BotAuth(POSSIBLE_AUTHS.FROM_ME)
  @BotCommand("!setSttLoggerHere")
  async setLogger(message: Message) {
    const loggerChat = await message.getChat();

    this.Logger.setChat(loggerChat);

    this.Logger.logInfo("logger initiated succesfully");
  }

  @BotAuth(POSSIBLE_AUTHS.FROM_ME)
  @BotCommand("!addChatToStt")
  sttAdder(message: Message) {
    this.addToList(STT_LIST, message.to);
  }

  @BotAuth(POSSIBLE_AUTHS.FROM_ME)
  @BotCommand("!removeChatFromStt")
  sttRemover(message: Message) {
    this.removeFromList(STT_LIST, message.to);
  }

  @BotAuth(POSSIBLE_AUTHS.FROM_ME)
  @BotCommand("!addChatToGPT")
  gptAdder(message: Message) {
    this.addToList(GPT_LIST, message.to);
  }

  @BotAuth(POSSIBLE_AUTHS.FROM_ME)
  @BotCommand("!removeChatFromGPT")
  gptRemover(message: Message) {
    this.removeFromList(GPT_LIST, message.to);
  }

  @BotAuth(POSSIBLE_AUTHS.FROM_ME)
  @BotCommand("!addChatToBot")
  allAdder(message: Message) {
    this.sttAdder(message);
    this.gptAdder(message);
  }

  @BotAuth(POSSIBLE_AUTHS.FROM_ME)
  @BotCommand("!removeChatFromBot")
  allRemoveer(message: Message) {
    this.sttRemover(message);
    this.gptRemover(message);
  }

  @BotAuth(POSSIBLE_AUTHS.FROM_ME)
  @BotCommand("!setSelfTokenLimit")
  changeSelfQuota(message: Message) {
    const tokenQuotaNumberString = message.body.split("!setTokenLimit")[1].trim();

    const tokenQuotaNumber = Number(tokenQuotaNumberString);

    if (!Number.isNaN(tokenQuotaNumber)) {
      this.selfTokensQuota = tokenQuotaNumber;
      message.reply(`changed quota succesfully to -> ${this.selfTokensQuota}`)
    } else {
      message.reply(`quota sent is not a number! -> "${tokenQuotaNumberString}"`)
    }
  }
}