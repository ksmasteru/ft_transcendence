import { MdReplay, MdHome } from "react-icons/md";

interface EndGameScreenProps {
  winner: string;
  playerScore: number;
  opponentScore: number;
  playerName: string;
  opponentName: string;
  onPlayAgain: () => void;
  onExit: () => void;
}

export function EndGameScreen({
  winner,
  playerScore,
  opponentScore,
  playerName,
  opponentName,
  onPlayAgain,
  onExit,
}: EndGameScreenProps): JSX.Element {
  const isWinner = winner === playerName;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gradient-to-br from-primary-elements/95 to-primary-elements/85 backdrop-blur-xl p-8 rounded-2xl border-2 border-primary-btn/30 shadow-2xl max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mb-6">
            {isWinner ? (
              <div className="text-6xl mb-4">🏆</div>
            ) : (
              <div className="text-6xl mb-4">😔</div>
            )}
            <h2
              className={`text-4xl font-bold font-secondary mb-2 ${
                isWinner
                  ? "bg-gradient-to-r from-[#00FFFF] via-white to-[#FF6B00] bg-clip-text text-transparent"
                  : "text-white/80"
              }`}
            >
              {isWinner ? "Victory!" : "Defeat"}
            </h2>
            <p className="text-white/60 font-primary text-lg">
              {isWinner
                ? "Congratulations! You won!"
                : `${winner} won the match`}
            </p>
          </div>

          <div className="bg-primary-bg/50 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-left">
                <p className="text-white/80 font-primary text-sm mb-1">
                  {playerName}
                </p>
                <p
                  className={`text-3xl font-bold font-secondary ${
                    isWinner ? "text-primary-btn" : "text-white/60"
                  }`}
                >
                  {playerScore}
                </p>
              </div>
              <div className="text-white/40 font-secondary text-xl">VS</div>
              <div className="text-right">
                <p className="text-white/80 font-primary text-sm mb-1">
                  {opponentName}
                </p>
                <p
                  className={`text-3xl font-bold font-secondary ${
                    !isWinner ? "text-primary-btn" : "text-white/60"
                  }`}
                >
                  {opponentScore}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onPlayAgain}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-primary-btn/80 to-primary-btn/60 hover:from-primary-btn hover:to-primary-btn text-primary-bg rounded-lg transition-all font-primary font-semibold"
            >
              <MdReplay size={20} />
              Play Again
            </button>
            <button
              onClick={onExit}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-secondary-btn/80 to-secondary-btn/60 hover:from-secondary-btn hover:to-secondary-btn text-white rounded-lg transition-all font-primary font-semibold"
            >
              <MdHome size={20} />
              Exit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

