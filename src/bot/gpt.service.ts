import { Injectable } from '@nestjs/common';
import { WwjsLogger } from 'src/Logger/logger.service';
import { WhatsappBot } from 'src/WwjsClient/proxy/server';
import { Configuration, OpenAIApi, CreateTranscriptionResponse, ImagesResponse, CreateCompletionResponse, ChatCompletionRequestMessage, CreateChatCompletionResponse } from 'openai';
import * as fs from 'fs';
import { Message } from 'whatsapp-web.js';
import * as ffmpeg from 'fluent-ffmpeg';
import * as ffmpegStatic from 'ffmpeg-static';
import { OaiResponse } from './common/response.type';

@Injectable()
export class GPTService {
    private OPENAI_CLIENT: OpenAIApi;

    constructor() {
        const configuration = new Configuration({
            apiKey: process.env.OAI_APIKEY
        })

        this.OPENAI_CLIENT = new OpenAIApi(configuration);
    }

    public async chatCompletion(messages: ChatCompletionRequestMessage[]): Promise<OaiResponse<CreateChatCompletionResponse>> {
        try {
            const resp = await this.OPENAI_CLIENT.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages,
                temperature: 0.2,
                max_tokens: 75,
            });

            return { response: resp.data };
        } catch (err) {
            return { error: err };
        }
    }

    public async createImage(text: string): Promise<OaiResponse<ImagesResponse>> {
        try {
            const resp = await this.OPENAI_CLIENT.createImage({
                prompt: text,
                n: 1,
                response_format: "url"
            });

            return { response: resp.data };
        } catch (err) {
            return { error: err };
        }
    }

    public async gptCompletion(text: string, max_tokens?: number): Promise<OaiResponse<CreateCompletionResponse>> {
        try {
            const resp = await this.OPENAI_CLIENT.createCompletion({
                model: "text-davinci-003",
                prompt: text,
                temperature: 0.2,
                max_tokens: max_tokens || 50
            });

            return { response: resp.data };
        } catch (err) {
            return { error: err };
        }
    }

    public async sttFromMessage(message: Message, translate?: string): Promise<OaiResponse<CreateTranscriptionResponse>> {
        // TODO : create better flow of these functions
        const media = await message.downloadMedia();

        const buffer = Buffer.from(media.data, "base64")

        return this.sttFromData(buffer, translate);
    }


    public async sttFromData(buffer: Buffer, translate?: string): Promise<OaiResponse<CreateTranscriptionResponse>> {
        const uniqName = new Date().getTime();

        const inputFilePath = `X:/projects/WW-nest-JS/stt-bot/inputs/${uniqName}-input.ogg`;
        const outputFilePath = `X:/projects/WW-nest-JS/stt-bot/outputs/${uniqName}-output.mp3`;

        fs.writeFileSync(inputFilePath, buffer);

        const result = await new Promise((resolve, reject) => {
            ffmpeg.setFfmpegPath(ffmpegStatic);

            ffmpeg()
                .input(inputFilePath)
                .output(outputFilePath)
                .audioCodec('libmp3lame')
                .audioBitrate('128k')
                .audioChannels(2)
                .audioFrequency(48000)
                .on('end', (): any => { resolve(true) })
                .on("error", (err) => { reject(err) })
                .run();
        })

        const mp3ReadStream = fs.createReadStream(outputFilePath);

        const response = await this.sttFromMp3(mp3ReadStream as any, translate)

        return response;
    }

    public async sttFromMp3(fileReadStream: File, translate?: string): Promise<OaiResponse<CreateTranscriptionResponse>> {
        try {
            const resp = await this.OPENAI_CLIENT.createTranscription(
                fileReadStream,
                "whisper-1",
                undefined,
                undefined,
                undefined,
                translate
            );

            return { response: resp.data };
        } catch (err) {
            return { error: err };
        }
    }
}


