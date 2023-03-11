import { ICommandDefinition } from '../interfaces/CommandDefinition.interface';

export function BotCommand(command: string, description = ''): MethodDecorator {
    return (target: any, propertyKey: string | symbol): void => {

        if (!Reflect.hasMetadata('commands', target.constructor)) {
            Reflect.defineMetadata('commands', [], target.constructor);
        }

        const commands = Reflect.getMetadata('commands', target.constructor) as ICommandDefinition[];

        commands.push({
            command,
            description,
            methodName: (propertyKey as string)
        });

        Reflect.defineMetadata('commands', commands, target.constructor);
    };
};