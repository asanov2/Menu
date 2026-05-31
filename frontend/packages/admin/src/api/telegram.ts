import { adminApi } from '@qrmenu/ui';

export interface TelegramRecipient {
  id: string;
  chat_id: number;
  label: string;
  created_at: string;
}

export interface TelegramStatus {
  connected: boolean;
  recipients: TelegramRecipient[];
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

export const generateTelegramCode = async (label: string): Promise<GenerateCodeResult> => {
  const { data } = await adminApi.post<GenerateCodeResult>('/api/v1/admin/telegram/generate-code', { label });
  return data;
};

export const deleteRecipient = async (recipientId: string): Promise<void> => {
  await adminApi.delete(`/api/v1/admin/telegram/recipients/${recipientId}`);
};

export const disconnectAllTelegram = async (): Promise<void> => {
  await adminApi.delete('/api/v1/admin/telegram/disconnect');
};

export const saveTelegramSettings = async (payload: TelegramSettingsPayload): Promise<void> => {
  await adminApi.patch('/api/v1/admin/telegram/settings', payload);
};
