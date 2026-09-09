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
      const axiosError = error as AxiosError<{ error?: { code?: string } }>;
      const original = axiosError.config as RetriableConfig | undefined;
      if (axiosError.response?.status === 401 && original && !original._retried) {
        original._retried = true;
        const refresh = await axios.post<{ data: { accessToken: string } }>(
          `${process.env.VITE_API_BASE_URL}/api/auth/refresh`,
          {},
          { withCredentials: true },
        );
        setAccessToken(refresh.data.data.accessToken);
        return instance(original);
      }
      const code = axiosError.response?.data?.error?.code;
      throw new Error(code ? toUserMessage(code) : "Terjadi kesalahan, coba lagi");
    },
  );
  return instance;
}

export const sgApi = createStackGateClient();
