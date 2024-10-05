/* Import the necessary components from the anchor_lang crate which includes types, macros, and traits needed for Solana smart contract development.
use anchor_lang::prelude::*;

// Declare a unique identifier for this program on the Solana blockchain.
declare_id!("6iQxcq3MzQdkD8D4VgYy3WdkyNirKPvLPCauqaaCgfpG");

// Define a program module named `anchor_counter`.
#[program]
pub mod anchor_counter {
    // Import all items from the outer scope to be available in this module.
    use super::*;
    
    // A function to initialize a counter. It sets up an account to track the count, initializing it to zero.
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // Get a mutable reference to the counter account from the context.
        let counter: &mut Account<Counter> = &mut ctx.accounts.counter;
        // Set the initial count value to 0.
        counter.count = 0;
        // Log a message indicating the counter has been created.
        msg!("Counter account created. Current count: {}", counter.count);
        // Return Ok to indicate the function executed successfully.
        Ok(())
    }
    
    // A function to increment the counter. It increases the count by 1 each time it's called.
    pub fn increment(ctx: Context<Update>) -> Result<()> {
        // Get a mutable reference to the counter account from the context.
        let counter: &mut Account<Counter> = &mut ctx.accounts.counter;
        // Log the previous counter value.
        msg!("Previous counter: {}", counter.count);
        // Safely increment the counter to avoid overflow, using `checked_add`. Unwrap is used to assume success (not recommended in production).
        counter.count = counter.count.checked_add(1).unwrap();
        // Log a message indicating the counter has been incremented.
        msg!("Counter incremented. Current count: {}", counter.count);
        // Return Ok to indicate the function executed successfully.
        Ok(())
    }
}

// Define a structure to manage the accounts needed for the `initialize` function.
#[derive(Accounts)]
pub struct Initialize<'info> {
    // Defines an account that will be initialized as part of this instruction. 
    // The 'payer' is the one who pays for the account creation and data storage. 
    // 'space' reserves 16 bytes (8 for the discriminator and 8 for the `count` u64).
    #[account(init, payer = user, space = 8 + 8)]
    pub counter: Account<'info, Counter>,
    // Marks the 'user' account as a mutable signer, indicating that the user must sign the transaction and can pay fees.
    #[account(mut)]
    pub user: Signer<'info>,
    // Includes the system program which is required for creating accounts.
    pub system_program: Program<'info, System>,
}

// Define a structure to manage the accounts needed for the `increment` function.
#[derive(Accounts)]
pub struct Update<'info> {
    // Defines a mutable reference to an existing `counter` account.
    #[account(mut)]
    pub counter: Account<'info, Counter>,
    // Marks the 'user' account as a signer, meaning the user must sign the transaction.
    pub user: Signer<'info>,
}

// Define a structure to represent the counter account data.
#[account]
pub struct Counter {
    // A field to store the count, defined as a 64-bit unsigned integer.
    pub count: u64,
}
6iQxcq3MzQdkD8D4VgYy3WdkyNirKPvLPCauqaaCgfpG */

use anchor_lang::prelude::*;

// Declare the program ID. Replace "6iQxcq3MzQdkD8D4VgYy3WdkyNirKPvLPCauqaaCgfpG" with the actual program ID.
declare_id!("6iQxcq3MzQdkD8D4VgYy3WdkyNirKPvLPCauqaaCgfpG");

#[program]
pub mod simple_counter {
    use super::*;

    // Function to initialize the counter account. Sets the initial count to 0.
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let counter: &mut Account<Counter> = &mut ctx.accounts.counter;
        counter.count = 0;
        Ok(())
    }

    // Function to increment the counter. Checks for overflow and returns an error if it occurs.
    pub fn increment(ctx: Context<Update>) -> Result<()> {
        let counter: &mut Account<Counter> = &mut ctx.accounts.counter;
        counter.count = counter.count.checked_add(1).ok_or(ErrorCode::Overflow)?;
        Ok(())
    }

    // Function to decrement the counter. Checks for underflow and returns an error if it occurs.
    pub fn decrement(ctx: Context<Update>) -> Result<()> {
        let counter: &mut Account<Counter> = &mut ctx.accounts.counter;
        counter.count = counter.count.checked_sub(1).ok_or(ErrorCode::Underflow)?;
        Ok(())
    }
}

// Define the context for the Initialize function.
// This includes the accounts needed to initialize a new counter.
#[derive(Accounts)]
pub struct Initialize<'info> {
    // Initialize the counter account with the given space and payer.
    // Space is allocated for a 64-bit unsigned integer (8 bytes) plus 8 bytes of account metadata.
    #[account(init, payer = user, space = 8 + 8)]
    pub counter: Account<'info, Counter>,
    // The user who is signing the transaction. This account must be mutable as it will be paying for the transaction.
    #[account(mut)]
    pub user: Signer<'info>,
    // Reference to the system program, required for account creation.
    pub system_program: Program<'info, System>,
}

// Define the context for the Update function.
// This includes the accounts needed to update the counter.
#[derive(Accounts)]
pub struct Update<'info> {
    // The counter account to be updated. Must be mutable.
    #[account(mut)]
    pub counter: Account<'info, Counter>,
    // The user who is signing the transaction.
    pub user: Signer<'info>,
}

// Define the Counter account structure.
#[account]
pub struct Counter {
    // The count value, stored as a 64-bit unsigned integer.
    pub count: u64,
}

// Define the error codes for the program.
#[error_code]
pub enum ErrorCode {
    // Error when the counter overflows.
    #[msg("The count has overflowed.")]
    Overflow,
    // Error when the counter underflows.
    #[msg("The count has underflowed.")]
    Underflow,
}
