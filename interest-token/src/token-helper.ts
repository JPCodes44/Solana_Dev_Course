import {
    ExtensionType,
    TOKEN_2022_PROGRAM_ID,
    createInitializeInterestBearingMintInstruction,
    createInitializeMintInstruction,
    getMintLen,
  } from "@solana/spl-token";
  import {
    sendAndConfirmTransaction,
    Connection,
    Keypair,
    Transaction,
    PublicKey,
    SystemProgram,
  } from "@solana/web3.js";

  export async function createTokenWithInterestRateExtension(
    connection: Connection,
    payer: Keypair, 
    mint: PublicKey,
    mintLen: number,
    rateAuthority: Keypair,
    rate: number,
    mintKeypair: Keypair,
  ) {
    const mintAuthority = payer;
    const decimals = 9;

    const extensions = [ExtensionType.InterestBearingConfig];
    const mintLength = getMintLen(extensions);
    const mintLamports =
    await connection.getMinimumBalanceForRentExemption(mintLength);
 
    const mintTransaction = new Transaction().add(
    SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mint,
        space: mintLen,
        lamports: mintLamports,
        programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeInterestBearingMintInstruction(
        mint,
        rateAuthority.publicKey,
        rate,
        TOKEN_2022_PROGRAM_ID,
    ),
    createInitializeMintInstruction(
        mint,
        decimals,
        mintAuthority.publicKey,
        null,
        TOKEN_2022_PROGRAM_ID,
    ),
    );
 
    await sendAndConfirmTransaction(
    connection,
    mintTransaction,
    [payer, mintKeypair],
    undefined,
    );

    }
