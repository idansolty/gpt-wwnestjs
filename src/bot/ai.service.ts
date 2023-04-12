import { TextToSpeechClient } from '@google-cloud/text-to-speech/build/src/v1';
import { Injectable } from '@nestjs/common';
import { writeFileSync } from 'fs';
import { WwjsLogger } from 'src/Logger/logger.service';
import { MessageMedia } from 'whatsapp-web.js';

@Injectable()
export class AIService {
  private googleTTSClient: TextToSpeechClient;

  constructor(private Logger: WwjsLogger) {
    this.googleTTSClient = new TextToSpeechClient({
      keyFilename: './keys/chatwith-project-01ff83d706b0.json',
    })
  }

  public async textToSpeech(text, filePath) {
    const request = {
      input: { text },
      voice: { languageCode: 'en-US', name: 'en-US-Wavenet-D' },
      audioConfig: { audioEncoding: "MP3" as any },
    };

    const [response] = await this.googleTTSClient.synthesizeSpeech(request);

    writeFileSync(filePath, response.audioContent, 'binary');

    return response.audioContent;
  }

}