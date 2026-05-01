// === FILE: frontend/packages/admin/src/api/upload.ts ===
import { adminApi } from '@qrmenu/ui';

export async function uploadImage(file: File): Promise<{ url: string; key: string }> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await adminApi.post('/api/v1/admin/upload/image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
