import { POSSIBLE_AUTHS } from '../auths/auth.enum';

export function BotAuth(authType: POSSIBLE_AUTHS | string, moreInfo = ''): MethodDecorator {
    return (target: any, propertyKey: string | symbol): void => {
        if (!Reflect.hasMetadata('auths', target.constructor)) {
            Reflect.defineMetadata('auths', [], target.constructor);
        }

        const auths = Reflect.getMetadata('auths', target.constructor);

        auths.push({
            authType,
            moreInfo,
            methodName: (propertyKey as string)
        });

        Reflect.defineMetadata('auths', auths, target.constructor);
    };
};