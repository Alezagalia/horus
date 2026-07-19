import { z } from 'zod';

/**
 * Política de contraseñas: mínimo 8 caracteres + bloqueo de contraseñas comunes.
 *
 * Enfoque pragmático (alineado con NIST 800-63B): en vez de exigir reglas de
 * composición (mayúscula/número/símbolo) que empeoran la UX sin mejorar mucho
 * la seguridad, mantenemos un mínimo de longitud razonable y rechazamos las
 * contraseñas más filtradas/adivinables. La comparación es case-insensitive y
 * sobre la contraseña recortada.
 */

// Top de contraseñas más comunes en filtraciones (subconjunto curado con las de
// 8+ caracteres, que son las únicas que superarían el min(8)). Todas en
// minúscula: la validación normaliza antes de comparar.
const COMMON_PASSWORDS = new Set<string>([
  '12345678',
  '123456789',
  '1234567890',
  '11111111',
  '00000000',
  'password',
  'password1',
  'password123',
  'passw0rd',
  'p@ssword',
  'p@ssw0rd',
  'qwerty123',
  'qwertyuiop',
  'iloveyou',
  'princess',
  'sunshine',
  'football',
  'baseball',
  'welcome1',
  'welcome123',
  'abc12345',
  'admin123',
  'administrator',
  'letmein1',
  'trustno1',
  'superman',
  'batman123',
  'michael1',
  'monkey123',
  'dragon123',
  'master123',
  'shadow123',
  'whatever',
  'computer',
  'internet',
  'starwars',
  'zaq12wsx',
  '1q2w3e4r',
  '1qaz2wsx',
  'qazwsxedc',
  'asdfghjkl',
  'changeme',
  'default1',
  'secret123',
]);

export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(100, 'La contraseña debe tener menos de 100 caracteres')
  .refine((value) => !COMMON_PASSWORDS.has(value.trim().toLowerCase()), {
    message: 'Esa contraseña es demasiado común. Elegí una menos predecible.',
  });

export { COMMON_PASSWORDS };
