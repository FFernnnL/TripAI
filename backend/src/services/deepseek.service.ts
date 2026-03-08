import OpenAI from 'openai';
import { GenerateRequest, AIDayResult } from '../types';
import { buildGeneratePrompt, buildOptimizePrompt } from '../utils/promptBuilder';
import { parseDayFromChunk } from '../utils/responseParser';

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL + '/v1',
});

export interface StreamCallbacks {
  onStatus: (message: string) => void;
  onDay: (day: AIDayResult) => void;
  onComplete: () => void;
  onError: (error: string) => void;
}

export async function generateItineraryStream(data: GenerateRequest, callbacks: StreamCallbacks) {
  const { system, user } = buildGeneratePrompt(data);

  callbacks.onStatus('正在分析您的旅行偏好...');

  try {
    const stream = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      stream: true,
      max_tokens: 8000,
      temperature: 0.7,
    });

    callbacks.onStatus('正在为您生成个性化行程...');

    let buffer = '';
    let dayCount = 0;

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (!content) continue;

      buffer += content;

      // Try to parse completed days from buffer
      let parseResult = parseDayFromChunk(buffer);
      while (parseResult.day) {
        dayCount++;
        callbacks.onDay(parseResult.day);
        callbacks.onStatus(`已生成第 ${dayCount} 天行程...`);
        buffer = parseResult.remaining;
        parseResult = parseDayFromChunk(buffer);
      }
      buffer = parseResult.remaining;
    }

    // Try to parse any remaining content as the last day
    if (buffer.trim()) {
      const finalResult = parseDayFromChunk(buffer + '---DAY_SEPARATOR---');
      if (finalResult.day) {
        callbacks.onDay(finalResult.day);
      }
    }

    callbacks.onComplete();
  } catch (error: any) {
    callbacks.onError(error.message || 'AI生成失败');
  }
}

export async function optimizeDay(dayData: string, instruction: string): Promise<AIDayResult | null> {
  const { system, user } = buildOptimizePrompt(dayData, instruction);

  try {
    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start === -1 || end === -1) return null;

    return JSON.parse(content.substring(start, end + 1)) as AIDayResult;
  } catch {
    return null;
  }
}
