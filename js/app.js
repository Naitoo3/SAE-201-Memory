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
    const theme      = document.getElementById('ImageValue').value;
    const hardcore   = document.getElementById('HardcoreMode').checked;
    const fugace     = document.getElementById('FugaceMode').checked;

    // Empêcher les deux modes simultanément
    if (hardcore && fugace) {
        alert('Le mode Fugace et le mode Hardcore sont incompatibles. Veuillez n\'en choisir qu\'un.');
        return;
    }

    if (!pseudo || !difficulty || !theme) {
        alert('Merci de remplir tous les champs.');
        return;
    }

    const startBtn = document.getElementById('startButton');
    startBtn.disabled    = true;
    startBtn.textContent = '⏳ Connexion…';

    try {
        const data = await ApiService.createGame(pseudo, difficulty);
        console.log('Partie créée — id :', data.id);
        game.startGame(data.id, pseudo, difficulty, theme, hardcore, fugace);

    } catch (error) {
        console.error('Erreur création partie :', error);
        alert(error.message || 'Impossible de joindre le serveur. Vérifiez votre connexion.');
    } finally {
        startBtn.disabled    = false;
        startBtn.textContent = '▶ Démarrer';
    }
});

// ── Bouton Pause ───────────────────────────────────────────
document.getElementById('pauseButton').addEventListener('click', () => {
    game.togglePause();
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
document.getElementById('btn-theme').addEventListener('click', () => {
    document.body.classList.toggle('light');
});

// ── Exclusion mutuelle Hardcore / Fugace ───────────────────
document.getElementById('HardcoreMode').addEventListener('change', () => {
    if (document.getElementById('HardcoreMode').checked) {
        document.getElementById('FugaceMode').checked = false;
    }
});

document.getElementById('FugaceMode').addEventListener('change', () => {
    if (document.getElementById('FugaceMode').checked) {
        document.getElementById('HardcoreMode').checked = false;
    }
});

// ── Bouton Information ─────────────────────────────────────
const btnInfo      = document.getElementById('btn-info');
const infoModal    = document.getElementById('infoModal');
const closeInfoBtn = document.getElementById('closeInfoModal');

btnInfo.addEventListener('click', () => {
    infoModal.classList.remove('hidden');
});

closeInfoBtn.addEventListener('click', () => {
    infoModal.classList.add('hidden');
});

// Fermer en cliquant sur le fond
infoModal.addEventListener('click', (e) => {
    if (e.target === infoModal) {
        infoModal.classList.add('hidden');
    }
});

// Fermer avec la touche Échap
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !infoModal.classList.contains('hidden')) {
        infoModal.classList.add('hidden');
    }
});