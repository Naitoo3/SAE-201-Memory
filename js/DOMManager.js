/**
 * Gère toutes les interactions avec le DOM :
 * création des cartes, affichage/masquage des panneaux,
 * chronomètre, compteur de paires, modale de fin.
 */
export class DOMManager {

    // ── Références DOM ───────────────────────────────────────
    #setupPanel  = document.getElementById('setupPanel');
    #gamePanel   = document.getElementById('gamePanel');
    #gameBoard   = document.getElementById('gameBoard');
    #timerEl     = document.getElementById('gameTimer');
    #pairsEl     = document.getElementById('pairsCounter');
    #playerLabel = document.getElementById('playerLabel');
    #endModal    = document.getElementById('endModal');

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

    /**
     * Affiche le pseudo du joueur dans l'en-tête de jeu.
     * @param {string} name
     * @return none
     */
    setPlayerName(name) {
        this.#playerLabel.textContent = `👤 ${name}`;
    }

    // ── Chronomètre ──────────────────────────────────────────

    /**
     * Met à jour l'affichage du temps au format mm:ss.
     * @param {number} seconds
     */
    updateTimer(seconds) {
        const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
        const ss = String(seconds % 60).padStart(2, '0');
        this.#timerEl.textContent = `${mm}:${ss}`;
    }


    // ── Compteur de paires ───────────────────────────────────

    /**
     * @param {number} found - Paires trouvées
     * @param {number} total - Paires totales
     */
    updatePairsCounter(found, total) {
        this.#pairsEl.textContent = `Paires : ${found} / ${total}`;
    }

    // ── Création des cartes ──────────────────────────────────

    /**
     * Vide le plateau, crée et insère toutes les cartes mélangées.
     *
     * Chaque image est doublée pour former une paire.
     * Le chemin du masque est relatif à index.html (racine du projet).
     *
     * @param {import('./types.js').Image[]} images  - Une image par paire souhaitée
     * @param {(card: HTMLElement) => void}  onClick - Callback de clic
     */
    createCards(images, onClick) {
        this.#gameBoard.innerHTML = '';

        // Grille 5 colonnes au-delà de 16 cartes (diff. 3 → 20 cartes)
        if (images.length * 2 > 16) {
            this.#gameBoard.classList.add('cols-5');
        } else {
            this.#gameBoard.classList.remove('cols-5');
        }

        // Duplique chaque image pour former les paires, puis mélange
        const deck = this.#shuffle([...images, ...images]);

        deck.forEach((image) => {
            const card = document.createElement('div');
            card.classList.add('card');
            // data-image-id sert à comparer les deux cartes retournées
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
     * @param {boolean} won     - true = victoire, false = abandon
     * @param {number}  seconds - Temps total en secondes
     * @param {number}  found   - Paires trouvées
     * @param {number}  total   - Paires totales
     */
    showEndModal(won, seconds, found, total) {
        const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
        const ss = String(seconds % 60).padStart(2, '0');

        document.getElementById('modalIcon').textContent  = won ? '🎉' : '😔';
        document.getElementById('modalTitle').textContent = won ? 'Bravo !' : 'Partie abandonnée';
        document.getElementById('modalBody').textContent  = won
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
     * Mélange un tableau en place (Fisher-Yates) et retourne une copie.
     * @template T
     * @param {T[]} arr
     * @returns {T[]}
     */
    // TODO: FAIRE LA DOC DU SHUFFLE
    #shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }
}
