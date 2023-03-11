import { Inject, Injectable } from '@nestjs/common';
import { WhatsappBot } from 'src/WwjsClient/proxy/server';
import { Chat } from 'whatsapp-web.js';

@Injectable()
export class WwjsLogger {
    private logChat: Chat;

    constructor(@Inject('CONFIG_OPTIONS') private options: Record<string, any>) { }

    public setChat(chat: Chat) {
        this.logChat = chat;
    }

    public async costumeLog(message, type) {
        if (!this.logChat) {
            console.error("cannot write log no chat was defined");
            return;
        }
        await this.logChat.sendMessage(`${this.options.name} ${type}: \n${message}`)
    }

    public async logInfo(message) {
        await this.costumeLog(message, "Info-Log");
    }

    public async logWarn(message) {
        await this.costumeLog(message, "Info-Warn");
    }

    public async logError(message) {
        await this.costumeLog(message, "Info-Error");
    }
}


