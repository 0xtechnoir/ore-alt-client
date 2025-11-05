'use client';

import { useEffect, useState } from 'react';
import { connection } from '@/lib/solana';
import { fetchBoard, fetchRound, getBoardPDA, getRoundPDA, lamportsToSol, gramsToOre } from '@/lib/accounts';
import type { Board, Round } from '@/lib/types';

export default function Home() {
  const [board, setBoard] = useState<Board | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch Board account
        console.log('Fetching Board account from:', getBoardPDA().toString());
        const boardData = await fetchBoard(connection);
        setBoard(boardData);
        console.log('Board data:', boardData);

        // Fetch current Round account
        console.log('Fetching Round account from:', getRoundPDA(boardData.roundId).toString());
        const roundData = await fetchRound(connection, boardData.roundId);
        setRound(roundData);
        console.log('Round data:', roundData);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading ORE data from blockchain...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 text-red-500">
            Error
          </h1>
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6">
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  if (!board || !round) {
    return (
      <main className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">
            No data available
          </h1>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">
          ORE Mining Dashboard
        </h1>
        <p className="text-center text-green-400 mb-8">
          ✅ Phase 2 Complete - Live Data from Solana Mainnet
        </p>

        {/* Board Info */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Board Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-gray-400 text-sm">Current Round</div>
              <div className="text-2xl font-bold">#{board.roundId.toString()}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Start Slot</div>
              <div className="text-xl font-mono">{board.startSlot.toString()}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">End Slot</div>
              <div className="text-xl font-mono">{board.endSlot.toString()}</div>
            </div>
          </div>
        </div>

        {/* Round Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Motherlode */}
          <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-2">💎 Motherlode</h2>
            <div className="text-4xl font-extrabold">
              {gramsToOre(round.motherlode).toFixed(4)} ORE
            </div>
            <div className="text-sm text-yellow-100 mt-2">
              1 in 625 chance to win!
            </div>
          </div>

          {/* Total Deployed */}
          <div className="bg-blue-900 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-2">📊 Total Deployed</h2>
            <div className="text-4xl font-extrabold">
              {lamportsToSol(round.totalDeployed).toFixed(4)} SOL
            </div>
            <div className="text-sm text-blue-200 mt-2">
              Across all squares
            </div>
          </div>
        </div>

        {/* Mining Grid */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">5x5 Mining Grid</h2>
          <div className="grid grid-cols-5 gap-2">
            {round.deployed.map((lamports, index) => {
              const sol = lamportsToSol(lamports);
              const miners = round.count[index];
              const isEmpty = sol === 0;

              return (
                <div
                  key={index}
                  className={`
                    border-2 rounded-lg p-3 transition-all hover:scale-105
                    ${isEmpty ? 'border-gray-700 bg-gray-900' : 'border-blue-500 bg-blue-900/30'}
                  `}
                >
                  <div className="text-xs text-gray-400 mb-1">#{index}</div>
                  <div className="text-sm font-bold text-white">
                    {sol.toFixed(4)} SOL
                  </div>
                  <div className="text-xs text-gray-400">
                    {miners.toString()} miner{miners !== 1n ? 's' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Total Winnings</div>
            <div className="text-xl font-bold">
              {lamportsToSol(round.totalWinnings).toFixed(4)} SOL
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Total Vaulted</div>
            <div className="text-xl font-bold">
              {lamportsToSol(round.totalVaulted).toFixed(4)} SOL
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Top Miner Reward</div>
            <div className="text-xl font-bold">
              {gramsToOre(round.topMinerReward).toFixed(4)} ORE
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Expires At</div>
            <div className="text-lg font-mono">
              {round.expiresAt.toString()}
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-8 bg-gray-800 rounded-lg p-4">
          <details>
            <summary className="cursor-pointer font-bold mb-2">
              🔍 Debug Info (Raw Data)
            </summary>
            <div className="text-xs font-mono text-gray-300 space-y-2">
              <div>Board PDA: {getBoardPDA().toString()}</div>
              <div>Round PDA: {getRoundPDA(board.roundId).toString()}</div>
              <div className="mt-4">
                <strong>Slot Hash:</strong> {Array.from(round.slotHash).map(b => b.toString(16).padStart(2, '0')).join('')}
              </div>
            </div>
          </details>
        </div>
      </div>
    </main>
  );
}
