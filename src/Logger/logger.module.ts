import { DynamicModule, Module } from '@nestjs/common';
import { WwjsLogger } from './logger.service';

// TODO: add default route by name in options

@Module({})
export class LoggerModule {
  static register(options: Record<string, any>): DynamicModule {
    return {
      module: LoggerModule,
      providers: [
        {
          provide: 'CONFIG_OPTIONS',
          useValue: options,
        },
        WwjsLogger
      ],
      exports: [WwjsLogger],
    };
  }
}
