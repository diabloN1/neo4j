export interface RegisterRequest {
  name: string
  email: string;
  password: string;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id?: string;
  email?: string;
  username?: string;
  [key: string]: unknown;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}