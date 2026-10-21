const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface RegistrationFormData {
  nombre: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegistrationFormErrors {
  nombre?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function validateEmail(email: string): string | null {
  const normalizedEmail = email.trim();
  if (!normalizedEmail) {
    return 'El correo electrónico es obligatorio';
  }

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return 'El correo electrónico no es válido';
  }

  return null;
}

export function validatePassword(password: string): string | null {
  if (!password.trim()) {
    return 'La contraseña es obligatoria';
  }

  if (password.trim().length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres';
  }

  return null;
}

export function validateRegistrationForm(
  data: RegistrationFormData
): RegistrationFormErrors {
  const errors: RegistrationFormErrors = {};

  if (!data.nombre.trim()) {
    errors.nombre = 'El nombre es obligatorio';
  }

  const emailError = validateEmail(data.email);
  if (emailError) {
    errors.email = emailError;
  }

  const passwordError = validatePassword(data.password);
  if (passwordError) {
    errors.password = passwordError;
  }

  if (!data.confirmPassword.trim()) {
    errors.confirmPassword = 'Confirma tu contraseña';
  } else if (data.password.trim() !== data.confirmPassword.trim()) {
    errors.confirmPassword = 'Las contraseñas no coinciden';
  }

  return errors;
}
