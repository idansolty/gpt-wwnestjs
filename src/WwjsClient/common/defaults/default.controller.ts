import { Controller } from '@nestjs/common';
import { registerCustomQueryHandler } from 'puppeteer';
import { POSSIBLE_AUTHS, whiteListOperation } from 'src/WwjsClient/common/auths/auth.enum';
import { BotAuth } from 'src/WwjsClient/common/decorators/auth.decorator';
import { BotCommand } from 'src/WwjsClient/common/decorators/command.decorator';
import { BotListner } from 'src/WwjsClient/common/decorators/controller.decorator';
import { BotController } from 'src/WwjsClient/common/interfaces/BotController';
import { WhatsappBot } from 'src/WwjsClient/proxy/whatsappBot';
import { Events, Message } from 'whatsapp-web.js';

@BotListner(Events.MESSAGE_CREATE)
@Controller()
export class DefaultController extends BotController {
  constructor(
    private readonly whatsappBot: WhatsappBot
  ) {
    super(whatsappBot)
  }

  @BotAuth(POSSIBLE_AUTHS.NOT_GROUP)
  @BotCommand("!ping")
  async poingPong(message: Message) {
    message.reply("pong");
    return;
  }

  @BotAuth(POSSIBLE_AUTHS.FROM_ME)
  @BotCommand("!botInfo")
  async botInfo(message: Message) {
    message.reply(this._whatsappBot.getStringifiedCommands);
    return;
  }
}