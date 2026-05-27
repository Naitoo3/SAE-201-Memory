/**
 * Gère toutes les interactions avec le DOM :
 * création des cartes, affichage/masquage des panneaux,
 * chronomètre, compteur de paires, modale de fin.
 **/
export class DOMManager {

    // ── Références DOM ───────────────────────────────────────
    #setupPanel      = document.getElementById('setupPanel');
    #gamePanel       = document.getElementById('gamePanel');
    #gameBoard       = document.getElementById('gameBoard');
    #timerEl         = document.getElementById('gameTimer');
    #pairsEl         = document.getElementById('pairsCounter');
    #playerLabel     = document.getElementById('playerLabel');
    #endModal        = document.getElementById('endModal');
    #pauseOverlay    = document.getElementById('pauseOverlay');
    #pauseBtn        = document.getElementById('pauseButton');
    #fugaceOverlay   = document.getElementById('fugaceOverlay');
    #fugaceCountdown = document.getElementById('fugaceCountdown');

    // ── Visibilité des panneaux ──────────────────────────────

    /** Affiche la zone de jeu et cache le formulaire. */
    showGame() {
        this.#setupPanel.classList.add('hidden');
        this.#gamePanel.classList.remove('hidden');
    }

    /** Affiche le formulaire et cache la zone de jeu. */
    showSetup() {
        this.#gamePanel.classList.add('hidden');
        this.#setupPanel.classList.remove('hidden');
    }

    // ── En-tête de jeu ───────────────────────────────────────

    /** @param {string} name */
    setPlayerName(name) {
        this.#playerLabel.textContent = `👤 ${name}`;
    }

    // ── Chronomètre ──────────────────────────────────────────

    /** @param {number} seconds */
    updateTimer(seconds) {
        const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
        const ss = String(seconds % 60).padStart(2, '0');
        this.#timerEl.textContent = `${mm}:${ss}`;
    }

    // ── Compteur de paires ───────────────────────────────────

    /**
     * @param {number} found
     * @param {number} total
     */
    updatePairsCounter(found, total) {
        this.#pairsEl.textContent = `Paires : ${found} / ${total}`;
    }

    // ── Pause ────────────────────────────────────────────────

    showPauseOverlay() {
        this.#pauseOverlay.classList.remove('hidden');
    }

    hidePauseOverlay() {
        this.#pauseOverlay.classList.add('hidden');
    }

    /** @param {boolean} isPaused */
    setPauseButton(isPaused) {
        if (!this.#pauseBtn) return;
        this.#pauseBtn.textContent = isPaused ? '▶ Reprendre' : '⏸ Pause';
        this.#pauseBtn.disabled    = false;
    }

    /**
     * Désactive le bouton pause pendant la phase Fugace.
     */
    showFugacePauseWarning() {
        if (!this.#pauseBtn) return;
        this.#pauseBtn.textContent = '⚠️ Impossible pendant le mode Fugace';
        this.#pauseBtn.disabled    = true;
    }

    /** Réactive le bouton pause une fois la phase Fugace terminée. */
    resetPauseButton() {
        if (!this.#pauseBtn) return;
        this.#pauseBtn.textContent = '⏸ Pause';
        this.#pauseBtn.disabled    = false;
    }

    // ── Overlay Fugace ───────────────────────────────────────

    /** @param {number} seconds */
    showFugaceOverlay(seconds) {
        this.#fugaceCountdown.textContent = seconds;
        this.#fugaceOverlay.classList.remove('hidden');
    }

    /** @param {number} seconds */
    updateFugaceCountdown(seconds) {
        this.#fugaceCountdown.textContent = seconds;
    }

    hideFugaceOverlay() {
        this.#fugaceOverlay.classList.add('hidden');
    }

    // ── Création des cartes ──────────────────────────────────

    /**
     * @param {import('./types.js').Image[]} images
     * @param {(card: HTMLElement) => void}  onClick
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

    flipCard(card)   { card.classList.add('flip'); }
    unflipCard(card) { card.classList.remove('flip'); }

    lockCard(card) {
        card.classList.add('matched');
        card.style.cursor = 'default';
    }

    // ── Modale de fin de partie ──────────────────────────────

    /**
     * @param {boolean} won
     * @param {number}  seconds  - Temps utilisé
     * @param {number}  found
     * @param {number}  total
     * @param {string}  [reason='abandon'] - 'abandon' | 'timeout' | 'fugace'
     */
    showEndModal(won, seconds, found, total, reason = 'abandon') {
        const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
        const ss = String(seconds % 60).padStart(2, '0');

        const loseSound = new Audio('./assets/sounds/lose.wav');
        const winSound  = new Audio('./assets/sounds/win.wav');

        if (won) {
            document.getElementById('modalIcon').textContent  = '🎉';
            document.getElementById('modalTitle').textContent = 'Bravo !';
            winSound.play();
        } else if (reason === 'timeout') {
            document.getElementById('modalIcon').textContent  = '⏰';
            document.getElementById('modalTitle').textContent = 'Temps écoulé !';
            loseSound.play();
        } else if (reason === 'fugace') {
            document.getElementById('modalIcon').textContent  = '👁️';
            document.getElementById('modalTitle').textContent = 'Erreur en mode Fugace !';
            loseSound.play();
        } else {
            document.getElementById('modalIcon').textContent  = '😔';
            document.getElementById('modalTitle').textContent = 'Vous avez abandonné !';
            loseSound.play();
        }

        document.getElementById('modalBody').textContent = won
            ? `Toutes les paires trouvées en ${mm}:${ss} !`
            : `${found} paire(s) trouvée(s) sur ${total} en ${mm}:${ss}.`;

        this.#endModal.classList.remove('hidden');
    }

    hideEndModal() {
        this.#endModal.classList.add('hidden');
    }

    // ── Utilitaire privé ─────────────────────────────────────

    #shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }
}