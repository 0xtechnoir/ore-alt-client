# ORE Frontend Implementation Plan

## Overview
Build a basic real-time frontend to display:
- 5x5 grid showing SOL deployed on each block
- Accumulated motherlode pool
- Round countdown timer
- Real-time updates

## Data Requirements

From the on-chain state structures:

**Board Account** (`api/src/state/board.rs`):
- `round_id` (u64): Current round number
- `start_slot` (u64): Round start slot
- `end_slot` (u64): Round end slot

**Round Account** (`api/src/state/round.rs`):
- `deployed` ([u64; 25]): SOL deployed on each of 25 squares (in lamports)
- `motherlode` (u64): Accumulated ORE in motherlode pool
- `count` ([u64; 25]): Number of miners per square

**Key Constants** (`api/src/consts.rs`):
- Program ID: `oreV3EG1i9BEgiAJ8b177Z2S2rMarzak4NMv1kULvWv`
- ONE_ORE: `10^11` (11 decimals)
- Solana timing: ~150 slots per minute

---

## Phase 1: Project Setup & Basic Structure

**Goal**: Set up a modern React/Next.js app with Solana wallet integration

### Tasks:
1. **Initialize Project**
   ```bash
   npx create-next-app@latest ore-frontend
   cd ore-frontend
   ```
   - Choose TypeScript, Tailwind CSS, App Router

2. **Install Solana Dependencies**
   ```bash
   npm install @solana/web3.js @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets @solana/wallet-adapter-base
   npm install @coral-xyz/borsh  # For deserializing account data
   ```

3. **Project Structure**
   ```
   src/
   ├── app/
   │   ├── page.tsx           # Main page
   │   └── layout.tsx         # Wallet provider wrapper
   ├── components/
   │   ├── Grid.tsx           # 5x5 mining grid
   │   ├── Motherlode.tsx     # Motherlode display
   │   └── Timer.tsx          # Countdown timer
   ├── lib/
   │   ├── solana.ts          # Solana connection
   │   ├── accounts.ts        # Account fetching logic
   │   └── types.ts           # TypeScript types for state
   └── hooks/
       └── useRoundData.ts    # Custom hook for fetching data
   ```

**Deliverable**: Working Next.js app with Solana wallet connection UI

---

## Phase 2: Define State Types & Account Reading

**Goal**: Create TypeScript types matching on-chain state and fetch account data

### Tasks:

1. **Create TypeScript Types** (`lib/types.ts`):
   ```typescript
   export interface Board {
     roundId: bigint;
     startSlot: bigint;
     endSlot: bigint;
   }

   export interface Round {
     id: bigint;
     deployed: bigint[];        // 25 elements
     slotHash: Uint8Array;      // 32 bytes
     count: bigint[];           // 25 elements
     expiresAt: bigint;
     motherlode: bigint;
     rentPayer: string;         // Pubkey as string
     topMiner: string;
     topMinerReward: bigint;
     totalDeployed: bigint;
     totalVaulted: bigint;
     totalWinnings: bigint;
   }
   ```

2. **Create Account Deserialization** (`lib/accounts.ts`):
   ```typescript
   import { Connection, PublicKey } from '@solana/web3.js';

   const PROGRAM_ID = 'oreV3EG1i9BEgiAJ8b177Z2S2rMarzak4NMv1kULvWv';
   const BOARD_SEED = Buffer.from('board');
   const ROUND_SEED = Buffer.from('round');

   // Derive PDAs
   export function getBoardPDA(): PublicKey {
     const [pda] = PublicKey.findProgramAddressSync(
       [BOARD_SEED],
       new PublicKey(PROGRAM_ID)
     );
     return pda;
   }

   export function getRoundPDA(roundId: bigint): PublicKey {
     const roundIdBuffer = Buffer.alloc(8);
     roundIdBuffer.writeBigUInt64LE(roundId);
     const [pda] = PublicKey.findProgramAddressSync(
       [ROUND_SEED, roundIdBuffer],
       new PublicKey(PROGRAM_ID)
     );
     return pda;
   }

   // Fetch and deserialize Board account
   export async function fetchBoard(connection: Connection): Promise<Board> {
     const boardPDA = getBoardPDA();
     const accountInfo = await connection.getAccountInfo(boardPDA);

     if (!accountInfo) throw new Error('Board account not found');

     // Skip first 8 bytes (discriminator), then parse Board struct
     const data = accountInfo.data.slice(8);
     return {
       roundId: data.readBigUInt64LE(0),
       startSlot: data.readBigUInt64LE(8),
       endSlot: data.readBigUInt64LE(16),
     };
   }

   // Fetch and deserialize Round account
   export async function fetchRound(
     connection: Connection,
     roundId: bigint
   ): Promise<Round> {
     const roundPDA = getRoundPDA(roundId);
     const accountInfo = await connection.getAccountInfo(roundPDA);

     if (!accountInfo) throw new Error('Round account not found');

     // Skip first 8 bytes (discriminator)
     const data = accountInfo.data.slice(8);

     // Parse the Round struct
     let offset = 0;
     const id = data.readBigUInt64LE(offset); offset += 8;

     // Parse deployed array (25 u64 values)
     const deployed: bigint[] = [];
     for (let i = 0; i < 25; i++) {
       deployed.push(data.readBigUInt64LE(offset));
       offset += 8;
     }

     // Parse slot_hash (32 bytes)
     const slotHash = data.slice(offset, offset + 32); offset += 32;

     // Parse count array (25 u64 values)
     const count: bigint[] = [];
     for (let i = 0; i < 25; i++) {
       count.push(data.readBigUInt64LE(offset));
       offset += 8;
     }

     const expiresAt = data.readBigUInt64LE(offset); offset += 8;
     const motherlode = data.readBigUInt64LE(offset); offset += 8;

     // Parse rent_payer (32 bytes)
     const rentPayer = new PublicKey(data.slice(offset, offset + 32)).toString();
     offset += 32;

     // Parse top_miner (32 bytes)
     const topMiner = new PublicKey(data.slice(offset, offset + 32)).toString();
     offset += 32;

     const topMinerReward = data.readBigUInt64LE(offset); offset += 8;
     const totalDeployed = data.readBigUInt64LE(offset); offset += 8;
     const totalVaulted = data.readBigUInt64LE(offset); offset += 8;
     const totalWinnings = data.readBigUInt64LE(offset); offset += 8;

     return {
       id,
       deployed,
       slotHash,
       count,
       expiresAt,
       motherlode,
       rentPayer,
       topMiner,
       topMinerReward,
       totalDeployed,
       totalVaulted,
       totalWinnings,
     };
   }
   ```

3. **Setup Solana Connection** (`lib/solana.ts`):
   ```typescript
   import { Connection, clusterApiUrl } from '@solana/web3.js';

   export const connection = new Connection(
     process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl('mainnet-beta'),
     'confirmed'
   );
   ```

**Deliverable**: Working functions to fetch and parse Board and Round accounts

---

## Phase 3: Build UI Components

**Goal**: Create visual components for grid, motherlode, and timer

### Tasks:

1. **Grid Component** (`components/Grid.tsx`):
   ```typescript
   interface GridProps {
     deployed: bigint[];  // 25 elements
     count: bigint[];     // 25 elements
   }

   export function Grid({ deployed, count }: GridProps) {
     // Convert lamports to SOL (1 SOL = 1e9 lamports)
     const toSOL = (lamports: bigint) => {
       return (Number(lamports) / 1e9).toFixed(4);
     };

     return (
       <div className="grid grid-cols-5 gap-2 max-w-2xl mx-auto">
         {deployed.map((lamports, index) => (
           <div
             key={index}
             className="border-2 border-gray-700 rounded-lg p-4
                        bg-gray-800 hover:bg-gray-700 transition-colors"
           >
             <div className="text-xs text-gray-400">Block {index}</div>
             <div className="text-lg font-bold text-white">
               {toSOL(lamports)} SOL
             </div>
             <div className="text-xs text-gray-500">
               {count[index].toString()} miners
             </div>
           </div>
         ))}
       </div>
     );
   }
   ```

2. **Motherlode Component** (`components/Motherlode.tsx`):
   ```typescript
   interface MotherlodeProps {
     amount: bigint;  // In "grams" (1 ORE = 10^11 grams)
   }

   export function Motherlode({ amount }: MotherlodeProps) {
     const ONE_ORE = 1e11;
     const oreAmount = (Number(amount) / ONE_ORE).toFixed(4);

     return (
       <div className="bg-gradient-to-r from-yellow-600 to-orange-600
                       rounded-lg p-6 shadow-lg">
         <h2 className="text-2xl font-bold text-white mb-2">
           💎 Motherlode
         </h2>
         <div className="text-4xl font-extrabold text-yellow-100">
           {oreAmount} ORE
         </div>
         <div className="text-sm text-yellow-200 mt-2">
           1 in 625 chance to win!
         </div>
       </div>
     );
   }
   ```

3. **Timer Component** (`components/Timer.tsx`):
   ```typescript
   import { useEffect, useState } from 'react';

   interface TimerProps {
     endSlot: bigint;
     currentSlot: bigint;
   }

   export function Timer({ endSlot, currentSlot }: TimerProps) {
     const [timeLeft, setTimeLeft] = useState<number>(0);

     useEffect(() => {
       // Calculate slots remaining
       const slotsRemaining = Number(endSlot - currentSlot);

       // Convert to seconds (~150 slots per minute = 0.4 seconds per slot)
       const secondsRemaining = slotsRemaining * 0.4;

       setTimeLeft(Math.max(0, Math.floor(secondsRemaining)));
     }, [endSlot, currentSlot]);

     useEffect(() => {
       const interval = setInterval(() => {
         setTimeLeft(prev => Math.max(0, prev - 1));
       }, 1000);

       return () => clearInterval(interval);
     }, []);

     const minutes = Math.floor(timeLeft / 60);
     const seconds = timeLeft % 60;

     return (
       <div className="bg-blue-900 rounded-lg p-6 shadow-lg">
         <h2 className="text-xl font-bold text-white mb-2">
           ⏰ Round Countdown
         </h2>
         <div className="text-5xl font-mono font-bold text-blue-100">
           {minutes}:{seconds.toString().padStart(2, '0')}
         </div>
       </div>
     );
   }
   ```

**Deliverable**: Styled, functional UI components

---

## Phase 4: Real-Time Data Fetching

**Goal**: Implement polling/subscription to update UI in real-time

### Tasks:

1. **Create Custom Hook** (`hooks/useRoundData.ts`):
   ```typescript
   import { useEffect, useState } from 'react';
   import { connection } from '@/lib/solana';
   import { fetchBoard, fetchRound } from '@/lib/accounts';
   import type { Board, Round } from '@/lib/types';

   export function useRoundData() {
     const [board, setBoard] = useState<Board | null>(null);
     const [round, setRound] = useState<Round | null>(null);
     const [currentSlot, setCurrentSlot] = useState<bigint>(0n);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);

     // Fetch current slot
     useEffect(() => {
       const updateSlot = async () => {
         const slot = await connection.getSlot();
         setCurrentSlot(BigInt(slot));
       };

       updateSlot();
       const interval = setInterval(updateSlot, 1000);
       return () => clearInterval(interval);
     }, []);

     // Fetch board and round data
     useEffect(() => {
       const fetchData = async () => {
         try {
           setLoading(true);

           // Fetch board
           const boardData = await fetchBoard(connection);
           setBoard(boardData);

           // Fetch current round
           const roundData = await fetchRound(connection, boardData.roundId);
           setRound(roundData);

           setError(null);
         } catch (err) {
           setError(err instanceof Error ? err.message : 'Unknown error');
         } finally {
           setLoading(false);
         }
       };

       // Initial fetch
       fetchData();

       // Poll every 2 seconds for updates
       const interval = setInterval(fetchData, 2000);
       return () => clearInterval(interval);
     }, []);

     return { board, round, currentSlot, loading, error };
   }
   ```

2. **Alternative: WebSocket Subscriptions** (More advanced):
   ```typescript
   // Subscribe to account changes instead of polling
   useEffect(() => {
     const boardPDA = getBoardPDA();
     const subscriptionId = connection.onAccountChange(
       boardPDA,
       (accountInfo) => {
         // Parse and update board state
         const data = accountInfo.data.slice(8);
         const boardData = {
           roundId: data.readBigUInt64LE(0),
           startSlot: data.readBigUInt64LE(8),
           endSlot: data.readBigUInt64LE(16),
         };
         setBoard(boardData);
       },
       'confirmed'
     );

     return () => {
       connection.removeAccountChangeListener(subscriptionId);
     };
   }, []);
   ```

**Deliverable**: Real-time updating data hook

---

## Phase 5: Main Page Integration

**Goal**: Bring everything together on the main page

### Tasks:

1. **Main Page** (`app/page.tsx`):
   ```typescript
   'use client';

   import { Grid } from '@/components/Grid';
   import { Motherlode } from '@/components/Motherlode';
   import { Timer } from '@/components/Timer';
   import { useRoundData } from '@/hooks/useRoundData';

   export default function Home() {
     const { board, round, currentSlot, loading, error } = useRoundData();

     if (loading) {
       return (
         <div className="min-h-screen flex items-center justify-center">
           <div className="text-2xl">Loading...</div>
         </div>
       );
     }

     if (error) {
       return (
         <div className="min-h-screen flex items-center justify-center">
           <div className="text-red-500">Error: {error}</div>
         </div>
       );
     }

     if (!board || !round) {
       return (
         <div className="min-h-screen flex items-center justify-center">
           <div>No data available</div>
         </div>
       );
     }

     return (
       <main className="min-h-screen bg-gray-900 text-white p-8">
         <h1 className="text-4xl font-bold text-center mb-8">
           ORE Mining Dashboard
         </h1>

         <div className="mb-8 text-center text-gray-400">
           Round #{board.roundId.toString()}
         </div>

         {/* Top Stats */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
           <Motherlode amount={round.motherlode} />
           <Timer endSlot={board.endSlot} currentSlot={currentSlot} />
         </div>

         {/* Mining Grid */}
         <div className="mb-8">
           <h2 className="text-2xl font-bold text-center mb-4">
             Mining Grid
           </h2>
           <Grid deployed={round.deployed} count={round.count} />
         </div>

         {/* Additional Stats */}
         <div className="max-w-2xl mx-auto grid grid-cols-2 gap-4 text-center">
           <div className="bg-gray-800 rounded-lg p-4">
             <div className="text-gray-400 text-sm">Total Deployed</div>
             <div className="text-xl font-bold">
               {(Number(round.totalDeployed) / 1e9).toFixed(2)} SOL
             </div>
           </div>
           <div className="bg-gray-800 rounded-lg p-4">
             <div className="text-gray-400 text-sm">Total Winnings</div>
             <div className="text-xl font-bold">
               {(Number(round.totalWinnings) / 1e9).toFixed(2)} SOL
             </div>
           </div>
         </div>
       </main>
     );
   }
   ```

2. **Environment Variables** (`.env.local`):
   ```bash
   NEXT_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com
   # Or use a paid RPC for better reliability:
   # NEXT_PUBLIC_RPC_URL=https://your-rpc-provider.com
   ```

**Deliverable**: Complete working frontend

---

## Phase 6: Polish & Optimization

**Goal**: Add finishing touches and optimize performance

### Tasks:

1. **Visual Enhancements**:
   - Add animations for when blocks update
   - Highlight the winning square (after round ends)
   - Add color intensity based on SOL amount
   - Add loading skeletons

2. **Performance Optimizations**:
   - Memoize components with React.memo
   - Use useMemo for expensive calculations
   - Debounce updates if polling too frequently

3. **Error Handling**:
   - Retry logic for failed RPC calls
   - Fallback RPC endpoints
   - Better error messages

4. **Additional Features** (Optional):
   - Show historical rounds
   - Display winning square calculation
   - Show your own miner position (if wallet connected)
   - Add sound effects for countdown

**Deliverable**: Production-ready frontend

---

## Testing Strategy

### Local Development:
1. Use `localnet.sh` to start local validator
2. Point frontend to `http://localhost:8899`
3. Deploy test transactions to verify UI updates

### Mainnet Testing:
1. Use mainnet RPC (read-only, no wallet needed for this basic view)
2. Monitor actual game rounds
3. Verify all calculations match on-chain data

---

## Deployment

### Vercel (Recommended):
```bash
npm install -g vercel
vercel
```

### Or any static host:
```bash
npm run build
# Deploy the `out/` directory
```

---

## Key Technical Notes

1. **Slot Timing**: Solana slots are ~400ms each, ~150 per minute
2. **Lamports**: 1 SOL = 1,000,000,000 lamports
3. **ORE Decimals**: 1 ORE = 100,000,000,000 "grams" (11 decimals)
4. **RPC Limits**: Free RPCs rate limit aggressively - use paid RPC for production
5. **Account Discriminator**: First 8 bytes of account data are the discriminator (skip them)
6. **Endianness**: All numbers are little-endian

---

## Estimated Timeline

- **Phase 1**: 2-3 hours (setup)
- **Phase 2**: 3-4 hours (account reading - this is the trickiest part)
- **Phase 3**: 2-3 hours (UI components)
- **Phase 4**: 2 hours (real-time updates)
- **Phase 5**: 1 hour (integration)
- **Phase 6**: 2-4 hours (polish)

**Total**: ~15-20 hours for a solid v1

---

## Resources

- Solana Web3.js Docs: https://solana-labs.github.io/solana-web3.js/
- Borsh Serialization: https://borsh.io/
- Next.js Docs: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com/docs
