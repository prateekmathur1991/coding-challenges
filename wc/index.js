#!/usr/bin/env node

const args = process.argv.slice(2);
if (args.length > 0) {
  console.log(`Arguments received: ${args.join(", ")}`);
}