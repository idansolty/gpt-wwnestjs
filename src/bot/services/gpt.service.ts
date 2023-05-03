import { Injectable } from '@nestjs/common';
import { WwjsLogger } from 'src/Logger/logger.service';
import { WhatsappBot } from 'src/WwjsClient/proxy/whatsappBot';
import { Configuration, OpenAIApi, CreateTranscriptionResponse, ImagesResponse, CreateCompletionResponse, ChatCompletionRequestMessage, CreateChatCompletionResponse } from 'openai';
import * as fs from 'fs';
import { Message } from 'whatsapp-web.js';
import * as ffmpeg from 'fluent-ffmpeg';
import * as ffmpegStatic from 'ffmpeg-static';
import { OaiResponse } from 'src/justbot/common/response.type';

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
                model: "gpt-4",
                messages,
                temperature: 0.7
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
}


