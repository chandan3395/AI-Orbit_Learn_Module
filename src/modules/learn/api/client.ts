type ApiError = { success: false; error: { code: string; message: string } };

export async function learnApi<T>(path: string, userId: string, init: RequestInit = {}) {
  const response = await fetch(path, {
    ...init,
    headers: {
      "x-demo-user-id": userId,
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const body = (await response.json()) as T | ApiError;
  if (!response.ok) {
    const message = (body as ApiError).error?.message ?? "Something went wrong";
    throw new Error(message);
  }
  return body as T;
}
