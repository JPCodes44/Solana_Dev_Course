import {
    sendAndConfirmTransaction,
    Connection,
    Keypair,
    SystemProgram,
    Transaction,
    TransactionSignature,
  } from "@solana/web3.js";
   
  import {
    ExtensionType,
    createInitializeMintInstruction,
    getMintLen,
    TOKEN_2022_PROGRAM_ID,
    createInitializeMintCloseAuthorityInstruction,
  } from "@solana/spl-token";
   
  export async function createClosableMint(
    connection: Connection,
    payer: Keypair,
    mintKeypair: Keypair,
    decimals: number,
  ): Promise<TransactionSignature> {
    const extensions = [ExtensionType.MintCloseAuthority];
    const mintLength = getMintLen(extensions);
   
    const mintLamports =
      await connection.getMinimumBalanceForRentExemption(mintLength);
   
    console.log("Creating a transaction with close mint instruction...");
    const mintTransaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: mintLength,
        lamports: mintLamports,
        programId: TOKEN_2022_PROGRAM_ID,
      }),
      createInitializeMintCloseAuthorityInstruction(
        mintKeypair.publicKey,
        payer.publicKey,
        TOKEN_2022_PROGRAM_ID,
      ),
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        decimals,
        payer.publicKey,
        null,
        TOKEN_2022_PROGRAM_ID,
      ),
    );
   
    console.log("Sending transaction...");
    const signature = await sendAndConfirmTransaction(
      connection,
      mintTransaction,
      [payer, mintKeypair],
      { commitment: "finalized" },
    );
    console.log(signature)
    return signature;
  }