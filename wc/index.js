#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline'); 

async function getFileStats(somePath) {
  let stats = await fs.promises.stat(somePath);
  return stats.size;
}

async function getFileLineCount(somePath) {
  return new Promise((resolve, reject) => {
    let lineCount = 0;
    fs.createReadStream(somePath)
    .on('data', (buffer) => {
      for (let i = 0; i < buffer.length; i++) {
          if (buffer[i] === 10) lineCount++; // 10 is '\n'
      }
    })
    .on('end', () => resolve(lineCount))
    .on('error', () => reject("Buffer reading failed"));
  });
}

const args = process.argv.slice(2);
if (args.length != 2) {
  console.error('Usage: ccwc <flag> <fileName>');
  process.exit(1);
}

let flag = args[0];
let filePath = args[1];

if (flag === '-c') {
  (async () => {
    const result = await getFileStats(filePath);
    console.log(result + ' ' + filePath);
  })();

} else if (flag === '-l') {
  (async () => {
    let lineCount = await getFileLineCount(filePath);
    console.log(lineCount + ' ' + filePath);
  })();
} else {
  console.error('Invalid flag used');
  process.exit(1);
}