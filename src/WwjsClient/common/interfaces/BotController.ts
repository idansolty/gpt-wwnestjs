import { WhatsappBot } from "src/WwjsClient/proxy/server";
import { Chat, GroupChat, GroupNotification, Message, Reaction } from "whatsapp-web.js";
import { AuthOperationType, dataForAuth, GenericControllerAuth, POSSIBLE_AUTHS } from "../auths/auth.enum";

export class BotController {
    public listsDict: Record<string, string[]>;
    private argsForAuth;
    private authsFunctions: GenericControllerAuth;

    constructor(
        protected readonly _whatsappBot: WhatsappBot
    ) {
        this.authsFunctions = new GenericControllerAuth();
        this.argsForAuth = {};
        this.listsDict = {
            [POSSIBLE_AUTHS.GENERIC_BLACKLIST]: [],
            [POSSIBLE_AUTHS.GENERIC_WHITELIST]: []
        }
    }

    public async dispachAction(controller, ...args) {
        const functions = Reflect.getMetadata('commands', controller.target)

        const functionChoosen = this._chooseFunction(functions, ...args)

        if (!functionChoosen) {
            return;
        }

        const auths = Reflect.getMetadata('auths', controller.target)

        if (!await this.authify(functionChoosen, auths, ...args)) {
            return;
        }

        console.log(`Dispatching ${functionChoosen.methodName}`)
        this[functionChoosen.methodName](args[0]);
    }

    protected _chooseFunction(functions, ...args) {
        const message = args[0];

        const functionChoosen = functions.find(currentFunction => message.body.startsWith(currentFunction.command));

        return functionChoosen;
    }

    protected async authify(functionName, auths, ...args): Promise<boolean> {
        const message: any = args[0];
        const relevantAuths = auths.filter(currentAuth => currentAuth.methodName === functionName.methodName);
        const messageChat = await this._whatsappBot.getChatWithTimeout(message.msgId?.remote || message.id.remote);

        const dataForOperation = {
            message,
            messageChat,
            lists: this.listsDict,
            ...this.argsForAuth
        };

        const authResult = relevantAuths.every(
            releventAuth => {
                const authObject = this.authsFunctions.AUTHS.find((auth) => auth.authType === releventAuth.authType);
                return !!authObject?.operation(dataForOperation);
            }
        );

        return authResult;
    }

    public addToList(name: string, value) {
        if (this.listsDict[name]) {
            const doesItemExist = this.listsDict[name].indexOf(value);

            if (doesItemExist < 0) {
                this.listsDict[name].push(value);
            }

            return true;
        }

        return false;
    }

    public removeFromList(name: string, value) {
        if (this.listsDict[name]) {
            const indexToRemove = this.listsDict[name].indexOf(value);

            if (indexToRemove < 0) {
                return false;
            }

            this.listsDict[name].splice(indexToRemove, 1); 

            return true;
        }

        return false;
    }

    protected _addArgsForAuth(name: string, value: any) {
        this.argsForAuth[name] = value;
    }

    protected _addAuthObjects(authType: string, operation: (options: dataForAuth) => boolean) {
        const newAuthObject = new AuthOperationType(authType, operation);

        this.authsFunctions.addAuth(newAuthObject)
    }

    protected _setList(name: string, value) {
        this.listsDict[name] = value;
    }
}