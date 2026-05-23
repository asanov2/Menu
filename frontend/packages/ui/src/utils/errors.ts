export function getApiErrorMessage(
  err: unknown,
  fallback = 'Неизвестная ошибка'
): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const response = (err as { response?: { data?: { detail?: string; message?: string } } }).response;
    if (response?.data?.detail && typeof response.data.detail === 'string') return response.data.detail;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
}

export function isAxiosError(
  err: unknown
): err is { response: { status: number; data?: { message?: string } } } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    typeof (err as { response: unknown }).response === 'object'
  );
}
