'use client';

import React, { useState, useEffect, useCallback } from 'react';
import PlayerHand from '../components/game/PlayerHand';
import Card from '../components/game/Card';

interface CardType {
  color: 'black' | 'white';
  value: number;
  revealed?: boolean;
}

interface Player {
  id: number;
  name: string;
  hand: CardType[];
  drawnCardThisTurn?: CardType | null;
}

const generateDeck = (): CardType[] => {
  const deck: CardType[] = [];
  for (let i = 0; i <= 11; i++) {
    deck.push({ color: 'black', value: i });
    deck.push({ color: 'white', value: i });
  }
  // Shuffle the deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

// Function to sort cards based on Davinci Code rules
const sortCards = (cards: CardType[]): CardType[] => {
  return [...cards].sort((a, b) => {
    if (a.value !== b.value) {
      return a.value - b.value;
    }
    // If values are the same, black comes before white
    return a.color === 'black' ? -1 : 1;
  });
};

const Home: React.FC = () => {
  const [deck, setDeck] = useState<CardType[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [numPlayers, setNumPlayers] = useState<number>(3); // Default to 3 players
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [isGuessing, setIsGuessing] = useState<boolean>(false);
  const [selectedGuessPlayerId, setSelectedGuessPlayerId] = useState<number | null>(null);
  const [selectedGuessCardIndex, setSelectedGuessCardIndex] = useState<number | null>(null);
  const [guessValue, setGuessValue] = useState<string>('');
  const [showAllDebugCards, setShowAllDebugCards] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [awaitingPenaltyRevealConfirmation, setAwaitingPenaltyRevealConfirmation] = useState<boolean>(false);
  const [isSelectingPenaltyCard, setIsSelectingPenaltyCard] = useState<boolean>(false);
  const [isChoosingDrawColor, setIsChoosingDrawColor] = useState<boolean>(false); // New state

  const initializeGame = useCallback(() => {
    const newDeck = generateDeck(); // Start with a full, shuffled deck

    const newPlayers: Player[] = [];
    for (let i = 0; i < numPlayers; i++) {
      newPlayers.push({
        id: i,
        name: `玩家 ${i + 1}`,
        hand: [],
        drawnCardThisTurn: null,
      });

      const playerHand: CardType[] = [];
      let blackCount = 0;
      let whiteCount = 0;

      if (numPlayers === 4) {
        // For 4 players, 3 cards: 2 black 1 white OR 2 white 1 black
        const isTwoBlackOneWhite = Math.random() < 0.5; // Randomly choose distribution

        if (isTwoBlackOneWhite) {
          // Try to get 2 black and 1 white
          for (let k = newDeck.length - 1; k >= 0 && blackCount < 2; k--) {
            if (newDeck[k].color === 'black') {
              playerHand.push({ ...newDeck[k], revealed: false });
              newDeck.splice(k, 1);
              blackCount++;
            }
          }
          for (let k = newDeck.length - 1; k >= 0 && whiteCount < 1; k--) {
            if (newDeck[k].color === 'white') {
              playerHand.push({ ...newDeck[k], revealed: false });
              newDeck.splice(k, 1);
              whiteCount++;
            }
          }
        } else {
          // Try to get 1 black and 2 white
          for (let k = newDeck.length - 1; k >= 0 && blackCount < 1; k--) {
            if (newDeck[k].color === 'black') {
              playerHand.push({ ...newDeck[k], revealed: false });
              newDeck.splice(k, 1);
              blackCount++;
            }
          }
          for (let k = newDeck.length - 1; k >= 0 && whiteCount < 2; k--) {
            if (newDeck[k].color === 'white') {
              playerHand.push({ ...newDeck[k], revealed: false });
              newDeck.splice(k, 1);
              whiteCount++;
            }
          }
        }
      } else {
        // For 2 or 3 players, always 2 black and 2 white
        // Distribute 2 black cards
        for (let k = newDeck.length - 1; k >= 0 && blackCount < 2; k--) {
          if (newDeck[k].color === 'black') {
            playerHand.push({ ...newDeck[k], revealed: false });
            newDeck.splice(k, 1); // Remove from deck
            blackCount++;
          }
        }

        // Distribute 2 white cards
        for (let k = newDeck.length - 1; k >= 0 && whiteCount < 2; k--) {
          if (newDeck[k].color === 'white') {
            playerHand.push({ ...newDeck[k], revealed: false });
            newDeck.splice(k, 1); // Remove from deck
            whiteCount++;
          }
        }
      }
      newPlayers[i].hand = sortCards(playerHand);
    }

    setDeck(newDeck);
    setPlayers(newPlayers);
    setCurrentPlayerIndex(0);
    setMessage(`輪到${newPlayers[0]?.name}，請抽一張牌。`);
  }, [numPlayers]); // Dependency array for useCallback

  useEffect(() => {
    if (gameStarted) {
      initializeGame();
    }
  }, [gameStarted, numPlayers, initializeGame]);

  const handleStartGame = () => {
    setGameStarted(true);
  };

  const handleNumPlayersChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNumPlayers(parseInt(e.target.value));
  };

  const handleDrawCard = () => {
    if (deck.length === 0) {
      setMessage('牌堆已空！沒有更多牌可抽。');
      return;
    }
    const currentPlayer = players[currentPlayerIndex];
    if (currentPlayer?.drawnCardThisTurn) {
      setMessage('你這回合已經抽過牌了，請猜牌或結束回合。');
      return;
    }

    // Check if both colors are available
    const hasBlack = deck.some(card => card.color === 'black');
    const hasWhite = deck.some(card => card.color === 'white');

    if (!hasBlack && !hasWhite) {
      setMessage('牌堆已空！沒有更多牌可抽。');
      return;
    } else if (hasBlack && !hasWhite) {
      handleDrawSpecificColorCard('black'); // Only black available, draw black
    } else if (!hasBlack && hasWhite) {
      handleDrawSpecificColorCard('white'); // Only white available, draw white
    } else {
      // Both available, let player choose
      setMessage(`${players[currentPlayerIndex]?.name}，請選擇要抽的牌色。`);
      setIsChoosingDrawColor(true);
    }
  };

  const handleDrawSpecificColorCard = (color: 'black' | 'white') => {
    const newDeck = [...deck];
    const availableCardsOfColor = newDeck.filter(card => card.color === color);

    if (availableCardsOfColor.length === 0) {
      setMessage(`沒有${color === 'black' ? '黑' : '白'}牌了。`);
      setIsChoosingDrawColor(false); // Go back if no cards of chosen color
      return;
    }

    const randomIndex = Math.floor(Math.random() * availableCardsOfColor.length);
    const drawnCard = availableCardsOfColor[randomIndex];

    // Remove the drawn card from the main deck
    const drawnCardIndexInDeck = newDeck.findIndex(card => card.color === drawnCard.color && card.value === drawnCard.value);
    newDeck.splice(drawnCardIndexInDeck, 1);

    const updatedPlayers = players.map((player, index) => {
      if (index === currentPlayerIndex) {
        return { ...player, drawnCardThisTurn: { ...drawnCard, revealed: false } };
      }
      return player;
    });
    setDeck(newDeck);
    setPlayers(updatedPlayers);
    setMessage(`玩家${currentPlayerIndex + 1} 抽了一張${drawnCard.color === 'black' ? '黑' : '白'}牌：${drawnCard.value}。請猜牌或結束回合。`);
    setIsChoosingDrawColor(false);
  };

  const handleCardClick = (playerId: number, cardIndex: number) => {
    if (isSelectingPenaltyCard) {
      setMessage('你必須選擇自己的一張牌來亮牌。');
      return;
    }

    if (playerId !== currentPlayerIndex) {
      // Allow making a guess if a card has been drawn, OR if the deck is empty (no more cards to draw)
      if (!players[currentPlayerIndex]?.drawnCardThisTurn && deck.length > 0) {
        setMessage('請先抽一張牌再進行猜測。');
        return;
      }
      // Do not allow guessing on already revealed cards
      const targetPlayer = players.find(p => p.id === playerId);
      if (targetPlayer?.hand[cardIndex]?.revealed) {
        setMessage('這張牌已經亮開了。請選擇另一張牌來猜測。');
        return;
      }
      setIsGuessing(true);
      setSelectedGuessPlayerId(playerId);
      setSelectedGuessCardIndex(cardIndex);
      setMessage(`玩家 ${currentPlayerIndex + 1}：你正在猜測玩家 ${playerId + 1} 的第 ${cardIndex + 1} 張牌。`);
    } else {
      setMessage('你不能猜測自己的牌。');
    }
  };

  const handleMakeGuess = () => {
    if (selectedGuessPlayerId === null || selectedGuessCardIndex === null || guessValue === '') { 
      setMessage('請選擇一張牌並輸入數值來進行猜測。');
      return;
    }

    const guessedPlayer = players[selectedGuessPlayerId];
    const guessedCard = guessedPlayer.hand[selectedGuessCardIndex];

    const isCorrect = parseInt(guessValue) === guessedCard.value; 

    if (isCorrect) {
      setMessage(`猜測正確！玩家 ${currentPlayerIndex + 1} 亮開了玩家 ${selectedGuessPlayerId + 1} 的${guessedCard.color === 'black' ? '黑' : '白'} ${guessedCard.value}。玩家 ${players[currentPlayerIndex]?.name}，你可以再次猜測或結束回合。`);
      const updatedPlayers = players.map(player => {
        if (player.id === selectedGuessPlayerId) {
          const newHand = player.hand.map((card, idx) =>
            idx === selectedGuessCardIndex ? { ...card, revealed: true } : card
          );
          return { ...player, hand: newHand };
        }
        return player;
      });
      setPlayers(updatedPlayers);
      // Win condition check should be moved to a more general game end check
      // const remainingPlayers = updatedPlayers.filter(player => player.hand.some(card => !card.revealed));
      // if (remainingPlayers.length === 1) {
      //   setWinner(remainingPlayers[0]);
      //   setGameOver(true);
      //   setMessage(`${remainingPlayers[0].name} wins! All other players have revealed their cards.`);
      // }
      // Player gets another guess or can pass, so don't change turn here
      setIsGuessing(false);
      setSelectedGuessPlayerId(null);
      setSelectedGuessCardIndex(null);
      setGuessValue('');
    } else {
      const currentPlayer = players[currentPlayerIndex];
      if (currentPlayer.hand.every(card => card.revealed)) {
        // Player has no unrevealed cards to reveal as penalty
        setMessage(`${currentPlayer.name} 沒有未亮開的牌可以亮了。`);
        setIsGuessing(false);
        setSelectedGuessPlayerId(null);
        setSelectedGuessCardIndex(null);
        setGuessValue('');
        setIsSelectingPenaltyCard(false);
        setAwaitingPenaltyRevealConfirmation(false);
        handleNextTurn(); // Proceed to next turn
        return;
      }

      // Incorrect guess: Player must choose one of their own unrevealed cards to reveal
      setMessage(`猜測錯誤！${players[currentPlayerIndex]?.name}，請選擇自己的一張未亮開的牌來亮牌。`);
      setIsGuessing(false);
      setSelectedGuessPlayerId(null);
      setSelectedGuessCardIndex(null);
      setGuessValue('');
      setIsSelectingPenaltyCard(true); // Player needs to choose a card
    }
  };

  const handlePlayerSelectCardToReveal = (cardIndex: number) => {
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer || !currentPlayer.hand[cardIndex] || currentPlayer.hand[cardIndex].revealed) {
      setMessage('選擇亮牌無效。');
      return;
    }

    const updatedHand = [...currentPlayer.hand];
    updatedHand[cardIndex] = { ...updatedHand[cardIndex], revealed: true };

    const newPlayersState = players.map((player, index) => {
      if (index === currentPlayerIndex) {
        return { ...player, hand: sortCards(updatedHand) };
      }
      return player;
    });

    // Remove player elimination logic from here. The player is not removed just because all cards are revealed.
    // The game should continue for them until a specific win condition is met.
    // if (currentPlayerAfterReveal && currentPlayerAfterReveal.hand.every(card => card.revealed)) {
    //   setLoser(currentPlayerAfterReveal);
    //   setMessage(`${currentPlayerAfterReveal.name} has lost all their unrevealed cards and is out of the game.`);
    //   newPlayersState = newPlayersState.filter(p => p.id !== currentPlayerAfterReveal.id); // Filter out eliminated player
    //   if (newPlayersState.length === 1) {
    //     setWinner(newPlayersState[0]);
    //     setGameOver(true);
    //     setMessage(`${newPlayersState[0].name} wins! All other players have been been eliminated.`);
    //   } else if (newPlayersState.length === 0) {
    //     setMessage("All players eliminated. No winner.");
    //     setGameOver(true);
    //   }
    // } else {
    setMessage(`玩家 ${currentPlayer.name} 亮開了他們的${updatedHand[cardIndex].color === 'black' ? '黑' : '白'} ${updatedHand[cardIndex].value}。`);
    // }

    setPlayers(newPlayersState);
    setIsSelectingPenaltyCard(false); // Done selecting penalty card
    setAwaitingPenaltyRevealConfirmation(true); // Now wait for confirmation to pass turn
  };

  const handleConfirmPenaltyReveal = () => {
    setAwaitingPenaltyRevealConfirmation(false);
    handleNextTurn();
  };

  const handleNextTurn = () => {
    // Removed logic to filter active players. All players can continue to take turns.
    // const activePlayers = players.filter(p => p.hand.some(card => !card.revealed));
    // if (activePlayers.length === 0) return; // No active players left (this logic is moved to checkGameEndCondition)

    // Current player's drawn card needs to be added to their hand before passing turn
    const updatedPlayers = players.map((player, index) => {
      if (index === currentPlayerIndex && player.drawnCardThisTurn) {
        const newHand = sortCards([...player.hand, { ...player.drawnCardThisTurn, revealed: false }]);
        return { ...player, hand: newHand, drawnCardThisTurn: null };
      }
      return player;
    });
    setPlayers(updatedPlayers);

    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    const nextPlayer = players[nextPlayerIndex];

    setCurrentPlayerIndex(nextPlayerIndex);

    if (deck.length === 0) {
      setMessage(`輪到${nextPlayer?.name}，牌堆已空。請猜牌或結束回合。`);
    } else {
      setMessage(`輪到${nextPlayer?.name}，請抽一張牌。`);
    }

    // Check for game end condition after turn passes, especially if deck is empty
    checkGameEndCondition();
  };

  const checkGameEndCondition = () => {
    if (deck.length === 0) {
      const playersWithUnrevealedCards = players.filter(player => player.hand.some(card => !card.revealed));

      if (playersWithUnrevealedCards.length === 1) {
        setWinner(playersWithUnrevealedCards[0]);
        setGameOver(true);
        setMessage(`${playersWithUnrevealedCards[0].name} 贏了！所有其他玩家的牌都已亮開。`);
      } else if (playersWithUnrevealedCards.length === 0) {
        // All players have revealed all their cards and deck is empty - no winner in this scenario
        setGameOver(true);
        setMessage('所有玩家的牌都已亮開，且牌堆已空。這是平局！');
      }
      // If more than one player still has unrevealed cards and deck is empty, game continues until only one remains
    }
  };

  const handleShowAllHiddenCards = () => {
    setShowAllDebugCards((prev) => !prev);
  };

  const handleResetGame = () => {
    setDeck([]);
    setPlayers([]);
    setNumPlayers(3);
    setCurrentPlayerIndex(0);
    setGameStarted(false);
    setMessage('');
    setIsGuessing(false);
    setSelectedGuessPlayerId(null);
    setSelectedGuessCardIndex(null);
    setGuessValue('');
    setAwaitingPenaltyRevealConfirmation(false);
    setIsSelectingPenaltyCard(false);
    setIsChoosingDrawColor(false); // Reset this state
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-extrabold mb-8 text-gray-900">達文西密碼</h1>

      {!gameStarted ? (
        <div className="flex flex-col items-center gap-4">
          <label htmlFor="numPlayers" className="text-lg">選擇玩家人數：</label>
          <select
            id="numPlayers"
            value={numPlayers}
            onChange={handleNumPlayersChange}
            className="p-2 border rounded-md"
          >
            <option value={2}>2人</option>
            <option value={3}>3人</option>
            <option value={4}>4人</option>
          </select>
          <button
            onClick={handleStartGame}
            className="px-6 py-3 bg-green-600 text-white text-xl font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors"
          >
            開始遊戲
          </button>
        </div>
      ) : (
        gameOver ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold">遊戲結束！</h2>
            {winner && <p className="text-2xl text-green-700">贏家：{winner.name}！</p>}
            {!winner && <p className="text-xl">遊戲已結束。</p>}
            <button
              onClick={handleResetGame}
              className="px-6 py-3 bg-blue-600 text-white text-xl font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
            >
              再玩一次
            </button>
          </div>
        ) : (
          <div className="w-full max-w-6xl flex flex-col items-center gap-8">
            <div className="grid grid-cols-2 gap-8 w-full">
              {players.map((player, playerIndex) => (
                <div
                  key={player.id}
                  className={`relative p-4 rounded-lg transition-all duration-300 ${
                    playerIndex === currentPlayerIndex
                      ? 'border-4 border-blue-500 shadow-xl bg-gradient-to-r from-blue-100 to-blue-200'
                      : 'border-2 border-gray-300 bg-white'
                  }`}
                >
                  <PlayerHand
                    playerName={player.name}
                    cards={player.hand.map((card, cardIndex) => ({
                      ...card,
                      hidden: !showAllDebugCards && playerIndex !== currentPlayerIndex && !card.revealed,
                      className: selectedGuessPlayerId === player.id && selectedGuessCardIndex === cardIndex ? 'border-4 border-red-500' : '',
                    }))}
                    isCurrentPlayer={playerIndex === currentPlayerIndex}
                    onCardClick={isSelectingPenaltyCard && playerIndex === currentPlayerIndex ? (cardIndex) => handlePlayerSelectCardToReveal(cardIndex) : (playerIndex !== currentPlayerIndex ? (cardIndex) => handleCardClick(player.id, cardIndex) : undefined)}
                    showAllDebugCards={showAllDebugCards}
                  />
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-4 w-full items-center">
              <div className="flex gap-4">
                <button
                  onClick={handleDrawCard}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg disabled:opacity-50"
                  disabled={deck.length === 0 || isGuessing || players[currentPlayerIndex]?.drawnCardThisTurn !== null || awaitingPenaltyRevealConfirmation || isSelectingPenaltyCard}
                >
                  抽牌
                </button>
                <button
                  onClick={() => setIsGuessing(true)}
                  className="px-4 py-2 bg-yellow-500 text-gray-800 rounded-lg disabled:opacity-50"
                  disabled={isGuessing || players[currentPlayerIndex]?.drawnCardThisTurn === null || awaitingPenaltyRevealConfirmation || isSelectingPenaltyCard}
                >
                  進行猜測
                </button>
                <button
                  onClick={handleShowAllHiddenCards}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg"
                  disabled={isSelectingPenaltyCard}
                >
                  {showAllDebugCards ? '隱藏所有牌' : '顯示所有隱藏牌 (除錯)'}
                </button>
                <button
                  onClick={() => {
                    setIsGuessing(false); // Cancel any active guessing
                    handleNextTurn();
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg disabled:opacity-50"
                  disabled={isGuessing || players[currentPlayerIndex]?.drawnCardThisTurn === null || awaitingPenaltyRevealConfirmation || isSelectingPenaltyCard || isChoosingDrawColor}
                >
                  回合結束
                </button>
              </div>

              {isChoosingDrawColor && (
                <div className="flex flex-col items-center gap-2 mt-4 p-4 border rounded-lg bg-white shadow-md">
                  <h3 className="text-xl font-semibold">選擇要抽的牌色</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDrawSpecificColorCard('black')}
                      className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50"
                      disabled={!deck.some(card => card.color === 'black')}
                    >
                      抽黑牌
                    </button>
                    <button
                      onClick={() => handleDrawSpecificColorCard('white')}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg disabled:opacity-50"
                      disabled={!deck.some(card => card.color === 'white')}
                    >
                      抽白牌
                    </button>
                  </div>
                </div>
              )}

              {isGuessing && (
                <div className="flex flex-col items-center gap-2 mt-4 p-4 border rounded-lg bg-white shadow-md">
                  <h3 className="text-xl font-semibold">進行猜測</h3>
                  {selectedGuessPlayerId !== null && selectedGuessCardIndex !== null && (
                    <p>猜測玩家 {players[selectedGuessPlayerId]?.name} 的第 {selectedGuessCardIndex + 1} 張牌</p>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      max="11"
                      value={guessValue}
                      onChange={(e) => setGuessValue(e.target.value)}
                      placeholder="數值 (0-11)"
                      className="p-2 border rounded-md w-32"
                    />
                    <button
                      onClick={handleMakeGuess}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
                      disabled={selectedGuessPlayerId === null || selectedGuessCardIndex === null || guessValue === '' || isSelectingPenaltyCard}
                    >
                      確認猜測
                    </button>
                  </div>
                  <button
                    onClick={() => setIsGuessing(false)}
                    className="mt-2 px-4 py-2 bg-gray-400 text-white rounded-lg"
                  >
                    取消猜測
                  </button>
                </div>
              )}

              {awaitingPenaltyRevealConfirmation && (
                <button
                  onClick={handleConfirmPenaltyReveal}
                  className="px-6 py-3 bg-red-600 text-white text-xl font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors mt-4"
                >
                  確認亮牌並結束回合
                </button>
              )}
            </div>

            <div className="mt-4 text-lg text-gray-700 text-center">
              {message}
            </div>

            {/* Deck display */}
            <div className="mt-8 flex flex-col items-center">
              <h3 className="text-xl font-semibold mb-2">剩餘牌堆（{deck.length} 張）</h3>
              {showAllDebugCards && deck.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {deck.map((card, index) => (
                    <Card key={index} color={card.color} value={card.value} hidden={false} />
                  ))}
                </div>
              )}
              {!showAllDebugCards && deck.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {deck.slice(0, 5).map((card, index) => (
                    <Card key={index} color={card.color} value={card.value} hidden={true} />
                  ))}
                  {deck.length > 5 && <span className="text-gray-500">…還有 {deck.length - 5} 張</span>}
                </div>
              )}
              {deck.length === 0 && <p className="text-gray-500">牌堆已空。</p>}
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default Home;
