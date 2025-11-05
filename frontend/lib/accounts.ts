import { Connection, PublicKey } from '@solana/web3.js';
import { Board, Round, CONSTANTS } from './types';

/**
 * PDA seeds matching api/src/consts.rs
 */
const SEEDS = {
  BOARD: Buffer.from('board'),
  ROUND: Buffer.from('round'),
} as const;

/**
 * Derive the Board PDA address
 * Matches: board_pda() in api/src/state/mod.rs:42
 */
export function getBoardPDA(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [SEEDS.BOARD],
    new PublicKey(CONSTANTS.PROGRAM_ID)
  );
  return pda;
}

/**
 * Derive the Round PDA address for a specific round ID
 * Matches: round_pda(id) in api/src/state/mod.rs:58
 *
 * @param roundId - The round number
 */
export function getRoundPDA(roundId: bigint): PublicKey {
  // Convert round ID to little-endian u64 bytes
  const roundIdBuffer = Buffer.alloc(8);

  // Manually convert bigint to little-endian bytes (browser-compatible)
  const roundIdNum = Number(roundId);
  roundIdBuffer.writeUInt32LE(roundIdNum & 0xffffffff, 0); // Low 32 bits
  roundIdBuffer.writeUInt32LE(Math.floor(roundIdNum / 0x100000000), 4); // High 32 bits

  const [pda] = PublicKey.findProgramAddressSync(
    [SEEDS.ROUND, roundIdBuffer],
    new PublicKey(CONSTANTS.PROGRAM_ID)
  );
  return pda;
}

/**
 * Fetch and deserialize the Board account
 * Structure matches: api/src/state/board.rs:9
 *
 * @param connection - Solana connection
 * @returns Deserialized Board data
 */
export async function fetchBoard(connection: Connection): Promise<Board> {
  const boardPDA = getBoardPDA();
  const accountInfo = await connection.getAccountInfo(boardPDA);

  if (!accountInfo) {
    throw new Error('Board account not found');
  }

  // Account structure:
  // - First 8 bytes: discriminator (account type identifier)
  // - Remaining bytes: Board struct data
  const data = accountInfo.data;

  if (data.length < 8) {
    throw new Error('Invalid Board account data');
  }

  // Skip discriminator (first 8 bytes)
  let offset = 8;

  // Parse Board struct (3 u64 fields)
  const roundId = data.readBigUInt64LE(offset);
  offset += 8;

  const startSlot = data.readBigUInt64LE(offset);
  offset += 8;

  const endSlot = data.readBigUInt64LE(offset);
  offset += 8;

  return {
    roundId,
    startSlot,
    endSlot,
  };
}

/**
 * Fetch and deserialize the Round account
 * Structure matches: api/src/state/round.rs:9
 *
 * @param connection - Solana connection
 * @param roundId - The round number to fetch
 * @returns Deserialized Round data
 */
export async function fetchRound(
  connection: Connection,
  roundId: bigint
): Promise<Round> {
  const roundPDA = getRoundPDA(roundId);
  const accountInfo = await connection.getAccountInfo(roundPDA);

  if (!accountInfo) {
    throw new Error(`Round account not found for round ${roundId}`);
  }

  const data = accountInfo.data;

  if (data.length < 8) {
    throw new Error('Invalid Round account data');
  }

  // Skip discriminator (first 8 bytes)
  let offset = 8;

  // Parse Round struct fields in order:

  // 1. id: u64
  const id = data.readBigUInt64LE(offset);
  offset += 8;

  // 2. deployed: [u64; 25]
  const deployed: bigint[] = [];
  for (let i = 0; i < 25; i++) {
    deployed.push(data.readBigUInt64LE(offset));
    offset += 8;
  }

  // 3. slot_hash: [u8; 32]
  const slotHash = data.subarray(offset, offset + 32);
  offset += 32;

  // 4. count: [u64; 25]
  const count: bigint[] = [];
  for (let i = 0; i < 25; i++) {
    count.push(data.readBigUInt64LE(offset));
    offset += 8;
  }

  // 5. expires_at: u64
  const expiresAt = data.readBigUInt64LE(offset);
  offset += 8;

  // 6. motherlode: u64
  const motherlode = data.readBigUInt64LE(offset);
  offset += 8;

  // 7. rent_payer: Pubkey (32 bytes)
  const rentPayerBytes = data.subarray(offset, offset + 32);
  const rentPayer = new PublicKey(rentPayerBytes).toString();
  offset += 32;

  // 8. top_miner: Pubkey (32 bytes)
  const topMinerBytes = data.subarray(offset, offset + 32);
  const topMiner = new PublicKey(topMinerBytes).toString();
  offset += 32;

  // 9. top_miner_reward: u64
  const topMinerReward = data.readBigUInt64LE(offset);
  offset += 8;

  // 10. total_deployed: u64
  const totalDeployed = data.readBigUInt64LE(offset);
  offset += 8;

  // 11. total_vaulted: u64
  const totalVaulted = data.readBigUInt64LE(offset);
  offset += 8;

  // 12. total_winnings: u64
  const totalWinnings = data.readBigUInt64LE(offset);
  offset += 8;

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

/**
 * Utility: Convert lamports to SOL
 */
export function lamportsToSol(lamports: bigint): number {
  return Number(lamports) / Number(CONSTANTS.LAMPORTS_PER_SOL);
}

/**
 * Utility: Convert ORE base units (grams) to ORE tokens
 */
export function gramsToOre(grams: bigint): number {
  return Number(grams) / Number(CONSTANTS.ONE_ORE);
}

/**
 * Utility: Calculate time remaining from current slot to end slot
 * @returns Seconds remaining (approximate)
 */
export function calculateTimeRemaining(
  currentSlot: bigint,
  endSlot: bigint
): number {
  const slotsRemaining = Number(endSlot - currentSlot);
  return Math.max(0, Math.floor(slotsRemaining * CONSTANTS.SECONDS_PER_SLOT));
}
