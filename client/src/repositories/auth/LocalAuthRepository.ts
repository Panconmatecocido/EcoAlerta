import {
  getCurrentUser,
  getAuthToken,
  getStoredUsers,
  removeCurrentUser,
  saveAuthToken,
  saveCurrentUser,
  saveNewUser,
  StoredUserAccount,
} from '../../utils/storage';
import { User, UserRole } from '../../interfaces/user';
import {
  AuthRepositoryError,
  AuthResponse,
  IAuthRepository,
  LoginDTO,
  RegisterDTO,
} from './IAuthRepository';

const localAccounts: Array<{
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password: string;
  points: number;
}> = [
  {
    id: 'local-citizen-1',
    name: 'Ciudadano Demo',
    email: 'ciudadano@ecoalerta.com',
    role: 'citizen',
    password: 'ciudadano123',
    points: 0,
  },
  {
    id: 'local-agent-1',
    name: 'Agente Demo',
    email: 'agente1@ecoalerta.com',
    role: 'agent',
    password: 'agente123',
    points: 0,
  },
  {
    id: 'local-admin-1',
    name: 'Administrador Demo',
    email: 'admin@ecoalerta.com',
    role: 'admin',
    password: 'admin123',
    points: 0,
  },
  {
    id: 'local-collaborator-1',
    name: 'Colaborador Demo',
    email: 'colaborador@ecoalerta.com',
    role: 'collaborator',
    password: 'colaborador123',
    points: 0,
  },
  {
    id: 'demo-user-1',
    name: 'EcoUsuario',
    email: 'ejemplo@email.com',
    role: 'citizen',
    password: 'password123',
    points: 120,
  },
  {
    id: 'agent-user-1',
    name: 'Inspector Perez',
    email: 'agente@municipio.gob.ar',
    role: 'agent',
    password: 'agente123',
    points: 0,
  },
  {
    id: 'admin-user-1',
    name: 'Administrador General',
    email: 'admin@ecoalerta.gob.ar',
    role: 'admin',
    password: 'admin123',
    points: 0,
  },
];

const normalize = (value: string) => value.trim().toLowerCase();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class LocalAuthRepository implements IAuthRepository {
  async login(data: LoginDTO): Promise<AuthResponse> {
    await this.ensureDemoAccounts();
    const identifier = normalize(data.identifier);
    const password = data.password.trim();
    const accounts = await getStoredUsers();
    const account = accounts.find(
      ({ user }) => normalize(user.email) === identifier || normalize(user.name) === identifier
    );

    if (!account || account.passwordHash !== password) {
      throw new AuthRepositoryError('Correo electrónico o contraseña incorrectos', 401);
    }

    return this.createSession(account.user);
  }

  async register(data: RegisterDTO): Promise<AuthResponse> {
    await this.ensureDemoAccounts();
    const name = data.name.trim();
    const email = normalize(data.email);
    const password = data.password.trim();
    if (!name || !email || !password) {
      throw new AuthRepositoryError('Nombre, correo electrónico y contraseña son obligatorios', 400);
    }
    if (!EMAIL_PATTERN.test(email)) {
      throw new AuthRepositoryError('El correo electrónico no es válido', 400);
    }
    if (password.length < 6) {
      throw new AuthRepositoryError('La contraseña debe tener al menos 6 caracteres', 400);
    }

    const accounts = await getStoredUsers();
    if (accounts.some(({ user }) => normalize(user.email) === email)) {
      throw new AuthRepositoryError('Ya existe una cuenta registrada con ese correo electrónico', 409);
    }

    const user: User = {
      id: `local-user-${Date.now()}`,
      name,
      email,
      role: 'citizen',
      points: 0,
      createdAt: new Date().toISOString(),
    };
    const account: StoredUserAccount = { user, passwordHash: password };
    await saveNewUser(account);
    return this.createSession(user);
  }

  async getCurrentSession(): Promise<User | null> {
    await this.ensureDemoAccounts();
    const user = await getCurrentUser();
    if (!user) return null;

    if (!(await getAuthToken())) {
      await saveAuthToken(`local:${user.id}`);
    }
    return user;
  }

  async saveSession(user: User, token?: string): Promise<void> {
    await saveCurrentUser(user);
    if (token !== undefined) {
      await saveAuthToken(token);
    } else if (!(await getAuthToken())) {
      await saveAuthToken(`local:${user.id}`);
    }
  }

  async clearSession(): Promise<void> {
    await removeCurrentUser();
  }

  private async ensureDemoAccounts(): Promise<void> {
    const accounts = await getStoredUsers();
    for (const demo of localAccounts) {
      if (accounts.some(({ user }) => normalize(user.email) === demo.email)) {
        continue;
      }

      const user: User = {
        id: demo.id,
        name: demo.name,
        email: demo.email,
        role: demo.role,
        points: demo.points,
        createdAt: new Date().toISOString(),
      };
      await saveNewUser({ user, passwordHash: demo.password });
      accounts.push({ user, passwordHash: demo.password });
    }
  }

  private async createSession(user: User): Promise<AuthResponse> {
    const token = `local:${user.id}`;
    await this.saveSession(user, token);
    return { token, user };
  }
}
