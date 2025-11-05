ORE is a digital store of value on the Solana blockchain.

### Motivation
Blockchains enable the creation of trustless digital currencies which do not depend on any central bank or issuing authority. As one of the fastest and most widely used blockchains in the world, Solana has become the ideal home for a new generation of digital assets and financial applications. While many other digital stores of value exist and provide immense value to their users, none are native to Solana, and thus rely on risky third-party intermediaries to use with protocols on Solana. ORE is designed from the ground up to serve as a Solana-native store of value with maximal freedom and minimal trust assumptions.

### Mining
Mining is the process by which new ORE tokens are created and distributed to users.

How it works

- Each round, miners have one minute to prospect on blocks in a 5x5 grid. 
- At the end of the round, one winning block is chosen by a secure random number generator on the Solana blockchain. 
- All SOL deployed on losing blocks is split amongst miners in proportion to the size of their claimed space on the winning block. 
- In addition, the protocol will split a +1 ORE reward amongst all winning miners on the winning block. 
- Alternatively, half of the time, one winning miner will be selected by weighted random chance to receive the entire +1 ORE reward.

Motherlode
- Each round, +0.2 ORE is minted and added to the motherlode pool. 
- When the winning block is revealed, there is a 1 in 625 chance that those winning miners will also hit the motherlode. 
- If the motherlode is hit, the pool is split by the winning miners in proportion to the size of their claimed space on the winning block. 
- Alternatively, if the motherlode is not hit, the pool keeps accumulating and will be distributed to winning miners when it is hit in a future round.

Refining
A "refining fee" of 10% is applied to all ORE mining rewards when claimed. The proceeds from this fee are automatically redistributed to other miners in proportion to their unclaimed ORE mining rewards. Thus, the longer a miner holds onto their mined ORE, the more refined ORE they will receive. The net effect of this process is to redistribute tokens to longer term holders.

Staking
Learn how to stake.
ORE holders can stake their assets to earn yield via protocol revenue sharing.
How it works
10% of all SOL mining rewards are automatically collected by the protocol as revenue. All of this SOL is used to buyback the ORE token off open market. Of the ORE that is purchased in the buyback program, 90% is automatically buried and 10% is distributed to stakers as yield. This effectively allows stakers to "double-dip" on protocol revenue, earning from both value appreciation of the buyback and revenue share.

Tokenomics
Learn about the token.
ORE tokenomics are optimized for longterm holders.
Supply
ORE is a fair launch cryptocurrency. It has a capped maximum supply of 5 million tokens and zero insider or team allocations. All minting is programmatically controlled by a smart contract on the Solana blockchain. The protocol mints approximately +1 ORE per minute as part of the standard mining process. New tokens can always be mined as long as the current circulating supply is below the maximum supply limit.
Demand
10% of all SOL mining rewards are collected by the protocol as revenue. The protocol automatically uses this revenue to buyback the ORE token off open market, reducing circulating supply. These buybacks help offset the cost to holders of mining new tokens. The term "bury" is used here to indicate that burned tokens can be reminted as long as circulating supply is below the maximum supply limit.
Fees
Below is a breakdown of all fees charged and managed by the protocol:
10% of all SOL mining rewards are collected by the protocol as revenue.
10% of all ORE purchased through the buyback program is distributed to stakers as yield.
10% of all ORE mining rewards are redistributed to other miners in proportion to their unclaimed mining rewards.
1% of all SOL deployed by miners is collected as an admin fee to support development, operations, and maintenance.
0.00001 SOL is collected by the protocol as a deposit when opening a new miner account in case the account needs to be checkpointed to avoid losing mining rewards.
0.000005 SOL is collected by the protocol per automated transaction when scheduling the autominer to offset baseline Solana transaction costs.