/** URL de base de l'API Memory */
export const MEMORY_URL = 'https://memory.iuthub.fr/api/game';

/**
 * Nombre de paires par niveau de difficulté.
 * - Difficulté 1 → 4 paires  (8 cartes)
 * - Difficulté 2 → 8 paires  (16 cartes)
 * - Difficulté 3 → 10 paires (20 cartes  — 5 cols × 4 lignes)
 * - Dffilculté Hardcore : 12 paires, mais un temps plus limité.
 * Note : les collections contenant 8 images max,
 * la difficulté 3 répète les 2 premières images.
 **/
export const DIFFICULTY_PAIRS = {
    1: 4,
    2: 8,
    3: 10,
    4: 12,
};
/**
 * Structure typée contenant les temps moyens en secondes pour chacune des difficultés.
 * @type {{1: number, 2: number, 3: number}}
 */
export const DIFFICULTY_TIME = {
    1: 90,   // 1 minute 30 en secondes.
    2: 60,  // 1 minute en secondes.
    3: 30,  // 30 secondes.
};