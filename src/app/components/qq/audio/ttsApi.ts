/*
  文本转语音 API 工具
  - 获取角色/风格列表
  - 进行文本合成并返回可播放的 mp3 URL
*/

export interface TtsVoiceListResponse {
  code: number;
  msg: string;
  data?: {
    voicelist?: Record<string, string>;
    stylelist?: Record<string, string>;
  };
}

export interface TtsSynthesizeResponse {
  code: number;
  msg: string;
  data?: {
    text: string;
    role: string;
    style: string;
    audio_url: string;
  };
}

export type TtsRole = string; // 如 zh-CN-XiaoyiNeural
export type TtsStyle = string; // 如 cheerful

const TTS_ENDPOINT = 'https://api.pearktrue.cn/api/freedub';

let cachedVoices: Record<string, string> | null = null;
let cachedStyles: Record<string, string> | null = null;

export async function fetchVoicesAndStyles(): Promise<{
  voices: Record<string, string>;
  styles: Record<string, string>;
}> {
  if (cachedVoices && cachedStyles) {
    return { voices: cachedVoices, styles: cachedStyles };
  }
  const res = await fetch(TTS_ENDPOINT, { method: 'GET' });
  const data: TtsVoiceListResponse = await res.json();
  if (data.code !== 200 || !data.data) {
    throw new Error(data.msg || '获取语音/风格列表失败');
  }
  cachedVoices = data.data.voicelist || {};
  cachedStyles = data.data.stylelist || {};
  return { voices: cachedVoices, styles: cachedStyles };
}

export async function synthesizeToAudioUrl(params: {
  text: string;
  role?: TtsRole;
  style?: TtsStyle;
}): Promise<string> {
  const body = {
    text: params.text,
    role: params.role || undefined,
    style: params.style || 'cheerful',
  } as Record<string, unknown>;

  const res = await fetch(TTS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data: TtsSynthesizeResponse = await res.json();
  if (data.code !== 200 || !data.data?.audio_url) {
    throw new Error(data.msg || '语音合成失败');
  }
  return data.data.audio_url;
}


