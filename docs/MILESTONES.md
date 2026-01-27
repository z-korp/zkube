# Milestones

<p align="center">
  <img src="../assets/zkube.png" height="256">
</p>

# Starknet Hacker House

## Development Milestones

### Contract Development with Dojo Framework

- Implement core game logic and smart contracts using the Dojo framework on Starknet.
- Ensure contracts offer a strong layer of security.

### Client Development for Mobile Users

- Create a React-based client interface for zKube, optimized for mobile users.
- Integrate the client with the Dojo framework to ensure seamless interaction with the smart contracts.

### Authentication and Transaction Signing

- Implement authentication and transaction signing using the Controller Cartridge.
- Ensure secure and user-friendly authentication for players.

### Deployment on Sepolia

- Deploy zKube on the Sepolia testnet.
- Leverage the Cartridge paymaster functionality of the controller to manage transaction fees.

## Additional Features

### Bonus Implementation

- Introduce in-game bonuses that players can earn or purchase to enhance gameplay.

### Level System (Completed)

- Transform zKube into a puzzle roguelike with level progression
- Implement constraint system for level objectives
- Add star/cube performance rating per level
- See [LEVEL_SYSTEM_PLAN.md](./LEVEL_SYSTEM_PLAN.md) for details

### Cube Economy (Core Complete)

- [x] CUBE token implemented as soulbound ERC1155 (`cube_token` system)
- [x] Cube earning during gameplay (combos, achievements)
- [x] Cube minting at game over via ERC1155
- [x] Permanent Shop (starting bonuses, bag size, bridging rank) - burns ERC1155
- [x] In-Game Shop (Hammer, Wave, Totem consumables every 5 levels)
- [x] Cube bridging (`create_with_cubes()` burns from wallet)
- [ ] Level completion cubes (1-3 based on efficiency) - not yet implemented
- [ ] Milestone bonuses (every 10 levels) - not yet implemented
- [ ] ExtraMoves consumable - not yet implemented
- See [CUBE_ECONOMY.md](./CUBE_ECONOMY.md) for details

### Tournament Feature Development

- Develop a tournament mode where players pay a small fee to participate.
- Implement logic to collect entry fees and distribute rewards.
- Ensure the game takes a small percentage of the tournament entry fees as revenue.

# Business Model

The primary business model for zKube revolves around the tournament feature.

### Tournament Entry Fees

- Players pay a small fee to enter tournaments.
- A percentage of the entry fees will be taken as revenue, with the remaining amount distributed as prizes to the winners.

### In-Game Purchases

- If tournament revenue is insufficient, consider offering in-game purchases.
- Players can buy bonuses to enhance their gameplay experience in addition of winning them freely (but limited).

# Roadmap

## Month 1-2: Developing, Testing and Feedback

- Conduct a robust testing phase on the Sepolia testnet.
- Collect feedback from early users and the developer community.
- Identify and fix bugs, optimize game performance, and refine the user experience.

## Month 3-4: Feature Enhancement

- Implement any additional features identified during the testing phase.
- Improve the tournament mode and in-game bonuses based on user feedback.
- Enhance security and scalability of smart contracts.

## Month 5: Mainnet Preparation

- Prepare for deployment on the Mainnet.
- Conduct security audits of smart contracts.
- Optimize the game for Mainnet deployment, ensuring smooth transition from Sepolia.

## Month 6: Mainnet Launch

- Deploy zKube on the Mainnet.
- Launch marketing and user acquisition campaigns.
- Monitor the Mainnet launch, ensuring stability and addressing any issues that arise.

By following this roadmap, we aim to deliver a fully functional, engaging, and secure zKube game on the Mainnet, offering players a unique and strategic puzzle-solving experience on-chain.
