// Import all necessary components from the Anchor framework and Chai for assertions
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import { AnchorCounter } from "../target/types/anchor_counter";

// Describe a test suite named "anchor-counter"
describe("anchor-counter", () => {
  // Configure the client to use the local Solana cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Connect to the deployed AnchorCounter program
  const program = anchor.workspace.AnchorCounter as Program<AnchorCounter>;

  // Generate a new keypair for the counter account
  const counter = anchor.web3.Keypair.generate();

  // Log the public key of the counter account for reference
  console.log("Counter public key:", counter.publicKey.toBase58());

  // Define a test case for initializing the counter
  it("Is initialized!", async () => {
    // Send a transaction to the blockchain to initialize the counter
    const tx = await program.methods
      .initialize()
      .accounts({
        counter: counter.publicKey,
      })
      .signers([counter])
      .rpc();

    // Log the transaction signature
    console.log("Initialize transaction signature:", tx);

    // Fetch the initialized account and check if its count is 0
    const account = await program.account.counter.fetch(counter.publicKey);
    expect(account.count.toNumber() === 0).to.equal(true);
  });

  // Define a test case for incrementing the counter
  it("Incremented the count", async () => {
    // Send a transaction to increment the counter
    const tx = await program.methods
      .increment()
      .accounts({
        counter: counter.publicKey,
        user: provider.wallet.publicKey,
      })
      .rpc();

    // Log the transaction signature
    console.log("Increment transaction signature:", tx);

    // Fetch the updated account and check if its count is 1
    const account = await program.account.counter.fetch(counter.publicKey);
    expect(account.count.toNumber() === 1).to.equal(true);
  });
});
