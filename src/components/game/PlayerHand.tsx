import React, { useState } from 'react';
import Card from './Card';
import { Eye, EyeOff } from 'lucide-react';

interface PlayerHandProps {
  cards: { color: 'black' | 'white'; value: number; revealed?: boolean; className?: string }[];
  playerName: string;
  isCurrentPlayer: boolean;
  onCardClick?: (cardIndex: number) => void;
  showAllDebugCards?: boolean;
}

const PlayerHand: React.FC<PlayerHandProps> = ({ cards, playerName, isCurrentPlayer, onCardClick, showAllDebugCards }) => {
  const [showCards, setShowCards] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4 p-4 border rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold">{playerName}</h2>
      <div className="flex gap-2 overflow-x-auto pb-2 min-w-0">
        {cards.map((card, index) => {
          const shouldBeHidden = !card.revealed && !showAllDebugCards && !(isCurrentPlayer && showCards);
          return (
            <Card
              key={index}
              color={card.color}
              value={card.value}
              hidden={shouldBeHidden}
              revealed={card.revealed}
              onClick={onCardClick && !card.revealed ? () => onCardClick(index) : undefined}
              className={card.className}
            />
          );
        })}
      </div>
      {isCurrentPlayer && (
        <button
          onClick={() => setShowCards(!showCards)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2"
        >
          {showCards ? <EyeOff size={20} /> : <Eye size={20} />}
          {showCards ? '隱藏牌面' : '顯示牌面'}
        </button>
      )}
    </div>
  );
};

export default PlayerHand; 