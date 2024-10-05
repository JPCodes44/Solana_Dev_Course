import {
    sendAndConfirmTransaction,
    Connection,
    Keypair,
    SystemProgram,
    Transaction,
    PublicKey,
  } from "@solana/web3.js";
   
  import {
    ExtensionType,
    createInitializeMintInstruction,
    createInitializePermanentDelegateInstruction,
    mintTo,
    createAccount,
    getMintLen,
    TOKEN_2022_PROGRAM_ID,
    transferChecked,
    getAccount,
    burnChecked,
    approveChecked,
  } from "@solana/spl-token";
  import { initializeKeypair } from "@solana-developers/helpers";
import { createTokenExtensionMintWithPermanentDelegate } from "./mint-helper";
   
  const connection = new Connection("http://127.0.0.1:8899", "confirmed");
  const payer = await initializeKeypair(connection);
   
  const mintAuthority = payer;
  const bob = Keypair.generate();
  const carol = Keypair.generate();
  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;
  const permanentDelegate = payer;
   
  const extensions = [ExtensionType.PermanentDelegate];
  const mintLen = getMintLen(extensions);
   
  const decimals = 9;
  const amountToMint = 100;
  const amountToTransfer = 10;
  const amountToBurn = 5;
   
  // Create mint account with permanent delegate
  await createTokenExtensionMintWithPermanentDelegate(
    connection,
    payer, // Also known as alice
    mintKeypair,
    decimals,
    permanentDelegate,
  );
   
  // Create delegate and destination token accounts
  const aliceAccount = await createAccount(
    connection,
    payer,
    mint,
    payer.publicKey,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID,
  );
   
  const bobAccount = await createAccount(
    connection,
    payer,
    mint,
    bob.publicKey,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID,
  );
   
  const carolAccount = await createAccount(
    connection,
    payer,
    mint,
    carol.publicKey,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID,
  );
   
  // Mint tokens to accounts
  const tokenAccounts = [aliceAccount, bobAccount, carolAccount];
const names = ["Alice", "Bob", "Carol"];
 
for (const holder of tokenAccounts) {
  await mintTo(
    connection,
    payer,
    mint,
    holder,
    mintAuthority,
    amountToMint,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID,
  );
}
 
console.log("Initial Balances: ");
await printBalances(connection, tokenAccounts, names);
   
  // Attempt to transfer with correct delegate
  {
    // Have Alice transfer tokens from Bob to herself ( Will Succeed )
    try {
      await transferChecked(
        connection,
        payer,
        bobAccount,
        mint,
        aliceAccount,
        payer,
        amountToTransfer,
        decimals,
        undefined,
        undefined,
        TOKEN_2022_PROGRAM_ID,
      );
      console.log(
        "✅ Since Alice is the permanent delegate, she has control over all token accounts of this mint",
      );
      await printBalances(connection, tokenAccounts, names);
    } catch (error) {
      console.log("Alice should be able to transfer Bob's tokens to Alice");
    }
  }
   
  // Attempt to transfer without correct delegate
  {
    // Have Bob try to transfer tokens from Alice to himself ( Will Fail )
    try {
      await transferChecked(
        connection,
        payer,
        aliceAccount, // transfer from
        mint,
        bobAccount,
        bob, // incorrect delegate
        amountToTransfer,
        decimals,
        undefined,
        undefined,
        TOKEN_2022_PROGRAM_ID,
      );
      console.log("Bob should not be able to transfer tokens");
    } catch (error) {
      console.log(
        "✅ We expect this to fail because Bob does not have authority over Alice's funds",
      );
      await printBalances(connection, tokenAccounts, names);
    }
  }
   
  // Attempt to transfer from one account to another with correct delegate
  {
    // Have Alice transfer tokens from Bob to Carol
    try {
      await transferChecked(
        connection,
        payer,
        bobAccount, // transfer from
        mint,
        carolAccount, // transfer to
        payer,
        amountToTransfer,
        decimals,
        undefined,
        undefined,
        TOKEN_2022_PROGRAM_ID,
      );
      console.log(
        "✅ Since Alice is the permanent delegate, she has control and can transfer Bob's tokens to Carol",
      );
      await printBalances(connection, tokenAccounts, names);
    } catch (error) {
      console.log("Alice should be able to transfer Bob's tokens to Alice");
    }
  }
   
  // Attempt to burn with correct delegate
  {
    // Have Alice burn Bob's tokens
    try {
      await burnChecked(
        connection,
        payer,
        bobAccount,
        mint,
        payer, // correct permanent delegate
        amountToBurn, // in this case is 5
        decimals,
        undefined,
        undefined,
        TOKEN_2022_PROGRAM_ID,
      );
      console.log(
        "✅ Since Alice is the permanent delegate, she has control and can burn Bob's tokens",
      );
      await printBalances(connection, tokenAccounts, names);
    } catch (error) {
      console.error("Alice should be able to burn Bob's tokens");
    }
  }
   
  // Attempt to burn without correct delegate
  {
    // Have Bob try to burn tokens from Carol ( Will Fail )
    try {
      await burnChecked(
        connection,
        payer,
        carolAccount,
        mint,
        bob, // wrong permanent delegate
        amountToBurn,
        decimals,
        undefined,
        undefined,
        TOKEN_2022_PROGRAM_ID,
      );
      await printBalances(connection, tokenAccounts, names);
      console.error("Bob should not be able to burn the tokens");
    } catch (error) {
      console.log(
        "✅ We expect this to fail since Bob is not the permanent delegate and has no control over the tokens",
      );
    }
  }
   
  // Grant permission to an account to transfer tokens from a different token account
  {
    // Approve Carol to transfer Bob's tokens to herself
    await approveChecked(
      connection,
      payer,
      mint,
      bobAccount,
      carol.publicKey,
      bob,
      amountToTransfer, // maximum amount to transfer
      decimals,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );
   
    await transferChecked(
      connection,
      payer,
      bobAccount,
      mint,
      carolAccount,
      carol,
      amountToTransfer,
      decimals,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );
   
    console.log(
      "✅ Since Alice is the permanent delegate, she can allow Carol to transfer Bob's tokens to Carol",
    );
    await printBalances(connection, tokenAccounts, names);
  }
   
  // Try to transfer tokens again with Carol as the delegate, overdrawing her allotted control
  {
    // Try to transfer again with Carol as the delegate overdrawing her allotted control
    try {
      await transferChecked(
        connection,
        payer,
        bobAccount,
        mint,
        carolAccount,
        carol, // Owner - whoever has the authority to transfer tokens on behalf of the destination account
        amountToTransfer,
        decimals,
        undefined,
        undefined,
        TOKEN_2022_PROGRAM_ID,
      );
    } catch (e) {
      console.log(
        `✅ We expect this to fail since Carol already transferred ${amountToTransfer} tokens and has no more allotted`,
      );
    }
  }

  async function printBalances(
    connection: Connection,
    tokenAccounts: PublicKey[],
    names: string[],
  ) {
    if (tokenAccounts.length !== names.length)
      throw new Error("Names needs to be one to one with accounts");
   
    for (let i = 0; i < tokenAccounts.length; i++) {
      const tokenInfo = await getAccount(
        connection,
        tokenAccounts[i],
        undefined,
        TOKEN_2022_PROGRAM_ID,
      );
   
      console.log(`${names[i]}: ${tokenInfo.amount}`);
    }
  }