import { Injectable } from '@nestjs/common';
import { WwjsLogger } from 'src/Logger/logger.service';
import { WhatsappBot } from 'src/WwjsClient/proxy/whatsappBot';
import { Configuration, OpenAIApi, CreateTranscriptionResponse, ImagesResponse, CreateCompletionResponse, ChatCompletionRequestMessage, CreateChatCompletionResponse } from 'openai';
import * as fs from 'fs';
import { Message } from 'whatsapp-web.js';
import * as ffmpeg from 'fluent-ffmpeg';
import * as ffmpegStatic from 'ffmpeg-static';

@Injectable()
export class WwbotGPTService {
  constructor() { }

  public async explainEachFunctionInCode(code: string) {
    const systemMessage = `You are an helpful program that gets code as message  and for each of the functions explains in a short manner (up to one sentance) what it does
   
    also do it with this json format: """
     {"functionName": "explanation", "secondFunctionName": "explanation"} 
    """`

    const prompt = `for the following code, explain in short manner (up to one sentance) what each of the functions does, explain as if you explain it to a 5 year old
    do it with this json format: """ {"functionName": "explanation", "secondFunctionName": "explanation"} """
    code: """${code}"""`

    const messages: ChatCompletionRequestMessage[] = [
      { role: "system", content: systemMessage },
      { role: "user", content: prompt }
    ]

    const response = await this.gptCompletion(messages)
    return response.err || JSON.parse(response.response.choices[0].message.content);
  }

  public async gptCompletion(messages: ChatCompletionRequestMessage[]): Promise<any> {
    const configuration = new Configuration({
      apiKey: process.env.WWBOT_OAI_APIKEY
    })

    const OPENAI_CLIENT = new OpenAIApi(configuration);

    try {
      const resp = await OPENAI_CLIENT.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages,
        temperature: 0.2,
      });

      return { response: resp.data };
    } catch (err) {
      return { error: err };
    }
  }
}


