import { ApiService }       from './ApiService.js';
import { DOMManager }       from './DOMManager.js';
import { imageCollections } from './ImageCollection.js';
import { DIFFICULTY_PAIRS } from './config.js';

/**
 * Classe principale gérant la logique du jeu Memory.
 *
 * Responsabilités :
 *  - Démarrer / terminer une partie
 *  - Gérer le chronomètre
 *  - Gérer le retournement des cartes et la détection des paires
 *  - Communiquer avec le serveur via ApiService
 */
export class Game {

    // ── Attributs privés ────────────────────────────────────
    /** @type {number}        */ #id;
    /** @type {string}        */ #name;
    /** @type {number}        */ #difficulty;
//  /** @type {number}        */ #GameScore = 0;
    /** @type {number}        */ #totalPairs  = 0;
    /** @type {number}        */ #foundPairs  = 0;
    /** @type {number}        */ #elapsedSecs = 0;
    /** @type {number|null}   */ #timerID     = null;
    /** @type {boolean}       */ #hardcore = false;
    /** @type {number}        */ #moveCounter = 0;
    /** @type {boolean}       */ #swapInProgress = false;

    /** Verrou : bloque les clics pendant la vérification d'une paire */
    /** @type {boolean}       */ #locked  = false;

    /** Les deux cartes actuellement retournées */
    /** @type {HTMLElement[]} */ #flipped = [];

    /** @type {DOMManager}    */ #dom = new DOMManager();

    // ── Démarrage ────────────────────────────────────────────

    /**
     * Initialise et lance une nouvelle partie.
     *
     * @param {number} id         - ID de partie (réponse du serveur)
     * @param {string} name       - Pseudo du joueur
     * @param {number} difficulty - Niveau (1 | 2 | 3)
     * @param {string} theme      - Clé de collection ('animal' | 'cars' | 'fruits')
     * @param hardcore
     */
    startGame(id, name, difficulty, theme, hardcore = false) {
        // Sauvegarde de l'état
        this.#id          = id;
        this.#name        = name;
        this.#difficulty  = difficulty;
        this.#foundPairs  = 0;
        // this.#gameScore = 0; // score de partie.
        this.#elapsedSecs = 0;
        this.#locked      = false;
        this.#flipped     = [];
        this.#hardcore = hardcore;
        this.#moveCounter = 0;

        // Nombre de paires selon la difficulté (config.js)
        this.#totalPairs = DIFFICULTY_PAIRS[difficulty] ?? 4;

        // Sélection des images de la collection choisie
        // Les collections ont 8 images : pour diff. 3 (10 paires) on boucle sur les 2 premières
        const collection = imageCollections[theme] ?? imageCollections.animals;
        const images = this.#pickImages(collection, this.#totalPairs);

        // Mise à jour de l'interface
        this.#dom.setPlayerName(name);
        this.#dom.updatePairsCounter(0, this.#totalPairs);
        this.#dom.updateTimer(0);
        this.#dom.showGame();

        // Création du plateau de cartes
        this.#dom.createCards(images, (card) => this.#onCardClick(card));

        // Lancement du chronomètre
        this.#startTimer();
    }

    // ── Fin de partie ─────────────────────────────────────────

    /**
     * Termine la partie : arrête le chrono, notifie l'API, affiche le résultat.
     *
     * @param {boolean} [won=false] - true si toutes les paires ont été trouvées
     */
    async endGame(won = false) {
        this.#stopTimer();
        this.#locked = true; // bloque tout clic pendant l'appel API

        const pairsRemaining = this.#totalPairs - this.#foundPairs;

        try {
            await ApiService.updateGameResult(this.#id, pairsRemaining);
            console.log(`Fin de partie envoyée — id: ${this.#id}, paires restantes: ${pairsRemaining}`);
        } catch (error) {
            // On affiche quand même la modale si le serveur est injoignable
            console.error('Erreur fin de partie :', error);
        }

        this.#dom.showEndModal(won, this.#elapsedSecs, this.#foundPairs, this.#totalPairs);
    }

    // ── Logique de clic ───────────────────────────────────────

    /**
     * Traite le clic sur une carte.
     * @param {HTMLElement} card
     */
    #onCardClick(card) {
        // Ignore si verrou actif, carte déjà trouvée ou déjà dans les deux retournées
        if (this.#locked)                       return;
        if (card.classList.contains('matched')) return;
        if (this.#flipped.includes(card))       return;
        if (this.#swapInProgress) return;


        this.#dom.flipCard(card);
        this.#flipped.push(card);

        if (this.#flipped.length === 2) {
            this.#checkPair();
        }
    }

    /**
     * Vérifie si les deux cartes retournées forment une paire
     * en comparant leur attribut data-image-id.
     */
    #checkPair() {
        this.#locked = true;
        const [cardA, cardB] = this.#flipped;

        // Chaque paire de cartes retournées = 1 coup
        this.#moveCounter++;

        // Mode Hardcore : swap toutes les 2 tentatives
        if (this.#hardcore && this.#moveCounter === 2) {
            this.#moveCounter = 0;

            // attendre la fin du flip avant de swap
            // attendre la fin réelle de l’animation de flip
            const waitForFlipEnd = () => {
                cardB.querySelector(".card-inner").removeEventListener("transitionend", waitForFlipEnd);
                this.#swapTwoCards();
            };

            cardB.querySelector(".card-inner").addEventListener("transitionend", waitForFlipEnd);

        }

        if (cardA.dataset.imageId === cardB.dataset.imageId) {
            // ✅ Paire trouvée
            this.#dom.lockCard(cardA);
            this.#dom.lockCard(cardB);
            this.#foundPairs++;
            this.#dom.updatePairsCounter(this.#foundPairs, this.#totalPairs);
            this.#flipped = [];
            this.#locked  = false;

            // Victoire si toutes les paires sont découvertes
            if (this.#foundPairs === this.#totalPairs) {
                this.endGame(true);
            }
        } else {
            // ❌ Pas de paire : retourne les cartes après 1 seconde (consigne du sujet)
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
    #swapTwoCards() {
        this.#swapInProgress = true;
        this.#locked = true;

        const cards = Array.from(document.querySelectorAll('.card'))
            .filter(c => !c.classList.contains('matched'));

        if (cards.length < 2) {
            this.#swapInProgress = false;
            this.#locked = false;
            return;
        }

        const a = cards[Math.floor(Math.random() * cards.length)];
        let b = cards[Math.floor(Math.random() * cards.length)];

        while (b === a) {
            b = cards[Math.floor(Math.random() * cards.length)];
        }

        a.classList.add("shake");
        b.classList.add("shake");

        setTimeout(() => {
            a.classList.remove("shake");
            b.classList.remove("shake");

            const parent = a.parentNode;
            const aNext = a.nextSibling;

            parent.insertBefore(a, b);
            parent.insertBefore(b, aNext);

            setTimeout(() => {
                this.#swapInProgress = false;
                this.#locked = false;
            }, 150);

        }, 400);
    }



    // ── Chronomètre ──────────────────────────────────────────

    #startTimer() {
        this.#stopTimer(); // évite les doublons si on relance sans recharger
        this.#timerID = setInterval(() => {
            this.#elapsedSecs++;
            this.#dom.updateTimer(this.#elapsedSecs);
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
     * Retourne exactement `count` images depuis la collection.
     * Si la collection a moins d'images que 'count', elle boucle sur le début
     * en changeant l'id pour que les paires restent distinctes.
     *
     * @param {import('./types.js').Image[]} collection
     * @param {number} count
     * @returns {import('./types.js').Image[]}
     */
    #pickImages(collection, count) {
        const result = [];
        for (let i = 0; i < count; i++) {
            const src = collection[i % collection.length];
            result.push({
                id:   i + 1,           // id unique pour chaque paire
                name: src.name,
                url:  src.url,
            });
        }
        return result;
    }

    // ── Getter ────────────────────────────────────────────────

    /** @returns {number} Paires restant à trouver */
    get pairsRemaining() {
        return this.#totalPairs - this.#foundPairs;
    }
}
