import { WhatsappBot } from "src/WwjsClient/proxy/server";

export function BotListner(prefix = ''): ClassDecorator {
    return (target: any) => {
        WhatsappBot.controllers.push({ prefix, target })
        Reflect.defineMetadata('prefix', prefix, target);
        if (!Reflect.hasMetadata('commands', target)) {
            Reflect.defineMetadata('commands', [], target);
        }
    }
}