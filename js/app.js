import { Game }       from './Game.js';
import { ApiService } from './ApiService.js';
import { DOMManager } from './DOMManager.js';

// ── Instances ──────────────────────────────────────────────
const game       = new Game();
const domManager = new DOMManager();

// ── Soumission du formulaire ───────────────────────────────
document.getElementById('gameForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  const pseudo     = document.getElementById('PlayerName').value.trim();
  const difficulty = parseInt(document.getElementById('DifficultyValue').value);
  const theme = document.getElementById('ImageValue').value;

  if (!pseudo || !difficulty || !theme) {
    alert('Merci de remplir tous les champs.');
    return;
  }

  const startBtn = document.getElementById('startButton');
  startBtn.disabled    = true;
  startBtn.textContent = '⏳ Connexion…';

  try {
    // Création de la partie côté serveur
    const data = await ApiService.createGame(pseudo, difficulty);
    console.log('Partie créée — id :', data.id);

    // Démarrage local du jeu
    game.startGame(data.id, pseudo, difficulty, theme);

  } catch (error) {
    console.error('Erreur création partie :', error);
    alert(error.message || 'Impossible de joindre le serveur. Vérifiez votre connexion.');
  } finally {
    startBtn.disabled    = false;
    startBtn.textContent = '▶ Démarrer';
  }
});

// ── Bouton Abandonner ──────────────────────────────────────
document.getElementById('abandon').addEventListener('click', () => {
  if (confirm('Voulez-vous vraiment abandonner la partie ?')) {
    game.endGame(false);
  }
});

// ── Bouton Rejouer (modale) ────────────────────────────────
document.getElementById('modalRestart').addEventListener('click', () => {
  domManager.hideEndModal();
  domManager.showSetup();
  document.getElementById('gameForm').reset();
});
// ── Bouton de thème ────────────────────────────────────────
const buttonTheme = document.getElementById('btn-theme');

buttonTheme.addEventListener('click', () => {
  document.body.classList.toggle('light');
});

