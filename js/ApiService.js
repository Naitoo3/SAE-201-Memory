import { MEMORY_URL } from './config.js';

/**
 * Service centralisant tous les appels HTTP vers l'API Memory.
 */
export class ApiService {

    /**
     * Crée une nouvelle partie sur le serveur.
     *
     * @param {string} pseudo     - Pseudo du joueur
     * @param {number} difficulty - Niveau (1 | 2 | 3)
     * @returns {Promise<import('./types.js').GameReturn>}
     * @throws {Error} Si le serveur répond avec une erreur HTTP
     */
    static async createGame(pseudo, difficulty) {
        const response = await fetch(MEMORY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: pseudo,                    // champ attendu par l'API
                difficulty: parseInt(difficulty),
            }),
        });

        if (!response.ok) {
            throw new Error(`Erreur serveur (${response.status}) lors de la création de la partie`);
        }

        return response.json(); // { id: number }
    }

    /**
     * Envoie le résultat de fin de partie au serveur.
     *
     * @param {number} gameId         - Identifiant de la partie
     * @param {number} pairsRemaining - Paires restant à découvrir
     * @returns {Promise<any>}
     * @throws {Error} Si le serveur répond avec une erreur HTTP
     */
    static async updateGameResult(gameId, pairsRemaining) {
        const response = await fetch(`${MEMORY_URL}/${gameId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombreCoupsRestant: pairsRemaining }),
        });

        if (!response.ok) {
            throw new Error(`Erreur serveur (${response.status}) lors de la fin de partie`);
        }

        return response.json();
    }
}
