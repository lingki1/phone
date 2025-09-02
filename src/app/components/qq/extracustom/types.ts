import { Message } from '../../../types/chat';

export interface ExtraInfoConfig {
  enabled: boolean;
  description: string;
  lastUpdate: number;
}

export interface ExtraInfoMessage extends Message {
  type: 'extra_info';
  htmlContent: string;
  description: string;
}

export interface ExtraInfoPrompt {
  enabled: boolean;
  description: string;
}
