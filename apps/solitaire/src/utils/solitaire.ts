import type { CardType, GameState, Suit, Rank, Selection } from '../types';

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
  const index = RANKS.indexOf(rank);
  return index + 1;
}

function createDeck(): CardType[] {
  const deck: CardType[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        suit,
        rank,
        faceUp: false,
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

export function createNewGame(): GameState {
  const deck = shuffleDeck(createDeck());
  const tableau: CardType[][] = [];
  let deckIndex = 0;

  for (let col = 0; col < 7; col++) {
    const pile: CardType[] = [];
    for (let row = 0; row <= col; row++) {
      const card = { ...deck[deckIndex] };
      card.faceUp = row === col;
      pile.push(card);
      deckIndex++;
    }
    tableau.push(pile);
  }

  const stock = deck.slice(deckIndex).map((c) => ({ ...c, faceUp: false }));

  return {
    tableau,
    foundations: [[], [], [], []],
    stock,
    waste: [],
  };
}

export function cloneGameState(state: GameState): GameState {
  return {
    tableau: state.tableau.map((pile) => pile.map((c) => ({ ...c }))),
    foundations: state.foundations.map((pile) => pile.map((c) => ({ ...c }))),
    stock: state.stock.map((c) => ({ ...c })),
    waste: state.waste.map((c) => ({ ...c })),
  };
}

function canPlaceOnTableau(card: CardType, targetPile: CardType[]): boolean {
  if (targetPile.length === 0) {
    return card.rank === 'K';
  }
  const topCard = targetPile[targetPile.length - 1];
  if (!topCard.faceUp) return false;
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

export function drawFromStock(state: GameState): GameState {
  const newState = cloneGameState(state);

  if (newState.stock.length === 0) {
    if (newState.waste.length === 0) return state;
    newState.stock = newState.waste.reverse().map((c) => ({ ...c, faceUp: false }));
    newState.waste = [];
  } else {
    const card = newState.stock.pop()!;
    card.faceUp = true;
    newState.waste.push(card);
  }

  return newState;
}

export function moveCards(
  state: GameState,
  selection: Selection,
  destType: 'tableau' | 'foundation',
  destPileIndex: number
): GameState | null {
  const newState = cloneGameState(state);

  let cardsToMove: CardType[] = [];
  let sourcePile: CardType[];

  if (selection.source === 'waste') {
    sourcePile = newState.waste;
    if (sourcePile.length === 0) return null;
    cardsToMove = [sourcePile[sourcePile.length - 1]];
  } else if (selection.source === 'tableau') {
    sourcePile = newState.tableau[selection.pileIndex];
    if (selection.cardIndex < 0 || selection.cardIndex >= sourcePile.length) return null;
    cardsToMove = sourcePile.slice(selection.cardIndex);
  } else if (selection.source === 'foundation') {
    sourcePile = newState.foundations[selection.pileIndex];
    if (sourcePile.length === 0) return null;
    cardsToMove = [sourcePile[sourcePile.length - 1]];
  } else {
    return null;
  }

  if (cardsToMove.length === 0) return null;

  if (destType === 'foundation') {
    if (cardsToMove.length !== 1) return null;
    const card = cardsToMove[0];
    const foundationPile = newState.foundations[destPileIndex];
    if (!canPlaceOnFoundation(card, foundationPile)) return null;

    if (selection.source === 'waste') {
      newState.waste.pop();
    } else if (selection.source === 'tableau') {
      newState.tableau[selection.pileIndex].splice(selection.cardIndex, 1);
      flipTopCard(newState.tableau[selection.pileIndex]);
    } else if (selection.source === 'foundation') {
      newState.foundations[selection.pileIndex].pop();
    }
    foundationPile.push({ ...card, faceUp: true });
  } else if (destType === 'tableau') {
    const targetPile = newState.tableau[destPileIndex];
    if (!canPlaceOnTableau(cardsToMove[0], targetPile)) return null;

    if (selection.source === 'waste') {
      newState.waste.pop();
    } else if (selection.source === 'tableau') {
      newState.tableau[selection.pileIndex].splice(selection.cardIndex, cardsToMove.length);
      flipTopCard(newState.tableau[selection.pileIndex]);
    } else if (selection.source === 'foundation') {
      newState.foundations[selection.pileIndex].pop();
    }
    for (const card of cardsToMove) {
      targetPile.push({ ...card, faceUp: true });
    }
  }

  return newState;
}

function flipTopCard(pile: CardType[]): void {
  if (pile.length > 0 && !pile[pile.length - 1].faceUp) {
    pile[pile.length - 1].faceUp = true;
  }
}

export function checkWin(state: GameState): boolean {
  return state.foundations.every((pile) => pile.length === 13);
}

export function canAutoComplete(state: GameState): boolean {
  if (state.stock.length > 0 || state.waste.length > 0) return false;
  for (const pile of state.tableau) {
    for (const card of pile) {
      if (!card.faceUp) return false;
    }
  }
  return true;
}

export function autoCompleteStep(state: GameState): GameState | null {
  const newState = cloneGameState(state);

  for (let t = 0; t < 7; t++) {
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

  if (newState.waste.length > 0) {
    const card = newState.waste[newState.waste.length - 1];
    for (let f = 0; f < 4; f++) {
      if (canPlaceOnFoundation(card, newState.foundations[f])) {
        newState.waste.pop();
        newState.foundations[f].push({ ...card, faceUp: true });
        return newState;
      }
    }
  }

  return null;
}

export function getValidFoundationIndex(
  state: GameState,
  card: CardType
): number {
  for (let f = 0; f < 4; f++) {
    if (canPlaceOnFoundation(card, state.foundations[f])) {
      return f;
    }
  }
  return -1;
}

export function hasAnyValidMove(state: GameState): boolean {
  if (state.stock.length > 0) return true;

  if (state.waste.length > 0) {
    const wasteTop = state.waste[state.waste.length - 1];
    for (let f = 0; f < 4; f++) {
      if (canPlaceOnFoundation(wasteTop, state.foundations[f])) return true;
    }
    for (let t = 0; t < 7; t++) {
      if (canPlaceOnTableau(wasteTop, state.tableau[t])) return true;
    }
  }

  for (let t = 0; t < 7; t++) {
    const pile = state.tableau[t];
    for (let i = 0; i < pile.length; i++) {
      const card = pile[i];
      if (!card.faceUp) continue;

      if (i === pile.length - 1) {
        for (let f = 0; f < 4; f++) {
          if (canPlaceOnFoundation(card, state.foundations[f])) return true;
        }
      }

      for (let destT = 0; destT < 7; destT++) {
        if (destT === t) continue;
        if (canPlaceOnTableau(card, state.tableau[destT])) {
          if (card.rank === 'K' && i === 0 && state.tableau[destT].length === 0) {
            continue;
          }
          return true;
        }
      }
    }
  }

  for (let f = 0; f < 4; f++) {
    const pile = state.foundations[f];
    if (pile.length === 0) continue;
    const card = pile[pile.length - 1];
    for (let t = 0; t < 7; t++) {
      if (canPlaceOnTableau(card, state.tableau[t])) return true;
    }
  }

  return false;
}
