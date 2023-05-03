import { IServer } from '../common/interfaces/IServer.interface';
import { Client, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from "qrcode-terminal"
import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { WwbotGPTService } from './gpt.service';

@Injectable()
export class WhatsappBot implements IServer {
    private bot: Client;
    static controllers: any[] = [];
    private stringifiedCommands: string;

    public rand = Math.floor(Math.random() * 10000);

    constructor(private readonly wwbotGPTService: WwbotGPTService) {
        this.bot = new Client({
            authStrategy: new LocalAuth({ clientId: "client-test" }),
        });
    }

    get getClient() {
        return this.bot;
    }

    get getStringifiedCommands() {
        return this.stringifiedCommands;
    }

    public start(app, shouldCallGpt = false): void {
        // this.setStringifiedCommands(shouldCallGpt);

        this.bot.initialize();

        this.bot.on('qr', qr => {
            qrcode.generate(qr, { small: true });
        });

        this.bot.on('ready', () => {
            console.log('Client is ready!')

            WhatsappBot.controllers.forEach((controller) => {
                const targetClass = app.get(controller.target);

                this.bot.on(controller.prefix, (...args) => targetClass.dispachAction(controller, ...args));
            });
        });


    }

    private async setStringifiedCommands(shouldCallGpt) {
        const allCommandsStrings = []

        for (const controller of WhatsappBot.controllers) {
            const classCommands: string[] = await this.stringifyCommands(controller, shouldCallGpt);

            classCommands.unshift(`\n${controller.target.name} | on ${controller.prefix} | \n${controller.description}:\n\n`)

            console.log(`finished calculating commands for controller => ${controller.target.name}`)

            allCommandsStrings.push(classCommands.join("\n"));
        }

        // const allCommandsStrings = await Promise.all(WhatsappBot.controllers.flatMap(async (controller) => {
        //     const classCommands: string[] = await this.stringifyCommands(controller);

        //     classCommands.unshift(`\n${controller.target.name} | on ${controller.prefix} :\n description => ${controller.description}`)

        //     return classCommands;
        // }));

        const stringified = allCommandsStrings.join("\n");

        this.stringifiedCommands = stringified;

        console.log("finished calculating strings");
    }

    private async stringifyCommands(controller, shouldCallGpt): Promise<string[]> {
        const functions = Reflect.getMetadata('commands', controller.target)
        const functionsAuths = Reflect.getMetadata('auths', controller.target)
        
        const compelation = shouldCallGpt ? await this.wwbotGPTService.explainEachFunctionInCode(controller.target.toString()) : {};

        // Read from file anout the current controller
        // later move to mongodb
        let preCalculatedDescriptions = compelation;
        // try {
        //     preCalculatedDescriptions = JSON.parse(readFileSync(`./controllersDescription/${controller.target.name}-data.json`, "utf-8"))
        // } catch {
        //     preCalculatedDescriptions = {};
        // }

        return functions.map((f) => {
            const relevantAuths = functionsAuths.filter(fa => fa.methodName === f.methodName);

            const authsString = relevantAuths.map(auth => `${auth.authType}${auth.moreInfo === "" ? "" : `: ${auth.moreInfo}`}`).join("\n");

            return (`[${f.command}] : ${f.description === "" && preCalculatedDescriptions[f.methodName] !== undefined ? preCalculatedDescriptions[f.methodName] : ""} \n${authsString}\n`)
        })
    }

    async getChatWithTimeout(chat: string, timeout: number = 30000): Promise<any> {
        return new Promise((resolve, reject) => {
            setTimeout(reject, timeout)
            this.bot.getChatById(chat).then(resolve);
        })
    }
}
