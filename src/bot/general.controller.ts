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
import { GPT_LIST, STT_LIST } from './common/constants';

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
    }

    return;
  }

  @BotAuth(GPT_LIST)
  @BotCommand("!GPT")
  async answerQuestion(message: Message) {
    const gptResponse = await this.GPTService.gptCompletion(message.body.split("!GPT")[1]);

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
}