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
import { readFile, readFileSync, writeFile, writeFileSync } from 'fs';
import { ChatCompletionRequestMessage } from "openai"
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import * as Excel from "exceljs"

const BOT_LIST = "BOT_LIST"

@BotListner(Events.MESSAGE_CREATE, "for general porpuses")
@Controller()
export class KorroController extends BotController {
  private selfTokensQuota = 1000;

  constructor(
    whatsappBot: WhatsappBot,
    private Logger: WwjsLogger,
    private GPTService: GPTService
  ) {
    super(whatsappBot)

    this._setList(BOT_LIST, [], whiteListOperation);
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
  @BotAuth(BOT_LIST)
  @BotCommand(MessageTypes.TEXT)
  async parseUserMessage(message: Message) {
    const systemMessage: ChatCompletionRequestMessage = {
      role: "system", content: `you are a program made to give data upon messages you  get.
      the message will be to divided to the following:
      feedback (is a comment about an essential part of the game) and/or bug (an unexpected defect, fault or flaw in the game), a short summarization of the subject in English, the sentiment in which the part of the message was written and the part of the message that it refers to (translate to English).
         
         for each message write the following in the matching format: """
         [{
         "type": "feedback" | "bug",
         "subject": "string",
         "Sentiment": "positive" | "negative",
       "paragraph": "string" 
         }]
         """`};

    const userMessage: ChatCompletionRequestMessage = { role: "user", content: message.body }

    const response = await this.GPTService.chatCompletion([systemMessage, userMessage]);

    const data = response.response.choices[0].message.content;

    try {
      const workbook = new Excel.Workbook();

      await workbook.xlsx.readFile('./xlsxs/OTs data collection.xlsx');
      let worksheet = workbook.getWorksheet("Sheet1");

      worksheet.addRows(JSON.parse(data).map(a => Object.values(a))).forEach((a) => a.commit())

      await workbook.xlsx.writeFile('./xlsxs/OTs data collection.xlsx');

      message.reply("added to excel succesfully!");
    } catch (err) {
      console.log(err);

      message.reply("error when adding to excel :(");
    }
  }

  @BotCommand("!getExcel")
  getExcel(message: Message) {
    const media = MessageMedia.fromFilePath('./xlsxs/OTs data collection.xlsx');
    message.reply(media);
  }

  @BotAuth(POSSIBLE_AUTHS.FROM_ME)
  @BotCommand("!addBot")
  allAdder(message: Message) {
    this.addToList(BOT_LIST, message.to);
  }
}