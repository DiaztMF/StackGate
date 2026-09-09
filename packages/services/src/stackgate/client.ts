import axios, { create, type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "Sesi berakhir, silakan login kembali",
  FORBIDDEN_TRANSITION: "Aksi ini di luar hak peran kamu",
  GATE_INCOMPLETE: "Checklist gerbang belum lengkap",
  RESEARCH_LINK_REQUIRED: "Tautan modul riset wajib diisi dulu",
  VALIDATION_ERROR: "Data yang dikirim belum valid",
  NOT_FOUND: "Data tidak ditemukan",
};

export function toUserMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? "Terjadi kesalahan, coba lagi";
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

let refreshPromise: Promise<string> | null = null;

function isAuthUrl(url: string | undefined): boolean {
  if (!url) return false;
  return url.includes("/api/auth/login") || url.includes("/api/auth/refresh");
}

async function fetchFreshToken(): Promise<string> {
  const refresh = await axios.post<{ data: { accessToken: string } }>(
    `${process.env.VITE_API_BASE_URL}/api/auth/refresh`,
    {},
    { withCredentials: true },
  );
  return refresh.data.data.accessToken;
}

async function clearWhenDone(p: Promise<string>): Promise<void> {
  try {
    await p;
  } catch {
    // caller handles refresh errors
  } finally {
    if (refreshPromise === p) refreshPromise = null;
  }
}

function startRefresh(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = fetchFreshToken();
    void clearWhenDone(refreshPromise);
  }
  return refreshPromise;
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

export function createStackGateClient(): AxiosInstance {
  const instance = create({ baseURL: process.env.VITE_API_BASE_URL });
  instance.interceptors.request.use((config) => {
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  });
  instance.interceptors.response.use(
    (res) => res,
    async (error: unknown) => {
      const axiosError = error as AxiosError<{ error?: { code?: string; message?: string } }>;
      const original = axiosError.config as RetriableConfig | undefined;
      if (axiosError.response?.status === 401 && original && !original._retried && !isAuthUrl(original.url)) {
        original._retried = true;
        try {
          const token = await startRefresh();
          setAccessToken(token);
          return instance(original);
        } catch {
          setAccessToken(null);
          throw new Error(toUserMessage("UNAUTHORIZED"));
        }
      }
      const serverMessage = axiosError.response?.data?.error?.message as string | undefined;
      const code = axiosError.response?.data?.error?.code as string | undefined;
      throw new Error(serverMessage ?? (code ? toUserMessage(code) : "Terjadi kesalahan, coba lagi"));
    },
  );
  return instance;
}

export const sgApi = createStackGateClient();
