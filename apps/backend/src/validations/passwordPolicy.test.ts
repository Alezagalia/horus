import { describe, it, expect } from 'vitest';
import { passwordSchema } from './passwordPolicy.js';

describe('passwordSchema', () => {
  it('acepta una contraseña razonable de 8+ caracteres', () => {
    expect(passwordSchema.safeParse('Tr4vel-Blue!').success).toBe(true);
  });

  it('rechaza contraseñas con menos de 8 caracteres', () => {
    expect(passwordSchema.safeParse('short1').success).toBe(false);
  });

  it('rechaza contraseñas comunes exactas', () => {
    expect(passwordSchema.safeParse('password').success).toBe(false);
    expect(passwordSchema.safeParse('12345678').success).toBe(false);
    expect(passwordSchema.safeParse('iloveyou').success).toBe(false);
  });

  it('rechaza contraseñas comunes sin importar mayúsculas/espacios', () => {
    expect(passwordSchema.safeParse('Password').success).toBe(false);
    expect(passwordSchema.safeParse('  PASSWORD123  ').success).toBe(false);
    expect(passwordSchema.safeParse('QWERTY123').success).toBe(false);
  });

  it('acepta una contraseña larga aunque contenga una común como substring', () => {
    // Solo bloqueamos coincidencias exactas, no substrings.
    expect(passwordSchema.safeParse('my-password-is-strong').success).toBe(true);
  });

  it('devuelve un mensaje claro para contraseña común', () => {
    const result = passwordSchema.safeParse('password123');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/común/i);
    }
  });
});
