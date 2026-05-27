import { ApiService }       from './ApiService.js';
import { DOMManager }       from './DOMManager.js';
import { imageCollections } from './ImageCollection.js';
import { DIFFICULTY_PAIRS, DIFFICULTY_TIME, FUGACE_REVEAL_TIME } from './config.js';

/**
 * Classe principale gérant la logique du jeu Memory.
 *
 * Responsabilités :
 *  - Démarrer / terminer une partie
 *  - Gérer le chronomètre
 *  - Gérer le retournement des cartes et la détection des paires
 *  - Communiquer avec le serveur via ApiService
 **/
export class Game {

    // ── Attributs privés ────────────────────────────────────
    /** @type {number}        */ #id;
    /** @type {string}        */ #name;
    /** @type {number}        */ #difficulty;
    /** @type {number}        */ #totalPairs      = 0;
    /** @type {number}        */ #foundPairs      = 0;
    /** @type {number}        */ #elapsedSecs     = 0;
    /** @type {number|null}   */ #timerID         = null;
    /** @type {boolean}       */ #hardcore        = false;
    /** @type {number}        */ #moveCounter     = 0;
    /** @type {boolean}       */ #swapInProgress  = false;
    /** @type {boolean}       */ #locked          = false;
    /** @type {boolean}       */ #paused          = false;
    /** @type {HTMLElement[]} */ #flipped         = [];
    /** @type {DOMManager}    */ #dom             = new DOMManager();
    /** @type {boolean}       */ #fugace          = false;
    /** @type {boolean}       */ #fugacePhaseActive = false; // true pendant les 3s de révélation

    // ── Démarrage ────────────────────────────────────────────

    /**
     * Initialise et lance une nouvelle partie.
     *
     * @param {number}  id         - ID de partie (réponse du serveur)
     * @param {string}  name       - Pseudo du joueur
     * @param {number}  difficulty - Niveau (1 | 2 | 3)
     * @param {string}  theme      - Clé de collection ('animals' | 'cars' | 'fruits')
     * @param {boolean} hardcore   - Activation mode hardcore
     * @param {boolean} fugace     - Activation mode memory fugace
     */
    startGame(id, name, difficulty, theme, hardcore = false, fugace = false) {
        this.#id               = id;
        this.#name             = name;
        this.#difficulty       = difficulty;
        this.#foundPairs       = 0;
        this.#elapsedSecs      = 0;
        this.#locked           = false;
        this.#paused           = false;
        this.#flipped          = [];
        this.#hardcore         = hardcore;
        this.#moveCounter      = 0;
        this.#fugace           = fugace;
        this.#fugacePhaseActive = false;

        this.#totalPairs  = DIFFICULTY_PAIRS[difficulty] ?? 4;
        this.#elapsedSecs = DIFFICULTY_TIME[difficulty]  ?? 30;

        const collection = imageCollections[theme] ?? imageCollections.animals;
        const images     = this.#pickImages(collection, this.#totalPairs);

        this.#dom.setPlayerName(name);
        this.#dom.updatePairsCounter(0, this.#totalPairs);
        this.#dom.updateTimer(this.#elapsedSecs);
        this.#dom.showGame();
        this.#dom.setPauseButton(false);
        this.#dom.createCards(images, (card) => this.#onCardClick(card));

        if (this.#fugace) {
            this.#startFugacePhase();
        } else {
            this.#startTimer();
        }
    }

    // ── Pause ─────────────────────────────────────────────────

    /**
     * Bascule l'état de pause.
     * Bloquée pendant la phase Fugace.
     */
    togglePause() {
        if (this.#fugacePhaseActive) {
            this.#dom.showFugacePauseWarning();
            return;
        }

        this.#paused = !this.#paused;

        if (this.#paused) {
            this.#stopTimer();
            this.#dom.showPauseOverlay();
            this.#dom.setPauseButton(true);
        } else {
            this.#startTimer();
            this.#dom.hidePauseOverlay();
            this.#dom.setPauseButton(false);
        }
    }

    // ── Fin de partie ─────────────────────────────────────────

    /**
     * Termine la partie : arrête le chrono, notifie l'API, affiche le résultat.
     *
     * @param {boolean} [won=false]        - true si toutes les paires ont été trouvées
     * @param {string}  [reason='abandon'] - 'abandon' | 'timeout'
     */
    async endGame(won = false, reason = 'abandon') {
        this.#stopTimer();
        this.#locked = true;
        this.#paused = false;
        this.#dom.hidePauseOverlay();

        const pairsRemaining = this.#totalPairs - this.#foundPairs;
        const timeUsed       = (DIFFICULTY_TIME[this.#difficulty] ?? 60) - this.#elapsedSecs;

        try {
            await ApiService.updateGameResult(this.#id, pairsRemaining);
            console.log(`Fin de partie envoyée — id: ${this.#id}, paires restantes: ${pairsRemaining}`);
        } catch (error) {
            console.error('Erreur fin de partie :', error);
        }

        this.#dom.showEndModal(won, timeUsed, this.#foundPairs, this.#totalPairs, reason);
    }

    // ── Logique de clic ───────────────────────────────────────

    /** @param {HTMLElement} card */
    #onCardClick(card) {
        if (this.#locked)                        return;
        if (this.#paused)                        return;
        if (this.#fugacePhaseActive)             return;
        if (card.classList.contains('matched'))  return;
        if (this.#flipped.includes(card))        return;
        if (this.#swapInProgress)                return;

        this.#dom.flipCard(card);
        this.#flipped.push(card);

        if (this.#flipped.length === 2) {
            this.#checkPair();
        }
    }

    #checkPair() {
        this.#locked = true;
        const [cardA, cardB] = this.#flipped;

        this.#moveCounter++;

        // Mode Hardcore : swap toutes les 2 tentatives
        if (this.#hardcore && this.#moveCounter === 2) {
            this.#moveCounter = 0;
            const waitForFlipEnd = () => {
                cardB.querySelector('.card-inner').removeEventListener('transitionend', waitForFlipEnd);
                this.#swapTwoCards();
            };
            cardB.querySelector('.card-inner').addEventListener('transitionend', waitForFlipEnd);
        }

        if (cardA.dataset.imageId === cardB.dataset.imageId) {
            // Paire trouvée
            this.#dom.lockCard(cardA);
            this.#dom.lockCard(cardB);
            this.#foundPairs++;
            this.#dom.updatePairsCounter(this.#foundPairs, this.#totalPairs);
            this.#flipped = [];
            this.#locked  = false;

            if (this.#foundPairs === this.#totalPairs) {
                this.endGame(true);
            }
        } else {
            if (this.#fugace) {
                // Mode Fugace : une seule erreur = partie perdue
                setTimeout(() => {
                    this.#dom.unflipCard(cardA);
                    this.#dom.unflipCard(cardB);
                    this.#flipped = [];
                    this.endGame(false, 'fugace');
                }, 1000);
            } else {
                setTimeout(() => {
                    this.#dom.unflipCard(cardA);
                    this.#dom.unflipCard(cardB);
                    this.#flipped = [];
                    if (!this.#swapInProgress) {
                        this.#locked = false;
                    }
                }, 1000);
            }
        }
    }

    #swapTwoCards() {
        this.#swapInProgress = true;
        this.#locked         = true;

        const cards = Array.from(document.querySelectorAll('.card'))
            .filter(c => !c.classList.contains('matched'));

        if (cards.length < 2) {
            this.#swapInProgress = false;
            this.#locked         = false;
            return;
        }

        const a = cards[Math.floor(Math.random() * cards.length)];
        let   b = cards[Math.floor(Math.random() * cards.length)];
        while (b === a) b = cards[Math.floor(Math.random() * cards.length)];

        a.classList.add('shake');
        b.classList.add('shake');

        setTimeout(() => {
            a.classList.remove('shake');
            b.classList.remove('shake');

            const parent = a.parentNode;
            const aNext  = a.nextSibling;
            b.before(a);
            parent.insertBefore(b, aNext);

            setTimeout(() => {
                this.#swapInProgress = false;
                this.#locked         = false;
            }, 150);
        }, 400);
    }

    // ── Mode Fugace ───────────────────────────────────────────

    #startFugacePhase() {
        this.#fugacePhaseActive = true;
        this.#locked            = true;

        const allCards = document.querySelectorAll('.card');
        allCards.forEach(card => this.#dom.flipCard(card));

        let remaining = FUGACE_REVEAL_TIME;
        this.#dom.showFugaceOverlay(remaining);

        const interval = setInterval(() => {
            remaining--;
            if (remaining > 0) {
                this.#dom.updateFugaceCountdown(remaining);
            } else {
                clearInterval(interval);
                this.#dom.hideFugaceOverlay();

                allCards.forEach(card => this.#dom.unflipCard(card));

                this.#fugacePhaseActive = false;
                this.#locked            = false;
                this.#dom.resetPauseButton();
                this.#startTimer();
            }
        }, 1000);
    }

    // ── Chronomètre ──────────────────────────────────────────

    #startTimer() {
        this.#stopTimer();
        this.#timerID = setInterval(() => {
            this.#elapsedSecs--;
            this.#dom.updateTimer(this.#elapsedSecs);
            if (this.#elapsedSecs <= 0) {
                this.endGame(false, 'timeout');
            }
        }, 1000);
    }

    #stopTimer() {
        if (this.#timerID !== null) {
            clearInterval(this.#timerID);
            this.#timerID = null;
        }
    }

    // ── Sélection des images ──────────────────────────────────

    /**
     * @param {import('./types.js').Image[]} collection
     * @param {number} count
     * @returns {import('./types.js').Image[]}
     */
    #pickImages(collection, count) {
        const result = [];
        for (let i = 0; i < count; i++) {
            const src = collection[i % collection.length];
            result.push({ id: i + 1, name: src.name, url: src.url });
        }
        return result;
    }

    // ── Getter ────────────────────────────────────────────────

    /** @returns {number} Paires restant à trouver */
    get pairsRemaining() {
        return this.#totalPairs - this.#foundPairs;
    }
}