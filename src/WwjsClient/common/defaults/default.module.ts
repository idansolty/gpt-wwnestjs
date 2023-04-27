import { Module } from '@nestjs/common';
import { LoggerModule } from 'src/Logger/logger.module';
import { WhatsappBot } from 'src/WwjsClient/proxy/whatsappBot';
import { DefaultController } from './default.controller';
import { WhatsappModule } from 'src/WwjsClient/proxy/whatsapp.module';

@Module({
    imports: [WhatsappModule],
    controllers: [DefaultController],
    providers: []
})
export class DefaultModule { }
