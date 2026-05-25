import { adminApi } from '@qrmenu/ui';

export interface TelegramStatus {
  connected: boolean;
  chat_id: number | null;
  orders_enabled: boolean;
  preorders_enabled: boolean;
  tables_count: number;
  bot_username?: string;
}

export interface GenerateCodeResult {
  code: string;
  expires_in: number;
  bot_username: string;
}

export interface TelegramSettingsPayload {
  orders_enabled: boolean;
  preorders_enabled: boolean;
  tables_count: number;
}

export const getTelegramStatus = async (): Promise<TelegramStatus> => {
  const { data } = await adminApi.get<TelegramStatus>('/api/v1/admin/telegram/status');
  return data;
};

export const generateTelegramCode = async (): Promise<GenerateCodeResult> => {
  const { data } = await adminApi.post<GenerateCodeResult>('/api/v1/admin/telegram/generate-code');
  return data;
};

export const saveTelegramSettings = async (payload: TelegramSettingsPayload): Promise<void> => {
  await adminApi.patch('/api/v1/admin/telegram/settings', payload);
};

export const disconnectTelegram = async (): Promise<void> => {
  await adminApi.delete('/api/v1/admin/telegram/disconnect');
};
