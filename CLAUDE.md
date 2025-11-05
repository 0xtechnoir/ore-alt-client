# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ORE is a crypto mining protocol built on Solana. The codebase is structured as a Rust workspace with three main components:
- **api**: Core API defining instructions, state, events, errors, and SDK functions
- **program**: Solana on-chain program implementation (BPF program)
- **cli**: Command-line interface for interacting with the protocol

## Development Commands

### Building
```bash
# Build the entire workspace
cargo build

# Build the Solana program (for deployment)
cargo build-sbf
```

### Testing
```bash
# Run all tests with Solana BPF
cargo test-sbf

# Generate line coverage report
cargo llvm-cov
```

### Local Development
```bash
# Start local test validator with program deployed and required accounts cloned
./localnet.sh
```

The `localnet.sh` script starts a Solana test validator with:
- The ORE program deployed at `oreV3EG1i9BEgiAJ8b177Z2S2rMarzak4NMv1kULvWv`
- Cloned mainnet accounts (mint, treasury, boost reserve, etc.)

### Rust Toolchain
This project uses Rust 1.82.0 with specific targets (see `rust-toolchain.toml`). The toolchain is automatically selected by rustup.

## Architecture

### Three-Tier Structure

1. **API Layer (`api/`)**: Pure Rust library defining the protocol interface
   - `instruction.rs`: Instruction enum and serializable instruction structs using `Pod` and `Zeroable` traits
   - `state/`: Account state structures (Board, Miner, Round, Stake, Treasury, etc.)
   - `sdk.rs`: Helper functions to construct instructions and derive PDAs
   - `consts.rs`: Program-wide constants (addresses, seeds, time constants)
   - `event.rs`: Event definitions for logging
   - `error.rs`: Custom error types

2. **Program Layer (`program/`)**: On-chain Solana program (BPF)
   - Each instruction has its own module (e.g., `deploy.rs`, `checkpoint.rs`, `claim_ore.rs`)
   - `lib.rs`: Main entry point with instruction router
   - Uses the Steel framework for account validation and CPI helpers
   - Instruction handlers are named `process_<instruction_name>`

3. **CLI Layer (`cli/`)**: Off-chain client for user interaction
   - Single file at `cli/src/main.rs` (31KB)
   - Interacts with the on-chain program via RPC

### Key Architectural Patterns

**Instruction Processing Flow**:
```
User/CLI → Instruction (api/instruction.rs) → Router (program/lib.rs) → Handler (program/src/*.rs)
```

**PDA Derivation**: All PDAs use constant seeds defined in `api/src/consts.rs`:
- Board: `b"board"`
- Miner: `b"miner"` + user pubkey
- Round: `b"round"` + round number
- Stake: `b"stake"` + user pubkey
- Treasury: `b"treasury"`
- Automation: `b"automation"` + user pubkey

**State Management**: State accounts are defined in `api/src/state/` and track:
- Board: Current round number and timestamps
- Miner: Individual miner's game state and position
- Round: Game state for a specific round (supply, difficulty, winners)
- Stake: User staking balances and yield tracking
- Treasury: Mints, burns, and escrows ORE tokens

### Instruction Categories

**Mining Operations**:
- `Deploy`: Deploy SOL to claim board space
- `Checkpoint`: Checkpoint rewards from prior round
- `ClaimORE`/`ClaimSOL`: Claim mining rewards
- `Reset`: Reset board for new round
- `Automate`: Configure automation
- `Log`: Log event data

**Staking Operations**:
- `Deposit`/`Withdraw`: Manage stake positions
- `ClaimYield`: Claim staking rewards
- `ClaimSeeker`: Claim Seeker genesis token

**Admin Operations**:
- `Bury`: Buy-and-burn transaction
- `Wrap`: Wrap SOL in treasury
- `SetAdmin`/`SetFeeCollector`: Update authorities

### Steel Framework

The program uses the Steel framework (`steel = "4.0.2"`) extensively for:
- Account validation and deserialization
- PDA derivation helpers
- CPI (Cross-Program Invocation) utilities
- Instruction parsing with `parse_instruction()`

All instruction handlers import `use steel::*;` and follow Steel's patterns for account handling.

### Token Economics

- Token decimals: 11 (100 billion indivisible units per ORE, called "grams")
- `ONE_ORE = 10^11`
- Max supply: 5 million ORE
- ORE mint address: `oreoU2P8bN6jkk3jbaiVxYnG1dCXcYxwhwyK9jSybcp`

### Time Constants

The protocol operates in rounds with specific durations:
- Solana block timing: ~150 slots per minute
- Round durations: ONE_WEEK_SLOTS = 7 * 24 * 60 * 150
- Intermission between rounds: 35 slots
- Checkpoint expiry: ONE_WEEK (604,800 seconds)

## Important Implementation Details

- The program ID is declared in `api/src/lib.rs`: `oreV3EG1i9BEgiAJ8b177Z2S2rMarzak4NMv1kULvWv`
- Admin address is hardcoded in `consts.rs`
- Const PDA derivations use compile-time computation with `const-crypto`
- All instruction structs implement `Pod` and `Zeroable` for zero-copy deserialization
- Overflow checks are enabled in both dev and release profiles
