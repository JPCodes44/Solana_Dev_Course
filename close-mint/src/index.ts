import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { initializeKeypair } from "@solana-developers/helpers";
// import { createClosableMint } from './create-mint' // - uncomment this in a later step
import {
  TOKEN_2022_PROGRAM_ID,
  burn,
  closeAccount,
  createAccount,
  getAccount,
  getMint,
  mintTo,
} from "@solana/spl-token";
import dotenv from "dotenv";
import { createClosableMint } from "./create-mint";
dotenv.config();

/**
 * Create a connection and initialize a keypair if one doesn't already exists.
 * If a keypair exists, airdrop a SOL if needed.
 */
const connection = new Connection("http://127.0.0.1:8899");
const payer = await initializeKeypair(connection);
 
console.log(`public key: ${payer.publicKey.toBase58()}`);
 
const mintKeypair = Keypair.generate();
const mint = mintKeypair.publicKey;
console.log("\nmint public key: " + mintKeypair.publicKey.toBase58() + "\n\n");
 
// CREATE A MINT WITH CLOSE AUTHORITY
const decimals = 9;
 
await createClosableMint(connection, payer, mintKeypair, decimals);
 
// MINT TOKEN
/**
 * Creating an account and mint 1 token to that account
 */
console.log("Creating an account...");
const sourceKeypair = Keypair.generate();
const sourceAccount = await createAccount(
  connection,
  payer,
  mint,
  sourceKeypair.publicKey,
  undefined,
  { commitment: "finalized" },
  TOKEN_2022_PROGRAM_ID,
);
 
console.log("Minting 1 token...\n\n");
const amount = 1 * LAMPORTS_PER_SOL;
await mintTo(
  connection,
  payer,
  mint,
  sourceAccount,
  payer,
  amount,
  [payer],
  { commitment: "finalized" },
  TOKEN_2022_PROGRAM_ID,
);
 
// VERIFY SUPPLY
/**
 * Get mint information to verify supply
 */
const mintInfo = await getMint(
    connection,
    mintKeypair.publicKey,
    "finalized",
    TOKEN_2022_PROGRAM_ID,
  );
  console.log("Initial supply: ", mintInfo.supply);
 
// TRY CLOSING WITH NON ZERO SUPPLY
/**
 * Try closing the mint account when supply is not 0
 *
 * Should throw `SendTransactionError`
 */
try {
    await closeAccount(
      connection,
      payer,
      mintKeypair.publicKey,
      payer.publicKey,
      payer,
      [],
      { commitment: "finalized" },
      TOKEN_2022_PROGRAM_ID,
    );
  } catch (e) {
    console.log(
      "Close account fails here because the supply is not zero. Check the program logs:",
      (e as any).logs,
      "\n\n",
    );
  }
 
// BURN SUPPLY
const sourceAccountInfo = await getAccount(
    connection,
    sourceAccount,
    "finalized",
    TOKEN_2022_PROGRAM_ID,
  );
   
  console.log("Burning the supply...");
  const burnSignature = await burn(
    connection,
    payer,
    sourceAccount,
    mintKeypair.publicKey,
    sourceKeypair,
    sourceAccountInfo.amount,
    [],
    { commitment: "finalized" },
    TOKEN_2022_PROGRAM_ID,
  );
 
// CLOSE MINT
const minty = await getMint(
    connection,
    mintKeypair.publicKey,
    "finalized",
    TOKEN_2022_PROGRAM_ID,
  );
   
  console.log("After burn supply: ", minty.supply);
   
  const accountInfoBeforeClose = await connection.getAccountInfo(
    mintKeypair.publicKey,
    "finalized",
  );
   
  console.log("Account closed? ", accountInfoBeforeClose === null);
   
  console.log("Closing account after burning the supply...");
  const closeSignature = await closeAccount(
    connection,
    payer,
    mintKeypair.publicKey,
    payer.publicKey,
    payer,
    [],
    { commitment: "finalized" },
    TOKEN_2022_PROGRAM_ID,
  );
   
  const accountInfoAfterClose = await connection.getAccountInfo(
    mintKeypair.publicKey,
    "finalized",
  );
   
  console.log("Account closed? ", accountInfoAfterClose === null);