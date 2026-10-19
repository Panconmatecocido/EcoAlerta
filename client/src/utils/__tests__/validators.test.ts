import assert from 'node:assert/strict';
import test from 'node:test';
import { User } from '../../interfaces/user';
import { LocalAuthRepository, LocalAuthStorage } from '../../repositories/auth/LocalAuthRepository';
import {
  RegistrationFormData,
  validateEmail,
  validatePassword,
  validateRegistrationForm,
} from '../validators';
import { StoredUserAccount } from '../storage';

test('validateEmail accepts trimmed valid addresses and rejects empty or malformed input', () => {
  assert.equal(validateEmail('  eco@example.com  '), null);
  assert.equal(validateEmail(''), 'El correo electrónico es obligatorio');
  assert.equal(validateEmail('not-an-email'), 'El correo electrónico no es válido');
});

test('validatePassword enforces the six-character minimum', () => {
  assert.equal(validatePassword('secret'), null);
  assert.equal(validatePassword('12345'), 'La contraseña debe tener al menos 6 caracteres');
  assert.equal(validatePassword('      '), 'La contraseña es obligatoria');
});

test('validateRegistrationForm validates each required field and confirmation', () => {
  const validForm: RegistrationFormData = {
    nombre: 'Ana Pérez',
    email: 'ana@example.com',
    password: 'secret1',
    confirmPassword: 'secret1',
  };
  assert.deepEqual(validateRegistrationForm(validForm), {});
  assert.deepEqual(
    validateRegistrationForm({
      nombre: '',
      email: 'invalid',
      password: '123',
      confirmPassword: 'different',
    }),
    {
      nombre: 'El nombre es obligatorio',
      email: 'El correo electrónico no es válido',
      password: 'La contraseña debe tener al menos 6 caracteres',
      confirmPassword: 'Las contraseñas no coinciden',
    }
  );
});

class MemoryAuthStorage implements LocalAuthStorage {
  users: StoredUserAccount[] = [];
  currentUser: User | null = null;
  token: string | null = null;

  async getCurrentUser(): Promise<User | null> {
    return this.currentUser;
  }

  async getAuthToken(): Promise<string | null> {
    return this.token;
  }

  async getStoredUsers(): Promise<StoredUserAccount[]> {
    return [...this.users];
  }

  async removeCurrentUser(): Promise<void> {
    this.currentUser = null;
    this.token = null;
  }

  async saveAuthToken(token: string): Promise<void> {
    this.token = token;
  }

  async saveCurrentUser(user: User): Promise<void> {
    this.currentUser = user;
  }

  async saveNewUser(account: StoredUserAccount): Promise<void> {
    const existingIndex = this.users.findIndex(({ user }) => user.id === account.user.id);
    if (existingIndex >= 0) {
      this.users[existingIndex] = account;
    } else {
      this.users.push(account);
    }
  }
}

test('LocalAuthRepository registers citizen with zero points and rejects duplicate emails', async () => {
  const storage = new MemoryAuthStorage();
  const repository = new LocalAuthRepository(storage);

  const response = await repository.register({
    name: ' Ana ',
    email: ' ANA@example.com ',
    password: 'secret1',
  });

  assert.equal(response.user.name, 'Ana');
  assert.equal(response.user.email, 'ana@example.com');
  assert.equal(response.user.role, 'citizen');
  assert.equal(response.user.points, 0);
  assert.equal(storage.currentUser?.id, response.user.id);
  assert.equal(storage.token, response.token);

  await assert.rejects(
    repository.register({
      name: 'Otra Ana',
      email: 'ana@example.com',
      password: 'secret1',
    }),
    { status: 409 }
  );
});

test('LocalAuthRepository validates registration data and logs into all four demo roles', async () => {
  const storage = new MemoryAuthStorage();
  const repository = new LocalAuthRepository(storage);

  await assert.rejects(
    repository.register({ name: 'Ana', email: 'invalid', password: 'secret1' }),
    { status: 400 }
  );
  await assert.rejects(
    repository.register({ name: 'Ana', email: 'ana@example.com', password: '12345' }),
    { status: 400 }
  );

  const accounts = [
    ['ciudadano@ecoalerta.com', 'ciudadano123', 'citizen'],
    ['agente1@ecoalerta.com', 'agente123', 'agent'],
    ['admin@ecoalerta.com', 'admin123', 'admin'],
    ['colaborador@ecoalerta.com', 'colaborador123', 'collaborator'],
  ] as const;

  for (const [email, password, role] of accounts) {
    const response = await repository.login({ identifier: email, password });
    assert.equal(response.user.role, role);
  }

  await assert.rejects(
    repository.login({ identifier: 'ciudadano@ecoalerta.com', password: 'incorrecta' }),
    { status: 401 }
  );
});

test('LocalAuthRepository restores, upgrades, and clears local sessions', async () => {
  const storage = new MemoryAuthStorage();
  const repository = new LocalAuthRepository(storage);
  const registered = await repository.register({
    name: 'Ana',
    email: 'ana@example.com',
    password: 'secret1',
  });

  storage.token = null;
  assert.equal((await repository.getCurrentSession())?.id, registered.user.id);
  assert.equal(storage.token, `local:${registered.user.id}`);

  await repository.clearSession();
  assert.equal(storage.currentUser, null);
  assert.equal(storage.token, null);
});
