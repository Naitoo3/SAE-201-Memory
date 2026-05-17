/**
 * Gère toutes les interactions avec le DOM :
 * création des cartes, affichage/masquage des panneaux,
 * chronomètre, compteur de paires, modale de fin, overlay de pause.
 **/
export class DOMManager {

    // ── Références DOM ───────────────────────────────────────
    #setupPanel  = document.getElementById('setupPanel');
    #gamePanel   = document.getElementById('gamePanel');
    #gameBoard   = document.getElementById('gameBoard');
    #timerEl     = document.getElementById('gameTimer');
    #pairsEl     = document.getElementById('pairsCounter');
    #playerLabel = document.getElementById('playerLabel');
    #endModal    = document.getElementById('endModal');
    #pauseOverlay = document.getElementById('pauseOverlay');
    #pauseBtn    = document.getElementById('pauseButton');

    // ── Visibilité des panneaux ──────────────────────────────

    /** Affiche la zone de jeu et cache le formulaire. */
    showGame() {
        this.#setupPanel.classList.add('hidden');
        this.#gamePanel.classList.remove('hidden');
    }

    /** Affiche le formulaire et cache la zone de jeu. **/
    showSetup() {
        this.#gamePanel.classList.add('hidden');
        this.#setupPanel.classList.remove('hidden');
    }

    // ── En-tête de jeu ───────────────────────────────────────

    /**
     * Affiche le pseudo du joueur dans l'en-tête de jeu.
     * @param {string} name
     **/
    setPlayerName(name) {
        this.#playerLabel.textContent = `👤 ${name}`;
    }

    // ── Chronomètre ──────────────────────────────────────────

    /**
     * Met à jour l'affichage du temps au format mm:ss.
     * @param {number} seconds
     **/
    updateTimer(seconds) {
        const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
        const ss = String(seconds % 60).padStart(2, '0');
        this.#timerEl.textContent = `${mm}:${ss}`;
    }

    // ── Compteur de paires ───────────────────────────────────

    /**
     * @param {number} found - Paires trouvées
     * @param {number} total - Paires totales
     **/
    updatePairsCounter(found, total) {
        this.#pairsEl.textContent = `Paires : ${found} / ${total}`;
    }

    // ── Pause ────────────────────────────────────────────────

    /**
     * Affiche l'overlay de pause par-dessus le plateau.
     * Les cartes deviennent invisibles tant que la pause est active.
     */
    showPauseOverlay() {
        this.#pauseOverlay.classList.remove('hidden');
    }

    /** Cache l'overlay de pause. */
    hidePauseOverlay() {
        this.#pauseOverlay.classList.add('hidden');
    }

    /**
     * Met à jour l'icône et le title du bouton pause selon l'état.
     * @param {boolean} isPaused
     */
    setPauseButton(isPaused) {
        if (!this.#pauseBtn) return;
        this.#pauseBtn.textContent = isPaused ? '▶ Reprendre' : '⏸ Pause';
    }

    // ── Création des cartes ──────────────────────────────────

    /**
     * Vide le plateau, crée et insère toutes les cartes mélangées.
     *
     * @param {import('./types.js').Image[]} images  - Une image par paire souhaitée
     * @param {(card: HTMLElement) => void}  onClick - Callback de clic
     */
    createCards(images, onClick) {
        this.#gameBoard.innerHTML = '';

        if (images.length * 2 > 16) {
            this.#gameBoard.classList.add('cols-5');
        } else {
            this.#gameBoard.classList.remove('cols-5');
        }

        const deck = this.#shuffle([...images, ...images]);

        deck.forEach((image) => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.dataset.imageId = image.id;

            card.innerHTML = `
        <div class="card-inner">
          <div class="card-front">
            <img src="assets/images/mask1.jpg" alt="Carte cachée">
          </div>
          <div class="card-back">
            <img src="${image.url}" alt="${image.name}">
          </div>
        </div>`;

            card.addEventListener('click', () => onClick(card));
            this.#gameBoard.appendChild(card);
        });
    }

    // ── État des cartes ──────────────────────────────────────

    /** Retourne une carte (révèle sa face image). */
    flipCard(card)   { card.classList.add('flip'); }

    /** Cache une carte (remet face cachée). */
    unflipCard(card) { card.classList.remove('flip'); }

    /**
     * Marque une carte comme définitivement trouvée.
     * Désactive le curseur pointer.
     */
    lockCard(card) {
        card.classList.add('matched');
        card.style.cursor = 'default';
    }

    // ── Modale de fin de partie ──────────────────────────────

    /**
     * Affiche la modale avec le résultat de la partie.
     * @param {boolean} won     - true = victoire, false = abandon/timeout
     * @param {number}  seconds - Temps écoulé en secondes
     * @param {number}  found   - Paires trouvées
     * @param {number}  total   - Paires totales
     */
    showEndModal(won, seconds, found, total) {
        const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
        const ss = String(seconds % 60).padStart(2, '0');
        const LoseSound = new Audio('./assets/sounds/lose.wav');
        const WinSound  = new Audio('./assets/sounds/win.wav');

        document.getElementById('modalIcon').textContent = won ? '🎉' : '😔';

        if (won) {
            document.getElementById('modalTitle').textContent = 'Bravo !';
            WinSound.play();
        } else {
            document.getElementById('modalTitle').textContent = 'Vous avez perdu !';
            LoseSound.play();
        }

        document.getElementById('modalBody').textContent = won
            ? `Toutes les paires trouvées en ${mm}:${ss} !`
            : `${found} paire(s) trouvée(s) sur ${total} en ${mm}:${ss}.`;

        this.#endModal.classList.remove('hidden');
    }

    /** Cache la modale de fin de partie. */
    hideEndModal() {
        this.#endModal.classList.add('hidden');
    }

    // ── Utilitaire privé ─────────────────────────────────────

    /**
     * Algorithme de mélange Fisher-Yates.
     * @template T
     * @param {T[]} arr - Tableau source (non modifié)
     * @returns {T[]}   - Nouvelle copie mélangée
     **/
    #shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }
}
