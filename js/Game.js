//import {imageCollections} from './ImageCollection.js';
import {ApiService} from './ApiService.js';


export class Game {
  /**
   * @type {number} id identifiant de la partie en cours
   */
  #id; // private attributes.
  #name;
  #difficulty;

  async endGame() {
    // Todo À compléter


    const idARemplacer = 1234;
    const nombreDePairesRestanteARemplacer = 5678;

    try {
      const result = await ApiService.updateGameResult(idARemplacer, nombreDePairesRestanteARemplacer);
      console.log('Fin de partie:', result);
    } catch (error) {
      console.error('Error:', error);
      alert(error.message || 'Erreur lors de la fin de la partie');
    }

  }

  /**
   * Start a new game.
   * @param {number} id - The game ID.
   * @param {string} name - The player username.
   * @param {string} difficulty - The chosen difficulty.
   */
  startGame(id, name, difficulty) {
    this.#id = id;
    this.#name = name;
    this.#difficulty = difficulty;

    // Logique principale de jeu

  }

  // Todo À compléter

}
