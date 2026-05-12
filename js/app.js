import {DOMManager} from './DOMManager.js';
import {Game} from './Game.js';
import {ApiService} from './ApiService.js';
const SubmitButton = document.querySelector('#startButton'); // Submit button
const domManager = new DOMManager();
const game = new Game();

document.querySelector('.game-form').addEventListener('submit', async function (event) {
  event.preventDefault(); // Prevents refreshing.
  try {
    // Vérification des données
    const PlayerName = document.querySelector('#PlayerName').value;
    const difficulty = document.querySelector('#DifficultyValue').value;
    const imageCollection = document.querySelector('#ImageValue').value;

    // Verification through console
    console.log(PlayerName + " " + difficulty + " " + imageCollection);

    const data = await ApiService.createGame(PlayerName, difficulty);
    console.log('Success:', data, data.id);
    game.startGame(data.id, PlayerName, difficulty);
  } catch (error) {
    console.error('Error:', error);
    alert(error.message || 'Erreur lors de la création de la partie');
  }
});
