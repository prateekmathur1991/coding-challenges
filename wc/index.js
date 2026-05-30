#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');

async function getFileSize(somePath) {
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

async function getWordCount(somePath) {
  let wordCount = 0;
  const fileStream = fs.createReadStream(somePath);
  const lineReader = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  // Process the file line by line without keeping it all in memory
  for await (const line of lineReader) {
    const cleanedLine = line.trim();
    if (cleanedLine !== '') {
      wordCount += cleanedLine.split(/\s+/).length;
    }
  }

  return wordCount;
}

async function getCharacterCount(somePath) {
  return new Promise((resolve, reject) => {
    let totalChars = 0;
    fs.createReadStream(somePath)
      .on('data', (chunk) => {
        totalChars += [...chunk].length;
      })
      .on('end', () => resolve(totalChars))
      .on('error', () => reject("Buffer reading failed"));
  });
}

const args = process.argv.slice(2);

if (args.length == 0) {
  console.error("Usage: ccwc <flag> <filename>");
  process.exit(1);
}

if (args.length == 2) {
  let flag = args[0];
  let filePath = args[1];

  if (flag === '-c') {
    (async () => {
      let fileSize = await getFileSize(filePath);
      console.log(fileSize + ' ' + filePath);
    })();
  } else if (flag === '-l') {
    (async () => {
      let lineCount = await getFileLineCount(filePath);
      console.log(lineCount + ' ' + filePath);
    })();
  } else if (flag === '-w') {
    (async () => {
      let wordCount = await getWordCount(filePath);
      console.log(wordCount + ' ' + filePath);
    })();
  } else if (flag === '-m') {
    (async () => {
      let characterCount = await getCharacterCount(filePath);
      console.log(characterCount + ' ' + filePath);
    })();
  } else {
    console.error('Invalid flag used');
    process.exit(1);
  }
} else {
  let filePath = args[0];
  (async () => {
    let fileSize = await getFileSize(filePath);
    let lineCount = await getFileLineCount(filePath);
    let wordCount = await getWordCount(filePath);
    console.log(fileSize + ' ' + lineCount + ' ' + wordCount + ' ' + filePath);
  })();
}