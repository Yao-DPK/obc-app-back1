import { randomBytes, createHash, timingSafeEqual } from 'crypto';

/**
 * 1. Génération d'un token brut aléatoire.
 * C'est CE token (en clair) qui part dans l'email / l'URL vers le client.
 * On ne le stocke JAMAIS en base.
 */
export function generateRawToken(): string {
  return randomBytes(32).toString('hex'); // 64 caractères hex, haute entropie
}

/**
 * 2. Hash du token, à faire :
 *    - au moment de la création, pour stocker le hash en base (colonne tokenHash)
 *    - au moment de la vérification, pour comparer au hash stocké
 */
export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex'); // 64 caractères hex
}

/**
 * 3. Comparaison en "temps constant".
 * Comme le lookup se fait déjà via un index unique sur tokenHash,
 * un simple SELECT WHERE token_hash = ... suffit dans 99% des cas
 * (la comparaison est faite par Postgres, pas par du JS).
 * Cette fonction est utile seulement si tu compares deux hash toi-même
 * en JS (ex: tu as récupéré une ligne autrement et tu veux revérifier).
 */
export function compareHashes(hashA: string, hashB: string): boolean {
  const bufA = Buffer.from(hashA, 'hex');
  const bufB = Buffer.from(hashB, 'hex');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

