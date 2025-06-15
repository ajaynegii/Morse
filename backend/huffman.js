class Node {
  constructor(char = null, freq = 0) {
    this.char = char;
    this.freq = freq;
    this.left = null;
    this.right = null;
  }
}

function buildFreqMap(text) {
  const freqMap = {};
  for (const char of text) {
    freqMap[char] = (freqMap[char] || 0) + 1;
  }
  return freqMap;
}

function buildHuffmanTree(freqMap) {
  const heap = Object.entries(freqMap).map(([char, freq]) => new Node(char, freq));
  heap.sort((a, b) => a.freq - b.freq);

  while (heap.length > 1) {
    const node1 = heap.shift();
    const node2 = heap.shift();
    const merged = new Node(null, node1.freq + node2.freq);
    merged.left = node1;
    merged.right = node2;
    heap.push(merged);
    heap.sort((a, b) => a.freq - b.freq);
  }
  return heap[0];
}

function buildCodes(root) {
  const codes = {};
  function generateCode(node, currentCode) {
    if (!node) return;
    if (node.char !== null) {
      codes[node.char] = currentCode;
    }
    generateCode(node.left, currentCode + "0");
    generateCode(node.right, currentCode + "1");
  }
  generateCode(root, "");
  return codes;
}

function huffmanCompress(text) {
  const freqMap = buildFreqMap(text);
  const root = buildHuffmanTree(freqMap);
  const codes = buildCodes(root);
  const encodedText = text.split("").map(char => codes[char]).join("");
  return { encodedText, tree: root };
}

function huffmanDecompress(encodedText, root) {
  let result = "";
  let node = root;
  for (const bit of encodedText) {
    node = bit === "0" ? node.left : node.right;
    if (node.char !== null) {
      result += node.char;
      node = root;
    }
  }
  return result;
}

function serializeTree(node) {
  if (!node) return null;
  return {
    char: node.char,
    freq: node.freq,
    left: serializeTree(node.left),
    right: serializeTree(node.right)
  };
}

function deserializeTree(obj) {
  if (!obj) return null;
  const node = new Node(obj.char, obj.freq);
  node.left = deserializeTree(obj.left);
  node.right = deserializeTree(obj.right);
  return node;
}

module.exports = {
  huffmanCompress,
  huffmanDecompress,
  serializeTree,
  deserializeTree
}; 