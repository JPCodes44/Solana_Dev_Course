import {
    ExtensionType,
    TOKEN_2022_PROGRAM_ID,
    createInitializeMintInstruction,
    createInitializePermanentDelegateInstruction,
    getMintLen,
  } from "@solana/spl-token";
  import {
    Connection,
    Keypair,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
  } from "@solana/web3.js";
   
  /**
   * Creates the mint with a permanent delegate
   * @param connection
   * @param payer
   * @param mintKeypair
   * @param decimals
   * @param permanentDelegate
   * @returns signature of the transaction
   */
  export async function createTokenExtensionMintWithPermanentDelegate(
    connection: Connection,
    payer: Keypair,
    mintKeypair: Keypair,
    decimals: number = 2,
    permanentDelegate: Keypair,
  ): Promise<string> {
    const mintAuthority = payer;
    const mint = mintKeypair.publicKey;
   
    const extensions = [ExtensionType.PermanentDelegate];
    const mintLen = getMintLen(extensions);
    const mintLamports =
      await connection.getMinimumBalanceForRentExemption(mintLen);
    const createAccountInstruction = SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mint,
      space: mintLen,
      lamports: mintLamports,
      programId: TOKEN_2022_PROGRAM_ID,
    });
   
    const initializePermanentDelegateInstruction =
      createInitializePermanentDelegateInstruction(
        mint,
        permanentDelegate.publicKey,
        TOKEN_2022_PROGRAM_ID,
      );
   
    const initializeMintInstruction = createInitializeMintInstruction(
      mint,
      decimals,
      mintAuthority.publicKey, // Designated Mint Authority
      null, // No Freeze Authority
      TOKEN_2022_PROGRAM_ID,
    );
   
    const transaction = new Transaction().add(
      createAccountInstruction,
      initializePermanentDelegateInstruction,
      initializeMintInstruction,
    );
   
    return await sendAndConfirmTransaction(connection, transaction, [
      payer,
      mintKeypair,
    ]);
  }