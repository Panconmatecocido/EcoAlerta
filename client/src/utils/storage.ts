// src/utils/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../interfaces/user';

const STORAGE_KEYS = {
  CURRENT_USER: '@ecoalerta_current_user',
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
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } catch (error) {
    console.error('Error al guardar el usuario en AsyncStorage:', error);
  }
};

/**
 * Obtiene la sesión del usuario actual
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!data) return null;
    return JSON.parse(data) as User;
  } catch (error) {
    console.error('Error al obtener el usuario de AsyncStorage:', error);
    return null;
  }
};

/**
 * Elimina la sesión del usuario actual (Logout)
 */
export const removeCurrentUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  } catch (error) {
    console.error('Error al eliminar la sesión de AsyncStorage:', error);
  }
};

/**
 * Obtiene la lista de usuarios registrados localmente
 */
export const getStoredUsers = async (): Promise<StoredUserAccount[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USERS_LIST);
    if (!data) return [];
    return JSON.parse(data) as StoredUserAccount[];
  } catch (error) {
    console.error('Error al obtener los usuarios de AsyncStorage:', error);
    return [];
  }
};

/**
 * Registra un nuevo usuario en la base de datos local
 */
export const saveNewUser = async (account: StoredUserAccount): Promise<void> => {
  try {
    const users = await getStoredUsers();
    const existingIndex = users.findIndex(
      (u) =>
        u.user.name.toLowerCase() === account.user.name.toLowerCase() ||
        (account.user.email && u.user.email.toLowerCase() === account.user.email.toLowerCase())
    );

    if (existingIndex >= 0) {
      users[existingIndex] = account;
    } else {
      users.push(account);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(users));
  } catch (error) {
    console.error('Error al registrar usuario en AsyncStorage:', error);
  }
};
