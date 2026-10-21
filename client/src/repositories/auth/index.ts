import {
  AuthNetworkError,
  AuthResponse,
  IAuthRepository,
  LoginDTO,
  RegisterDTO,
} from './IAuthRepository';
import { LocalAuthRepository } from './LocalAuthRepository';
import { RemoteAuthRepository } from './RemoteAuthRepository';
import { User } from '../../interfaces/user';

export * from './IAuthRepository';
export { LocalAuthRepository } from './LocalAuthRepository';
export { RemoteAuthRepository } from './RemoteAuthRepository';

export class FallbackAuthRepository implements IAuthRepository {
  constructor(
    private readonly remote = new RemoteAuthRepository(),
    private readonly local = new LocalAuthRepository()
  ) {}

  async login(data: LoginDTO): Promise<AuthResponse> {
    try {
      return await this.remote.login(data);
    } catch (error) {
      if (!(error instanceof AuthNetworkError)) throw error;
      return this.local.login(data);
    }
  }

  async register(data: RegisterDTO): Promise<AuthResponse> {
    try {
      return await this.remote.register(data);
    } catch (error) {
      if (!(error instanceof AuthNetworkError)) throw error;
      return this.local.register(data);
    }
  }

  getCurrentSession(): Promise<User | null> {
    return this.local.getCurrentSession();
  }

  saveSession(user: User, token?: string): Promise<void> {
    return this.local.saveSession(user, token);
  }

  clearSession(): Promise<void> {
    return this.local.clearSession();
  }
}

export const authRepository = new FallbackAuthRepository();
