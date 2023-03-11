import { Message } from "whatsapp-web.js";

export enum POSSIBLE_AUTHS {
    GENERIC_WHITELIST = "CHAT_WHITE_LIST",
    GENERIC_BLACKLIST = "CHAT_BLACK_LIST",
    FROM_ME = "FROM_ME",
    GROUP_ADMIN = "GROUP_ADMIN",
    NOT_GROUP = "NOT_GROUP"
}

export class AuthOperationType {
    constructor(authType: string, operation: (options: dataForAuth) => boolean) {
        this.authType = authType;

        this.operation = operation
    }

    authType: string;
    operation: (options: dataForAuth) => boolean;
}

export type dataForAuth = Record<string, any>;

export class GenericControllerAuth {
    public AUTHS: AuthOperationType[];

    constructor() {
        this.AUTHS = [];

        this.AUTHS.push({
            authType: POSSIBLE_AUTHS.GROUP_ADMIN,
            operation: (data) => {
                if (data.messageChat.isGroup) {
                    const participant = data.messageChat.participants.find(user => user.id._serialized === (data.message.author || data.message.senderId))

                    return participant?.isAdmin || data.message.fromMe;
                }

                return false;
            }
        })

        this.AUTHS.push({
            authType: POSSIBLE_AUTHS.FROM_ME,
            operation: (data) => {
                return data.message.id.fromMe;
            }
        })

        this.AUTHS.push({
            authType: POSSIBLE_AUTHS.NOT_GROUP,
            operation: (data) => {
                return !data.messageChat.isGroup;
            }
        })

        this.AUTHS.push({
            authType: POSSIBLE_AUTHS.GENERIC_BLACKLIST,
            operation: (data) => blackListOperation(data, POSSIBLE_AUTHS.GENERIC_BLACKLIST)
        })

        this.AUTHS.push({
            authType: POSSIBLE_AUTHS.GENERIC_WHITELIST,
            operation: (data) => whiteListOperation(data, POSSIBLE_AUTHS.GENERIC_WHITELIST)
        })
    }

    public addAuth(newAuth: AuthOperationType) {
        this.AUTHS.push(newAuth)
    }
}

export function whiteListOperation(data: dataForAuth, listName: string) {
    const releventList: string[] = data.lists[listName]
    const fromId = data.message.id.remote;

    return releventList.includes(fromId);
}

export function blackListOperation(data: dataForAuth, listName: string) {
    const releventList: string[] = data.lists[listName]
    const fromId = data.message.id.remote;

    return !releventList.includes(fromId);
}