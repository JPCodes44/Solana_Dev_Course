import { Connection, Keypair, PublicKey } from "@solana/web3.js";
 
import {
  ExtensionType,
  getMintLen,
  TOKEN_2022_PROGRAM_ID,
  getMint,
  getInterestBearingMintConfigState,
  updateRateInterestBearingMint,
  amountToUiAmount,
  mintTo,
  createAssociatedTokenAccount,
  getAccount,
  AuthorityType,
  setAuthority,
} from "@solana/spl-token";
 
import { initializeKeypair, makeKeypairs } from "@solana-developers/helpers";
import { createTokenWithInterestRateExtension } from "./token-helper";
 
const connection = new Connection("http://127.0.0.1:8899", "confirmed");
const payer = await initializeKeypair(connection);
const [otherAccount, mintKeypair] = makeKeypairs(2);
const extensions = [ExtensionType.InterestBearingConfig];
const mintLength = getMintLen(extensions);
const mint = mintKeypair.publicKey;
const rateAuthority = payer;
 
const rate = 32_767;
 
// Create an interest-bearing token
await createTokenWithInterestRateExtension(
    connection,
    payer,      
    mint,
    mintLength,
    rateAuthority,
    rate,
    mintKeypair,
  );
 
// Create an associated token account
const payerTokenAccount = await createAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey,
    undefined,
    TOKEN_2022_PROGRAM_ID,
  );
 
// Create the getInterestBearingMint function
interface GetInterestBearingMint {
    connection: Connection;
    mint: PublicKey;
  }
   
  async function getInterestBearingMint(inputs: GetInterestBearingMint) {
    const { connection, mint } = inputs;
    // retrieves information of the mint
    const mintAccount = await getMint(
      connection,
      mint,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );
   
    // retrieves the interest state of mint
    const interestBearingMintConfig =
      await getInterestBearingMintConfigState(mintAccount);
   
    // returns the current interest rate
    return interestBearingMintConfig?.currentRate;
  }
 
// Attempt to update the interest rate
const initialRate = await getInterestBearingMint({ connection, mint });
try {
  await updateRateInterestBearingMint(
    connection,
    payer,
    mint,
    payer,
    0, // updated rate
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID,
  );
  const newRate = await getInterestBearingMint({ connection, mint });
 
  console.log(
    `✅ - We expected this to pass because the rate has been updated. Old rate: ${initialRate}. New rate: ${newRate}`,
  );
} catch (error) {
  console.error("You should be able to update the interest.");
}
 
// Attempt to update the interest rate with the incorrect owner
try {
    await updateRateInterestBearingMint(
      connection,
      otherAccount,
      mint,
      otherAccount, // incorrect authority
      0, // updated rate
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );
    console.log("You should be able to update the interest.");
  } catch (error) {
    console.error(
      `✅ - We expected this to fail because the owner is incorrect.`,
    );
  }
 
// Log the accrued interest
{
    // Logs out interest on token
    for (let i = 0; i < 5; i++) {
      const rate = await getInterestBearingMint({ connection, mint });
      await mintTo(
        connection,
        payer,
        mint,
        payerTokenAccount,
        payer,
        100,
        undefined,
        undefined,
        TOKEN_2022_PROGRAM_ID,
      );
   
      const tokenInfo = await getAccount(
        connection,
        payerTokenAccount,
        undefined,
        TOKEN_2022_PROGRAM_ID,
      );
   
      // Convert amount to UI amount with accrued interest
      const uiAmount = await amountToUiAmount(
        connection,
        payer,
        mint,
        tokenInfo.amount,
        TOKEN_2022_PROGRAM_ID,
      );
   
      console.log(
        `Amount with accrued interest at ${rate}: ${tokenInfo.amount} tokens = ${uiAmount}`,
      );
    }
  }
 
// Log the interest-bearing mint configuration state
{
    // Logs out interest on token
    for (let i = 0; i < 5; i++) {
      const rate = await getInterestBearingMint({ connection, mint });
      await mintTo(
        connection,
        payer,
        mint,
        payerTokenAccount,
        payer,
        100,
        undefined,
        undefined,
        TOKEN_2022_PROGRAM_ID,
      );
   
      const tokenInfo = await getAccount(
        connection,
        payerTokenAccount,
        undefined,
        TOKEN_2022_PROGRAM_ID,
      );
   
      // Convert amount to UI amount with accrued interest
      const uiAmount = await amountToUiAmount(
        connection,
        payer,
        mint,
        tokenInfo.amount,
        TOKEN_2022_PROGRAM_ID,
      );
   
      console.log(
        `Amount with accrued interest at ${rate}: ${tokenInfo.amount} tokens = ${uiAmount}`,
      );
    }
  }

  // Log interest bearing mint config state
const mintAccount = await getMint(
    connection,
    mint,
    undefined,
    TOKEN_2022_PROGRAM_ID,
  );
   
  // Get Interest Config for Mint Account
  const interestBearingMintConfig =
    await getInterestBearingMintConfigState(mintAccount);
   
  console.log(
    "\nMint Config:",
    JSON.stringify(interestBearingMintConfig, null, 2),
  );
 
// Update the rate authority and attempt to update the interest rate with the new authority
try {
    await setAuthority(
      connection,
      payer,
      mint,
      rateAuthority,
      AuthorityType.InterestRate, // Rate type (InterestRate)
      otherAccount.publicKey, // new rate authority,
      [],
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );
   
    await updateRateInterestBearingMint(
      connection,
      payer,
      mint,
      otherAccount, // new authority
      10, // updated rate
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );
   
    const newRate = await getInterestBearingMint({ connection, mint });
   
    console.log(
      `✅ - We expected this to pass because the rate can be updated with the new authority. New rate: ${newRate}`,
    );
  } catch (error) {
    console.error(
      `You should be able to update the interest with new rate authority.`,
    );
  }