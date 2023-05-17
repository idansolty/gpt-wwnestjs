import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BotController } from './WwjsClient/common/interfaces/BotController';
import { WhatsappBot } from './WwjsClient/proxy/whatsappBot';
import * as dotenv from 'dotenv'

import * as Excel from "exceljs"

async function bootstrap() {
  dotenv.config();

  const workbook = new Excel.Workbook();

  await workbook.xlsx.readFile('./xlsxs/OTs data collection.xlsx');
  let worksheet = workbook.getWorksheet("Sheet2");
  
  if (!worksheet) {
    worksheet = workbook.addWorksheet("Sheet2");
  }

  worksheet.addRows(["asdasd","asdasd","asdasd"]).forEach((a) => a.commit())

  await workbook.xlsx.writeFile('./xlsxs/OTs data collection.xlsx');

  const app = await NestFactory.create(AppModule);

  const bot = app.get(WhatsappBot);

  bot.start(app)

  await app.listen(3000);
}

bootstrap();
