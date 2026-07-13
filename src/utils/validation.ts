// Verified byte-for-byte against the backend's actual decorator
// (src/common/validators/is-strong-password.decorator.ts): MinLength(10)
// as of v1.2.1 (was 6 before the security hardening pass), MaxLength(128),
// Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/). "Special
// character" server-side means literally anything that isn't a-z/A-Z/0-9
// (including e.g. a space) - matched here exactly so this client check
// never rejects something the server would accept.
export function getPasswordError(password: string): string | null {
  if (password.length < 10) {
    return 'Password must be at least 10 characters.';
  }

  if (password.length > 128) {
    return 'Password must be at most 128 characters.';
  }

  if (!/[a-zA-Z]/.test(password)) {
    return 'Password must include at least one letter.';
  }

  if (!/[0-9]/.test(password)) {
    return 'Password must include at least one number.';
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    return 'Password must include at least one special character.';
  }

  return null;
}

export const PASSWORD_HINT =
  'At least 10 characters, with a letter, a number, and a special character (e.g. Abcdefgh@1).';
