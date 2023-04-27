import { WhatsappBot } from "src/WwjsClient/proxy/whatsappBot";

export function BotListner(prefix = '', description = ''): ClassDecorator {
    return (target: any) => {
        WhatsappBot.controllers.push({ prefix, target, description })
        Reflect.defineMetadata('prefix', prefix, target);
        if (!Reflect.hasMetadata('commands', target)) {
            Reflect.defineMetadata('commands', [], target);
        }
    }
}