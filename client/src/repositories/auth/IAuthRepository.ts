import { User } from '../../interfaces/user';

export type AuthUser = User;

export interface LoginDTO {
  identifier: string;
  password: string;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface IAuthRepository {
  login(data: LoginDTO): Promise<AuthResponse>;
  register(data: RegisterDTO): Promise<AuthResponse>;
  getCurrentSession(): Promise<AuthUser | null>;
  saveSession(user: AuthUser, token?: string): Promise<void>;
  clearSession(): Promise<void>;
}

export class AuthRepositoryError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'AuthRepositoryError';
  }
}

export class AuthNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthNetworkError';
  }
}
