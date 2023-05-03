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
import { IMAGES_LIST } from './common/constants';

@BotListner(Events.MESSAGE_CREATE, "DALLE 2 creations and stickers")
@Controller()
export class ImagesController extends BotController {
  constructor(
    whatsappBot: WhatsappBot,
    private Logger: WwjsLogger,
    private GPTService: GPTService
  ) {
    super(whatsappBot)

    this._setList(IMAGES_LIST, [], whiteListOperation);
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