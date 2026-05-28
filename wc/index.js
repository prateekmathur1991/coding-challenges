#!/usr/bin/env node

let fs = require('fs').promises;

const fileStats = async (somePath) => {
  let stats = await fs.stat(somePath);
  return stats.size;
}

async function getFileStats(somePath) {
  let stats = await fs.stat(somePath);
  return stats.size;
}

const args = process.argv.slice(2);
if (args.length != 2) {
  console.error('Usage: ccwc <flag> <fileName>');
  process.exit(1);
}

let flag = args[0];
let filePath = args[1];

if (flag === '-c') {
  let thatValue = getFileStats(filePath);
  thatValue.then((result) => console.log(result));
}