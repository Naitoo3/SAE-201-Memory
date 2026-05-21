/** URL de base de l'API Memory */
export const MEMORY_URL = 'https://memory.iuthub.fr/api/game';

/**
 * Nombre de paires par niveau de difficulté.
 * - Difficulté 1 → 4 paires  (8 cartes)
 * - Difficulté 2 → 8 paires  (16 cartes)
 * - Difficulté 3 → 10 paires (20 cartes  — 5 cols × 4 lignes)
 * Note : les collections contenant 8 images max,
 * la difficulté 3 répète les 2 premières images.
 **/
export const DIFFICULTY_PAIRS = {
    1: 4,
    2: 8,
    3: 10,
};
/**
 * Structure typée contenant les temps moyens en secondes pour chacune des difficultés.
 * @type {{1: number, 2: number, 3: number}}
 */
export const DIFFICULTY_TIME = {
    1: 30,
    2: 45,
    3: 60,
};
/** Durée d'affichage des cartes en mode Fugace (secondes) */
export const FUGACE_REVEAL_TIME = 3;