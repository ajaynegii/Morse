const PI = 3.1415926535;
const E = 2.7182818284;
const PHI = 1.6180339887;

function shuffle(array, seed) {
  let m = array.length, t, i;
  let random = mulberry32(seed);
  while (m) {
    i = Math.floor(random() * m--);
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }
  return array;
}

function mulberry32(a) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

function generateKey() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const timeNumber = hours * 60 + minutes;
  const trigValue = Math.sin(timeNumber) + Math.cos(timeNumber) * PI;
  const keySeed = Math.floor(Math.abs(trigValue * E * PHI) * 1e6) % (10 ** 6);

  const chars = [];
  for (let i = 32; i < 127; i++) chars.push(String.fromCharCode(i));
  const shuffled = shuffle([...chars], keySeed);
  const subKey = {};
  for (let i = 0; i < chars.length; i++) {
    subKey[chars[i]] = shuffled[i];
  }
  return { subKey, keySeed };
}

function xorEncrypt(text, keySeed) {
  const textBuffer = Buffer.from(text, 'utf8');
  let resultBuffer = Buffer.alloc(textBuffer.length);
  for (let i = 0; i < textBuffer.length; i++) {
    resultBuffer[i] = textBuffer[i] ^ (Math.floor(PI * E * PHI * keySeed * (i + 1)) % 256);
  }
  return resultBuffer.toString('binary');
}

function encryptMessage(text) {
  const { subKey, keySeed } = generateKey();
  let substituted = "";
  for (const c of text) {
    substituted += subKey[c] || c;
  }
  return { encrypted: xorEncrypt(substituted, keySeed), keySeed };
}

function xorDecrypt(binaryString, keySeed) {
  const textBuffer = Buffer.from(binaryString, 'binary');
  let resultBuffer = Buffer.alloc(textBuffer.length);
  for (let i = 0; i < textBuffer.length; i++) {
    resultBuffer[i] = textBuffer[i] ^ (Math.floor(PI * E * PHI * keySeed * (i + 1)) % 256);
  }
  return resultBuffer.toString('utf8');
}

function decryptMessage(encrypted, keySeed) {
  const { subKey } = generateKey();
  const reverseKey = {};
  for (const k in subKey) {
    reverseKey[subKey[k]] = k;
  }
  const decryptedXor = xorDecrypt(encrypted, keySeed);
  let result = "";
  for (const c of decryptedXor) {
    result += reverseKey[c] || c;
  }
  return result;
}

module.exports = {
  encryptMessage,
  decryptMessage
}; 