import { Controller } from '@nestjs/common';
import { POSSIBLE_AUTHS, whiteListOperation } from 'src/WwjsClient/common/auths/auth.enum';
import { BotAuth } from 'src/WwjsClient/common/decorators/auth.decorator';
import { BotCommand } from 'src/WwjsClient/common/decorators/command.decorator';
import { BotListner } from 'src/WwjsClient/common/decorators/controller.decorator';
import { BotController } from 'src/WwjsClient/common/interfaces/BotController';
import { WhatsappBot } from 'src/WwjsClient/proxy/server';
import { Events, Message, MessageMedia, MessageTypes } from 'whatsapp-web.js';
import { WwjsLogger } from 'src/Logger/logger.service';
import { GPTService } from './gpt.service';
import { CHAT_LIST, GPT_LIST, IMAGES_LIST, STT_LIST } from './common/constants';
import { readFile, readFileSync, writeFile, writeFileSync } from 'fs';
import { ChatCompletionRequestMessage } from "openai"

@BotListner(Events.MESSAGE_CREATE)
@Controller()
export class ImagesController extends BotController {
  constructor(
    whatsappBot: WhatsappBot,
    private Logger: WwjsLogger,
    private GPTService: GPTService
  ) {
    super(whatsappBot)

    this._setList(GPT_LIST, []);
    this._addAuthObjects(GPT_LIST,
      (data) => whiteListOperation(data, GPT_LIST)
    )

    this._setList(IMAGES_LIST, []);
    this._addAuthObjects(IMAGES_LIST,
      (data) => whiteListOperation(data, IMAGES_LIST)
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

  @BotAuth(POSSIBLE_AUTHS.FROM_ME)
  // @BotAuth(GPT_LIST)
  @BotCommand("!createImage")
  async createAnImage(message: Message) {
    const imagePrompt = message.body.split("!createImage")[1].trim()

    const createImgsRspns = await this.GPTService.createImage(imagePrompt);

    const media = await MessageMedia.fromUrl(createImgsRspns.response.data[0].url)

    message.reply(media);

    return;
  }

  @BotAuth(POSSIBLE_AUTHS.FROM_ME)
  // @BotAuth(GPT_LIST)
  @BotCommand("!createSticker")
  async createASticker(message: Message) {
    const imagePrompt = message.body.split("!createSticker")[1].trim()

    const createImgsRspns = await this.GPTService.createImage(imagePrompt);

    const media = await MessageMedia.fromUrl(createImgsRspns.response.data[0].url)

    message.reply(media, undefined, { sendMediaAsSticker: true });

    return;
  }


  @BotAuth(POSSIBLE_AUTHS.FROM_ME)
  @BotAuth(IMAGES_LIST)
  @BotCommand(MessageTypes.IMAGE)
  async createAStickerFromImage(message: Message) {
    const media = await message.downloadMedia()

    message.reply(media, undefined, { sendMediaAsSticker: true });

    return;
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
  @BotCommand("!addImages")
  addChatBot(message: Message) {
    this.addToList(IMAGES_LIST, message.to);
  }

  @BotAuth(POSSIBLE_AUTHS.FROM_ME)
  @BotCommand("!removeImages")
  removeChatBot(message: Message) {
    this.removeFromList(IMAGES_LIST, message.to)
  }
}