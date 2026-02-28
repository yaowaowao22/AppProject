import type { CardType, FreeCellGameState, Suit, Rank, FreeCellSelection } from '../types';

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function getSuitSymbol(suit: Suit): string {
  switch (suit) {
    case 'spades': return '\u2660';
    case 'hearts': return '\u2665';
    case 'diamonds': return '\u2666';
    case 'clubs': return '\u2663';
  }
}

export function isRedSuit(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}

export function getRankValue(rank: Rank): number {
  return RANKS.indexOf(rank) + 1;
}

function createDeck(): CardType[] {
  const deck: CardType[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        suit,
        rank,
        faceUp: true,
        id: `${suit}-${rank}`,
      });
    }
  }
  return deck;
}

function shuffleDeck(deck: CardType[]): CardType[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function createNewGame(): FreeCellGameState {
  const deck = shuffleDeck(createDeck());
  const tableau: CardType[][] = [];
  let deckIndex = 0;

  // 8 columns: first 4 get 7 cards, last 4 get 6 cards
  for (let col = 0; col < 8; col++) {
    const cardCount = col < 4 ? 7 : 6;
    const pile: CardType[] = [];
    for (let row = 0; row < cardCount; row++) {
      pile.push({ ...deck[deckIndex], faceUp: true });
      deckIndex++;
    }
    tableau.push(pile);
  }

  return {
    tableau,
    foundations: [[], [], [], []],
    freeCells: [null, null, null, null],
  };
}

export function cloneGameState(state: FreeCellGameState): FreeCellGameState {
  return {
    tableau: state.tableau.map((pile) => pile.map((c) => ({ ...c }))),
    foundations: state.foundations.map((pile) => pile.map((c) => ({ ...c }))),
    freeCells: state.freeCells.map((c) => (c ? { ...c } : null)),
  };
}

function countEmptyFreeCells(state: FreeCellGameState): number {
  return state.freeCells.filter((c) => c === null).length;
}

function countEmptyTableauColumns(state: FreeCellGameState): number {
  return state.tableau.filter((pile) => pile.length === 0).length;
}

// Max cards movable = (1 + empty free cells) * 2^(empty columns)
// If moving to an empty column, that column doesn't count
export function maxMovableCards(
  state: FreeCellGameState,
  destIsEmptyColumn: boolean
): number {
  const emptyFreeCells = countEmptyFreeCells(state);
  let emptyColumns = countEmptyTableauColumns(state);
  if (destIsEmptyColumn && emptyColumns > 0) {
    emptyColumns -= 1;
  }
  return (1 + emptyFreeCells) * Math.pow(2, emptyColumns);
}

function isValidTableauSequence(cards: CardType[]): boolean {
  for (let i = 1; i < cards.length; i++) {
    const prev = cards[i - 1];
    const curr = cards[i];
    if (isRedSuit(prev.suit) === isRedSuit(curr.suit)) return false;
    if (getRankValue(prev.rank) - getRankValue(curr.rank) !== 1) return false;
  }
  return true;
}

function canPlaceOnTableau(card: CardType, targetPile: CardType[]): boolean {
  if (targetPile.length === 0) return true;
  const topCard = targetPile[targetPile.length - 1];
  const cardIsRed = isRedSuit(card.suit);
  const topIsRed = isRedSuit(topCard.suit);
  if (cardIsRed === topIsRed) return false;
  return getRankValue(topCard.rank) - getRankValue(card.rank) === 1;
}

function canPlaceOnFoundation(card: CardType, foundationPile: CardType[]): boolean {
  if (foundationPile.length === 0) {
    return card.rank === 'A';
  }
  const topCard = foundationPile[foundationPile.length - 1];
  if (card.suit !== topCard.suit) return false;
  return getRankValue(card.rank) - getRankValue(topCard.rank) === 1;
}

export function moveCards(
  state: FreeCellGameState,
  selection: FreeCellSelection,
  destType: 'tableau' | 'foundation' | 'freecell',
  destPileIndex: number
): FreeCellGameState | null {
  const newState = cloneGameState(state);

  let cardsToMove: CardType[] = [];

  if (selection.source === 'freecell') {
    const card = newState.freeCells[selection.pileIndex];
    if (!card) return null;
    cardsToMove = [card];
  } else if (selection.source === 'tableau') {
    const sourcePile = newState.tableau[selection.pileIndex];
    if (selection.cardIndex < 0 || selection.cardIndex >= sourcePile.length) return null;
    cardsToMove = sourcePile.slice(selection.cardIndex);
  } else if (selection.source === 'foundation') {
    const sourcePile = newState.foundations[selection.pileIndex];
    if (sourcePile.length === 0) return null;
    cardsToMove = [sourcePile[sourcePile.length - 1]];
  } else {
    return null;
  }

  if (cardsToMove.length === 0) return null;

  if (destType === 'freecell') {
    if (cardsToMove.length !== 1) return null;
    if (newState.freeCells[destPileIndex] !== null) return null;

    // Remove from source
    if (selection.source === 'freecell') {
      newState.freeCells[selection.pileIndex] = null;
    } else if (selection.source === 'tableau') {
      newState.tableau[selection.pileIndex].splice(selection.cardIndex, 1);
    } else if (selection.source === 'foundation') {
      newState.foundations[selection.pileIndex].pop();
    }

    newState.freeCells[destPileIndex] = { ...cardsToMove[0] };
    return newState;
  }

  if (destType === 'foundation') {
    if (cardsToMove.length !== 1) return null;
    const card = cardsToMove[0];
    const foundationPile = newState.foundations[destPileIndex];
    if (!canPlaceOnFoundation(card, foundationPile)) return null;

    // Remove from source
    if (selection.source === 'freecell') {
      newState.freeCells[selection.pileIndex] = null;
    } else if (selection.source === 'tableau') {
      newState.tableau[selection.pileIndex].splice(selection.cardIndex, 1);
    } else if (selection.source === 'foundation') {
      newState.foundations[selection.pileIndex].pop();
    }

    foundationPile.push({ ...card, faceUp: true });
    return newState;
  }

  if (destType === 'tableau') {
    const targetPile = newState.tableau[destPileIndex];

    // Validate sequence
    if (cardsToMove.length > 1 && !isValidTableauSequence(cardsToMove)) return null;

    // Check placement validity
    if (!canPlaceOnTableau(cardsToMove[0], targetPile)) return null;

    // Check max movable
    const destIsEmpty = targetPile.length === 0;
    const maxCards = maxMovableCards(state, destIsEmpty);
    if (cardsToMove.length > maxCards) return null;

    // Remove from source
    if (selection.source === 'freecell') {
      newState.freeCells[selection.pileIndex] = null;
    } else if (selection.source === 'tableau') {
      newState.tableau[selection.pileIndex].splice(selection.cardIndex, cardsToMove.length);
    } else if (selection.source === 'foundation') {
      newState.foundations[selection.pileIndex].pop();
    }

    for (const card of cardsToMove) {
      targetPile.push({ ...card, faceUp: true });
    }
    return newState;
  }

  return null;
}

export function checkWin(state: FreeCellGameState): boolean {
  return state.foundations.every((pile) => pile.length === 13);
}

export function canAutoComplete(state: FreeCellGameState): boolean {
  // All free cells empty and all tableau cards in descending order
  if (state.freeCells.some((c) => c !== null)) return false;
  for (const pile of state.tableau) {
    for (let i = 1; i < pile.length; i++) {
      if (getRankValue(pile[i - 1].rank) - getRankValue(pile[i].rank) !== 1) return false;
      if (pile[i - 1].suit !== pile[i].suit) return false;
    }
  }
  return true;
}

export function autoCompleteStep(state: FreeCellGameState): FreeCellGameState | null {
  const newState = cloneGameState(state);

  // Try to move from free cells to foundations
  for (let fc = 0; fc < 4; fc++) {
    const card = newState.freeCells[fc];
    if (!card) continue;
    for (let f = 0; f < 4; f++) {
      if (canPlaceOnFoundation(card, newState.foundations[f])) {
        newState.freeCells[fc] = null;
        newState.foundations[f].push({ ...card, faceUp: true });
        return newState;
      }
    }
  }

  // Try to move from tableau bottom cards to foundations
  for (let t = 0; t < 8; t++) {
    const pile = newState.tableau[t];
    if (pile.length === 0) continue;
    const card = pile[pile.length - 1];
    for (let f = 0; f < 4; f++) {
      if (canPlaceOnFoundation(card, newState.foundations[f])) {
        pile.pop();
        newState.foundations[f].push({ ...card, faceUp: true });
        return newState;
      }
    }
  }

  return null;
}

// Safe auto-complete: move card to foundation only if it won't block anything
export function safeAutoCompleteStep(state: FreeCellGameState): FreeCellGameState | null {
  const newState = cloneGameState(state);

  const canSafelyMove = (card: CardType): boolean => {
    // Aces and 2s are always safe
    if (card.rank === 'A' || card.rank === '2') return true;
    // Safe if both opposite-color suits' foundations have rank >= this card's rank - 1
    const cardVal = getRankValue(card.rank);
    const isRed = isRedSuit(card.suit);
    for (let f = 0; f < 4; f++) {
      const pile = newState.foundations[f];
      if (pile.length === 0) {
        // This foundation is empty; check if it's opposite color
        const fSuit = SUITS[f];
        if (isRedSuit(fSuit) !== isRed) return false;
        continue;
      }
      const fSuit = pile[0].suit;
      if (isRedSuit(fSuit) !== isRed) {
        const fVal = getRankValue(pile[pile.length - 1].rank);
        if (fVal < cardVal - 1) return false;
      }
    }
    return true;
  };

  // Try free cells
  for (let fc = 0; fc < 4; fc++) {
    const card = newState.freeCells[fc];
    if (!card) continue;
    if (!canSafelyMove(card)) continue;
    for (let f = 0; f < 4; f++) {
      if (canPlaceOnFoundation(card, newState.foundations[f])) {
        newState.freeCells[fc] = null;
        newState.foundations[f].push({ ...card, faceUp: true });
        return newState;
      }
    }
  }

  // Try tableau
  for (let t = 0; t < 8; t++) {
    const pile = newState.tableau[t];
    if (pile.length === 0) continue;
    const card = pile[pile.length - 1];
    if (!canSafelyMove(card)) continue;
    for (let f = 0; f < 4; f++) {
      if (canPlaceOnFoundation(card, newState.foundations[f])) {
        pile.pop();
        newState.foundations[f].push({ ...card, faceUp: true });
        return newState;
      }
    }
  }

  return null;
}

export function getValidFoundationIndex(
  state: FreeCellGameState,
  card: CardType
): number {
  for (let f = 0; f < 4; f++) {
    if (canPlaceOnFoundation(card, state.foundations[f])) {
      return f;
    }
  }
  return -1;
}

export function hasAnyValidMove(state: FreeCellGameState): boolean {
  const emptyFreeCellExists = state.freeCells.some((c) => c === null);

  // From free cells
  for (let fc = 0; fc < 4; fc++) {
    const card = state.freeCells[fc];
    if (!card) continue;
    // To foundation
    for (let f = 0; f < 4; f++) {
      if (canPlaceOnFoundation(card, state.foundations[f])) return true;
    }
    // To tableau
    for (let t = 0; t < 8; t++) {
      if (canPlaceOnTableau(card, state.tableau[t])) return true;
    }
  }

  // From tableau
  for (let t = 0; t < 8; t++) {
    const pile = state.tableau[t];
    if (pile.length === 0) continue;

    const bottomCard = pile[pile.length - 1];

    // Bottom card to foundation
    for (let f = 0; f < 4; f++) {
      if (canPlaceOnFoundation(bottomCard, state.foundations[f])) return true;
    }

    // Bottom card to free cell
    if (emptyFreeCellExists) return true;

    // Sequences to other tableau columns
    for (let startIdx = pile.length - 1; startIdx >= 0; startIdx--) {
      const sequence = pile.slice(startIdx);
      if (!isValidTableauSequence(sequence)) break;

      for (let destT = 0; destT < 8; destT++) {
        if (destT === t) continue;
        const destPile = state.tableau[destT];
        if (!canPlaceOnTableau(sequence[0], destPile)) continue;
        const destIsEmpty = destPile.length === 0;
        if (sequence.length <= maxMovableCards(state, destIsEmpty)) {
          // Skip pointless moves (K to empty column from column start)
          if (sequence[0].rank === 'K' && startIdx === 0 && destIsEmpty) continue;
          return true;
        }
      }
    }
  }

  return false;
}
