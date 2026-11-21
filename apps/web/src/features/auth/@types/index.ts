export type Position =
  | "OLAHRAGA"
  | "MATEMATIKA"
  | "AGAMA"
  | "IPA"
  | "IPS"
  | "BAHASA_INDONESIA"
  | "SENI";

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      fullName: string;
      phone: string;
      position: Position;
      role: string;
      isFaceRegistered?: boolean;
    };
  };
}

export interface MessageResponse {
  success: boolean;
  message: string;
}
