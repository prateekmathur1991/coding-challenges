#!/usr/bin/env node

const fs = require('fs');
const { StringDecoder } = require('string_decoder');

async function processStream(stream) {
  return new Promise((resolve, reject) => {
    const decoder = new StringDecoder('utf8');
    let leftover = '';
    let words = 0;
    let lines = 0;
    let chars = 0; // character count (code points)
    let bytes = 0;

    stream.on('error', (err) => reject(err));

    stream.on('data', (chunk) => {
      bytes += chunk.length;
      const text = decoder.write(chunk);

      // count lines
      for (let i = 0; i < text.length; i++) {
        if (text[i] === '\n') lines++;
      }

      // count characters (iterate by code point)
      for (const _ch of text) chars++;

      // count words using leftover to handle split tokens across chunks
      const combined = leftover + text;
      const parts = combined.split(/\s+/);
      if (/\s$/.test(combined)) {
        leftover = '';
        words += parts.filter(Boolean).length;
      } else {
        leftover = parts.pop() || '';
        words += parts.filter(Boolean).length;
      }
    });

    stream.on('end', () => {
      const last = decoder.end();
      if (last) {
        for (let i = 0; i < last.length; i++) {
          if (last[i] === '\n') lines++;
        }
        for (const _ch of last) chars++;
        const combined = leftover + last;
        const parts = combined.split(/\s+/);
        words += parts.filter(Boolean).length;
      } else if (leftover) {
        words += 1;
      }

      resolve({ bytes, lines, words, chars });
    });
  });
}

async function processFilePath(filePath) {
  if (filePath === '-' || filePath === undefined) {
    return processStream(process.stdin);
  }

  const stream = fs.createReadStream(filePath);
  return processStream(stream);
}

async function getFileSize(filePath) {
  // For real files prefer stat which is cheap. For stdin, stat isn't available.
  if (!filePath || filePath === '-') return null;
  try {
    const stats = await fs.promises.stat(filePath);
    return stats.size;
  } catch (e) {
    return null;
  }
}

const args = process.argv.slice(2);

function printUsageAndExit() {
  console.error('Usage: ccwc <flag> <filename>');
  process.exit(1);
}

(async () => {
  let flag = null;
  let filePath = null;

  if (args.length === 0) {
    // read from stdin
    filePath = '-';
  } else if (args.length === 1) {
    if (args[0] !== '-' && args[0].startsWith('-') && args[0].length > 1) {
      // single flag -> read stdin
      flag = args[0];
      filePath = '-';
    } else {
      filePath = args[0];
    }
  } else if (args.length === 2) {
    flag = args[0];
    filePath = args[1];
  } else {
    printUsageAndExit();
  }

  try {
    const result = await processFilePath(filePath);

    // If we have a real file path, prefer stat for byte count when available
    let bytes = result.bytes;
    const statBytes = await getFileSize(filePath);
    if (statBytes !== null) bytes = statBytes;

    const lines = result.lines;
    const words = result.words;
    const chars = result.chars;

    if (!flag) {
      console.log(bytes + ' ' + lines + ' ' + words + ' ' + filePath);
    } else if (flag === '-c') {
      console.log(bytes + ' ' + filePath);
    } else if (flag === '-l') {
      console.log(lines + ' ' + filePath);
    } else if (flag === '-w') {
      console.log(words + ' ' + filePath);
    } else if (flag === '-m') {
      console.log(chars + ' ' + filePath);
    } else {
      console.error('Invalid flag used');
      process.exit(1);
    }
  } catch (err) {
    console.error('Error:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
