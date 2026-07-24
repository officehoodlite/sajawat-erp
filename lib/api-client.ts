export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const json = await response.json();

  if (!response.ok || json.error) {
    throw new ApiError(
      json.message ?? "Request failed",
      response.status,
      json.details
    );
  }

  return json.data as T;
}
