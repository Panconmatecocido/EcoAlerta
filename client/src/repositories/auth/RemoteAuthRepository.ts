import { API_URL } from '../../services/api';
import { User, UserRole } from '../../interfaces/user';
import {
  getCurrentUser,
  removeCurrentUser,
  saveAuthToken,
  saveCurrentUser,
} from '../../utils/storage';
import {
  AuthNetworkError,
  AuthRepositoryError,
  AuthResponse,
  IAuthRepository,
  LoginDTO,
  RegisterDTO,
} from './IAuthRepository';

interface ServerAuthResponse {
  success?: boolean;
  token?: string;
  message?: string;
  user?: {
    id?: string;
    nombre?: string;
    name?: string;
    email?: string;
    rol?: string;
    role?: string;
    puntos?: number;
    points?: number;
    creadoEn?: string;
    createdAt?: string;
  };
}

const serverRoleMap: Record<string, UserRole> = {
  CITIZEN: 'citizen',
  AGENT: 'agent',
  ADMIN: 'admin',
  COLLABORATOR: 'collaborator',
  citizen: 'citizen',
  agent: 'agent',
  admin: 'admin',
  collaborator: 'collaborator',
};

export class RemoteAuthRepository implements IAuthRepository {
  async login(data: LoginDTO): Promise<AuthResponse> {
    const result = await this.request('/auth/login', {
      identifier: data.identifier,
      password: data.password,
    });
    await this.saveSession(result.user, result.token);
    return result;
  }

  async register(data: RegisterDTO): Promise<AuthResponse> {
    const result = await this.request('/auth/register', {
      nombre: data.name,
      email: data.email,
      password: data.password,
    });
    await this.saveSession(result.user, result.token);
    return result;
  }

  async getCurrentSession(): Promise<User | null> {
    return getCurrentUser();
  }

  async saveSession(user: User, token?: string): Promise<void> {
    await saveCurrentUser(user);
    if (token !== undefined) {
      await saveAuthToken(token);
    }
  }

  async clearSession(): Promise<void> {
    await removeCurrentUser();
  }

  private async request(
    endpoint: string,
    body: Record<string, string>
  ): Promise<AuthResponse> {
    let response: Response;
    try {
      response = await fetch(`${API_URL}/api${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (error) {
      if (error instanceof TypeError) {
        throw new AuthNetworkError('No se pudo conectar con el servidor de autenticación');
      }
      throw error;
    }

    let payload: ServerAuthResponse;
    try {
      payload = (await response.json()) as ServerAuthResponse;
    } catch {
      throw new AuthRepositoryError('El servidor devolvió una respuesta de autenticación inválida', response.status);
    }

    if (!response.ok) {
      throw new AuthRepositoryError(
        payload.message || 'No se pudo completar la autenticación',
        response.status
      );
    }

    return this.normalizeResponse(payload);
  }

  private normalizeResponse(payload: ServerAuthResponse): AuthResponse {
    const serverUser = payload.user;
    const role = serverUser?.rol ?? serverUser?.role;
    const normalizedRole = role ? serverRoleMap[role] : undefined;

    if (
      !payload.token ||
      !serverUser?.id ||
      !serverUser.email ||
      !normalizedRole
    ) {
      throw new AuthRepositoryError('El servidor devolvió datos de sesión incompletos');
    }

    return {
      token: payload.token,
      user: {
        id: serverUser.id,
        name: serverUser.nombre ?? serverUser.name ?? serverUser.email,
        email: serverUser.email,
        role: normalizedRole,
        points: serverUser.puntos ?? serverUser.points ?? 0,
        createdAt: serverUser.creadoEn ?? serverUser.createdAt,
      },
    };
  }
}
