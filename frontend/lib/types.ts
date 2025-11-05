/**
 * TypeScript types matching the on-chain Rust state structures
 * These mirror the structs defined in api/src/state/
 */

/**
 * Board account structure
 * Defined in: api/src/state/board.rs
 */
export interface Board {
  /** The current round number */
  roundId: bigint;
  /** The slot at which the current round starts mining */
  startSlot: bigint;
  /** The slot at which the current round ends mining */
  endSlot: bigint;
}

/**
 * Round account structure
 * Defined in: api/src/state/round.rs
 */
export interface Round {
  /** The round number */
  id: bigint;
  /** The amount of SOL deployed in each square (25 squares in 5x5 grid) - in lamports */
  deployed: bigint[];
  /** The hash of the end slot, used for random number generation */
  slotHash: Uint8Array;
  /** The count of miners on each square (25 squares) */
  count: bigint[];
  /** The slot at which claims for this round account end */
  expiresAt: bigint;
  /** The amount of ORE in the motherlode (in "grams" - 1 ORE = 10^11 grams) */
  motherlode: bigint;
  /** The account to which rent should be returned when this account is closed */
  rentPayer: string;
  /** The top miner of the round */
  topMiner: string;
  /** The amount of ORE to distribute to the top miner */
  topMinerReward: bigint;
  /** The total amount of SOL deployed in the round */
  totalDeployed: bigint;
  /** The total amount of SOL put in the ORE vault */
  totalVaulted: bigint;
  /** The total amount of SOL won by miners for the round */
  totalWinnings: bigint;
}

/**
 * Constants from api/src/consts.rs
 */
export const CONSTANTS = {
  /** Program ID */
  PROGRAM_ID: 'oreV3EG1i9BEgiAJ8b177Z2S2rMarzak4NMv1kULvWv',

  /** Token decimals - 11 decimals (100 billion indivisible units per ORE) */
  TOKEN_DECIMALS: 11,

  /** One ORE in base units (grams) */
  ONE_ORE: BigInt(10 ** 11),

  /** Lamports per SOL */
  LAMPORTS_PER_SOL: BigInt(10 ** 9),

  /** Approximately 150 slots per minute on Solana */
  SLOTS_PER_MINUTE: 150,

  /** Approximate seconds per slot */
  SECONDS_PER_SLOT: 0.4,
} as const;
