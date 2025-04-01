#!/usr/bin/env tsx

/**
 * Script to create an access code for the chatbot
 * 
 * Usage:
 *   pnpm run auth:create-code
 *   pnpm run auth:create-code -- --description "Admin access" --expiryDays 30
 * 
 * Options:
 *   --description  Description of the access code (default: "Command line generated access code")
 *   --expiryDays   Number of days until the code expires (default: 90)
 */

import { db } from '../db';
import { createAccessCode } from '../actions/auth';

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const descriptionIndex = args.indexOf('--description');
  const expiryDaysIndex = args.indexOf('--expiryDays');
  
  const description = descriptionIndex !== -1 ? args[descriptionIndex + 1] : 'Command line generated access code';
  const expiryDays = expiryDaysIndex !== -1 ? parseInt(args[expiryDaysIndex + 1]) : 90;
  
  if (expiryDaysIndex !== -1 && isNaN(parseInt(args[expiryDaysIndex + 1]))) {
    console.error('Error: expiryDays must be a number');
    process.exit(1);
  }
  
  console.log('Creating access code with:');
  console.log(`- Description: ${description}`);
  console.log(`- Expiry days: ${expiryDays}`);
  
  try {
    const result = await createAccessCode({
      description,
      expiryDays
    });
    
    if (result.success) {
      console.log('\nAccess code created successfully!');
      console.log(`Code: ${result.code}`);
      console.log(`ID: ${result.id}`);
      console.log(`\nUsers can access the chatbot with this URL:`);
      console.log(`http://localhost:3000/access?code=${result.code}`);
    } else {
      console.error(`\nError: ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
  
  // Close the database connection
  process.exit(0);
}

main(); 