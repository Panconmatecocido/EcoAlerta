// src/utils/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../interfaces/user';

const STORAGE_KEYS = {
  CURRENT_USER: '@ecoalerta_user',
  LEGACY_CURRENT_USER: '@ecoalerta_current_user',
  AUTH_TOKEN: '@ecoalerta_token',
  USERS_LIST: '@ecoalerta_users_database',
};

export interface StoredUserAccount {
  user: User;
  passwordHash: string;
}

/**
 * Guarda o actualiza la sesión del usuario actual
 */
export const saveCurrentUser = async (user: User): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
};

/**
 * Obtiene la sesión del usuario actual
 */
export const getCurrentUser = async (): Promise<User | null> => {
  const data =
    (await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER)) ??
    (await AsyncStorage.getItem(STORAGE_KEYS.LEGACY_CURRENT_USER));
  if (!data) return null;

  const user = JSON.parse(data) as User;
  if (!user.id || !user.email || !user.name || !user.role) {
    throw new Error('La sesión almacenada no tiene un formato válido');
  }
  if (user.role !== 'citizen' && user.role !== 'agent' && user.role !== 'admin' && user.role !== 'collaborator') {
    throw new Error('La sesión almacenada contiene un rol no reconocido');
  }

  if (await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER) === null) {
    await saveCurrentUser(user);
  }
  return user;
};

/**
 * Elimina la sesión del usuario actual (Logout)
 */
export const removeCurrentUser = async (): Promise<void> => {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.CURRENT_USER,
    STORAGE_KEYS.LEGACY_CURRENT_USER,
    STORAGE_KEYS.AUTH_TOKEN,
  ]);
};

/**
 * Obtiene la lista de usuarios registrados localmente
 */
export const getStoredUsers = async (): Promise<StoredUserAccount[]> => {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.USERS_LIST);
  if (!data) return [];
  const users = JSON.parse(data) as StoredUserAccount[];
  if (!Array.isArray(users)) {
    throw new Error('La base local de usuarios no tiene un formato válido');
  }
  return users;
};

/**
 * Registra un nuevo usuario en la base de datos local
 */
export const saveNewUser = async (account: StoredUserAccount): Promise<void> => {
  const users = await getStoredUsers();
  const existingIndex = users.findIndex((u) => u.user.id === account.user.id);

  if (existingIndex >= 0) {
    users[existingIndex] = account;
  } else {
    users.push(account);
  }

  await AsyncStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(users));
};

export const getAuthToken = async (): Promise<string | null> =>
  AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

export const saveAuthToken = async (token: string): Promise<void> =>
  AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);