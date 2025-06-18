class TrieNode {
  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
    this.frequency = 0; 
    this.suggestions = []; 
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
    this.totalWords = 0;
  }

  insert(word, metadata = {}) {
    let current = this.root;
    const lowerWord = word.toLowerCase();
    
    for (let char of lowerWord) {
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
      }
      current = current.children.get(char);
    }
    
    if (!current.isEndOfWord) {
      this.totalWords++;
    }
    
    current.isEndOfWord = true;
    current.frequency = (current.frequency || 0) + 1;
    if (Object.keys(metadata).length > 0) {
      current.metadata = metadata;
    }
  }
  search(word) {
    let current = this.root;
    const lowerWord = word.toLowerCase();
    
    for (let char of lowerWord) {
      if (!current.children.has(char)) {
        return { found: false, node: null };
      }
      current = current.children.get(char);
    }
    
    return { found: current.isEndOfWord, node: current };
  }

  startsWith(prefix) {
    let current = this.root;
    const lowerPrefix = prefix.toLowerCase();
    
    for (let char of lowerPrefix) {
      if (!current.children.has(char)) {
        return false;
      }
      current = current.children.get(char);
    }
    
    return true;
  }

  getSuggestions(prefix, limit = 10) {
    let current = this.root;
    const lowerPrefix = prefix.toLowerCase();
    const suggestions = [];
    
    for (let char of lowerPrefix) {
      if (!current.children.has(char)) {
        return suggestions;
      }
      current = current.children.get(char);
    }
    this.collectWords(current, lowerPrefix, suggestions, limit);
    
    return suggestions.sort((a, b) => b.frequency - a.frequency);
  }
  collectWords(node, prefix, suggestions, limit) {
    if (suggestions.length >= limit) return;
    
    if (node.isEndOfWord) {
      suggestions.push({
        word: prefix,
        frequency: node.frequency,
        metadata: node.metadata || {}
      });
    }
    
    for (let [char, childNode] of node.children) {
      this.collectWords(childNode, prefix + char, suggestions, limit);
    }
  }

  delete(word) {
    const lowerWord = word.toLowerCase();
    return this.deleteHelper(this.root, lowerWord, 0);
  }

  deleteHelper(current, word, index) {
    if (index === word.length) {
      if (!current.isEndOfWord) {
        return false;
      }
      current.isEndOfWord = false;
      this.totalWords--;
      return current.children.size === 0;
    }
    
    const char = word[index];
    if (!current.children.has(char)) {
      return false;
    }
    
    const shouldDeleteChild = this.deleteHelper(current.children.get(char), word, index + 1);
    
    if (shouldDeleteChild) {
      current.children.delete(char);
      return current.children.size === 0 && !current.isEndOfWord;
    }
    
    return false;
  }

  getAllWords() {
    const words = [];
    this.collectWords(this.root, '', words, Infinity);
    return words;
  }

  getSize() {
    return this.totalWords;
  }
  clear() {
    this.root = new TrieNode();
    this.totalWords = 0;
  }
}

class WordProtectionSystem {
  constructor() {
    this.bannedWordsTrie = new Trie();
    this.spamPatternsTrie = new Trie();
    this.dictionaryTrie = new Trie();
    this.userDictionaryTrie = new Trie();
  }

  loadBannedWords(words, replacement = '***') {
    words.forEach(word => {
      this.bannedWordsTrie.insert(word, { 
        type: 'banned', 
        replacement: replacement 
      });
    });
  }

  loadSpamPatterns(patterns) {
    patterns.forEach(pattern => {
      this.spamPatternsTrie.insert(pattern, { 
        type: 'spam' 
      });
    });
  }

  loadDictionary(words) {
    words.forEach(word => {
      this.dictionaryTrie.insert(word, { 
        type: 'dictionary' 
      });
    });
  }

  addUserWords(userId, words) {
    words.forEach(word => {
      this.userDictionaryTrie.insert(word, { 
        type: 'user', 
        userId: userId 
      });
    });
  }

  checkBannedWords(message) {
    const words = message.toLowerCase().split(/\s+/);
    const bannedWords = [];
    
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      const result = this.bannedWordsTrie.search(cleanWord);
      
      if (result.found) {
        bannedWords.push({
          word: cleanWord,
          replacement: result.node.metadata?.replacement || '***',
          type: result.node.metadata?.type || 'banned'
        });
      }
    });
    
    return bannedWords;
  }

  filterMessage(message) {
    const words = message.split(/\s+/);
    const filteredWords = words.map(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      const result = this.bannedWordsTrie.search(cleanWord);
      
      if (result.found) {
        const replacement = result.node.metadata?.replacement || '***';
        return word.replace(cleanWord, replacement);
      }
      
      return word;
    });
    
    return filteredWords.join(' ');
  }

  checkSpamPatterns(message) {
    const lowerMessage = message.toLowerCase();
    const spamPatterns = [];
    
    for (let i = 0; i < lowerMessage.length; i++) {
      for (let j = i + 3; j <= lowerMessage.length; j++) {
        const pattern = lowerMessage.substring(i, j);
        const result = this.spamPatternsTrie.search(pattern);
        
        if (result.found) {
          spamPatterns.push({
            pattern: pattern,
            type: result.node.metadata?.type || 'spam'
          });
        }
      }
    }
    
    return spamPatterns;
  }
  spellCheck(word) {
    const lowerWord = word.toLowerCase();
    
    if (this.dictionaryTrie.search(lowerWord).found) {
      return { correct: true, suggestions: [] };
    }
    const suggestions = this.generateSpellCheckSuggestions(lowerWord);
    
    return {
      correct: false,
      suggestions: suggestions.slice(0, 5) 
    };
  }

  generateSpellCheckSuggestions(word) {
    const suggestions = [];
    const maxDistance = 2;
    
    const dictionaryWords = this.dictionaryTrie.getAllWords();
    
    dictionaryWords.forEach(({ word: dictWord }) => {
      const distance = this.levenshteinDistance(word, dictWord);
      if (distance <= maxDistance) {
        suggestions.push({
          word: dictWord,
          distance: distance
        });
      }
    });
    
    return suggestions.sort((a, b) => {
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }
      return b.frequency - a.frequency;
    });
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  getAutocompleteSuggestions(prefix, type = 'dictionary') {
    let trie;
    switch (type) {
      case 'banned':
        trie = this.bannedWordsTrie;
        break;
      case 'spam':
        trie = this.spamPatternsTrie;
        break;
      case 'user':
        trie = this.userDictionaryTrie;
        break;
      default:
        trie = this.dictionaryTrie;
    }
    
    return trie.getSuggestions(prefix, 10);
  }

  analyzeMessage(message) {
    const analysis = {
      bannedWords: this.checkBannedWords(message),
      spamPatterns: this.checkSpamPatterns(message),
      spellCheck: [],
      filteredMessage: message,
      isClean: true
    };
    const words = message.split(/\s+/);
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 2) { 
        const spellResult = this.spellCheck(cleanWord);
        if (!spellResult.correct) {
          analysis.spellCheck.push({
            word: cleanWord,
            suggestions: spellResult.suggestions
          });
        }
      }
    });
    
    if (analysis.bannedWords.length > 0) {
      analysis.filteredMessage = this.filterMessage(message);
      analysis.isClean = false;
    }
    
    if (analysis.spamPatterns.length > 0) {
      analysis.isClean = false;
    }
    
    return analysis;
  }
  getStats() {
    return {
      bannedWords: this.bannedWordsTrie.getSize(),
      spamPatterns: this.spamPatternsTrie.getSize(),
      dictionaryWords: this.dictionaryTrie.getSize(),
      userWords: this.userDictionaryTrie.getSize(),
      totalWords: this.bannedWordsTrie.getSize() + 
                  this.spamPatternsTrie.getSize() + 
                  this.dictionaryTrie.getSize() + 
                  this.userDictionaryTrie.getSize()
    };
  }
}

module.exports = {
  Trie,
  TrieNode,
  WordProtectionSystem
}; 