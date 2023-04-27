import { Injectable, Module } from '@nestjs/common';
import { LoggerModule } from 'src/Logger/logger.module';
import { WhatsappBot } from 'src/WwjsClient/proxy/whatsappBot';
import { WwbotGPTService } from './gpt.service';

@Module({
    exports: [WhatsappBot],
    providers: [WhatsappBot, WwbotGPTService]
})
export class WhatsappModule { }