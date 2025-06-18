const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const { huffmanCompress, huffmanDecompress, serializeTree, deserializeTree } = require('./huffman');
const { encryptMessage, decryptMessage } = require('./crypto');
const { WordProtectionSystem } = require('./trie');
const { bannedWords, spamPatterns, dictionaryWords } = require('./wordData');
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contactRoutes');
const User = require('./models/User');
const jwt = require('jsonwebtoken');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://messaging_user:3DBZNGn62h9xGQVR@cluster0.z0ofrfz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const PORT = 5000;

const wordProtection = new WordProtectionSystem();

wordProtection.loadBannedWords(bannedWords, '***');
wordProtection.loadSpamPatterns(spamPatterns);
wordProtection.loadDictionary(dictionaryWords);

console.log(' Word Protection System initialized:');
console.log(`   - Banned words: ${wordProtection.getStats().bannedWords}`);
console.log(`   - Spam patterns: ${wordProtection.getStats().spamPatterns}`);
console.log(`   - Dictionary words: ${wordProtection.getStats().dictionaryWords}`);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images, documents, and common file types
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'application/zip', 'application/x-zip-compressed'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, documents, and common file types are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', 
    methods: ['GET', 'POST']
  }
});
app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileInfo = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: `/uploads/${req.file.filename}`
    };

    res.json({
      message: 'File uploaded successfully',
      file: fileInfo
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ message: 'Error uploading file' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);

app.get('/api/word-protection/stats', (req, res) => {
  try {
    const stats = wordProtection.getStats();
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error getting word protection stats:', error);
    res.status(500).json({ success: false, message: 'Error getting statistics' });
  }
});

app.post('/api/word-protection/analyze', (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const analysis = wordProtection.analyzeMessage(message);
    res.json({
      success: true,
      analysis: analysis
    });
  } catch (error) {
    console.error('Error analyzing message:', error);
    res.status(500).json({ success: false, message: 'Error analyzing message' });
  }
});

app.get('/api/word-protection/autocomplete', (req, res) => {
  try {
    const { prefix, type = 'dictionary' } = req.query;
    if (!prefix) {
      return res.status(400).json({ success: false, message: 'Prefix is required' });
    }

    const suggestions = wordProtection.getAutocompleteSuggestions(prefix, type);
    res.json({
      success: true,
      suggestions: suggestions
    });
  } catch (error) {
    console.error('Error getting autocomplete suggestions:', error);
    res.status(500).json({ success: false, message: 'Error getting suggestions' });
  }
});

app.post('/api/word-protection/spell-check', (req, res) => {
  try {
    const { word } = req.body;
    if (!word) {
      return res.status(400).json({ success: false, message: 'Word is required' });
    }

    const spellCheckResult = wordProtection.spellCheck(word);
    res.json({
      success: true,
      result: spellCheckResult
    });
  } catch (error) {
    console.error('Error spell checking word:', error);
    res.status(500).json({ success: false, message: 'Error spell checking word' });
  }
});

app.post('/api/word-protection/add-banned-word', (req, res) => {
  try {
    const { word, replacement = '***' } = req.body;
    if (!word) {
      return res.status(400).json({ success: false, message: 'Word is required' });
    }

    wordProtection.bannedWordsTrie.insert(word, { type: 'banned', replacement });
    res.json({
      success: true,
      message: `Banned word "${word}" added successfully`
    });
  } catch (error) {
    console.error('Error adding banned word:', error);
    res.status(500).json({ success: false, message: 'Error adding banned word' });
  }
});

app.delete('/api/word-protection/remove-banned-word', (req, res) => {
  try {
    const { word } = req.body;
    if (!word) {
      return res.status(400).json({ success: false, message: 'Word is required' });
    }

    const deleted = wordProtection.bannedWordsTrie.delete(word);
    if (deleted) {
      res.json({
        success: true,
        message: `Banned word "${word}" removed successfully`
      });
    } else {
      res.status(404).json({
        success: false,
        message: `Banned word "${word}" not found`
      });
    }
  } catch (error) {
    console.error('Error removing banned word:', error);
    res.status(500).json({ success: false, message: 'Error removing banned word' });
  }
});

app.post('/api/word-protection/add-user-word', (req, res) => {
  try {
    const { userId, word } = req.body;
    if (!userId || !word) {
      return res.status(400).json({ success: false, message: 'User ID and word are required' });
    }

    wordProtection.addUserWords(userId, [word]);
    res.json({
      success: true,
      message: `User word "${word}" added successfully`
    });
  } catch (error) {
    console.error('Error adding user word:', error);
    res.status(500).json({ success: false, message: 'Error adding user word' });
  }
});

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderMobileNumber: String,
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverMobileNumber: String,
  original_message: String,
  encrypted_message: String,
  key_seed: Number,
  compressed_data: String,
  huffman_tree: Object,
  timestamp: { type: Date, default: Date.now },
  is_read: { type: Boolean, default: false },
  hasAttachment: { type: Boolean, default: false },
  attachment: {
    filename: String,
    originalname: String,
    mimetype: String,
    size: Number,
    path: String
  }
});
const Message = mongoose.model('Message', messageSchema);

io.on('connection', async (socket) => {
  console.log(`🔗 Client connected: ${socket.id}`);
  socket.isAuth = false;

  socket.on('authenticate', async ({ token }) => {
    try {
      if (!token) throw new Error('No token provided');
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) throw new Error('User not found');

      socket.user = user;
      socket.isAuth = true;
      console.log(` Socket ${socket.id} authenticated for user: ${user.mobileNumber}`);
      socket.emit('authenticated', { userId: user._id, mobileNumber: user.mobileNumber });

      const contactIds = user.contacts.map(contact => contact._id);
      const relevantUserIds = [user._id, ...contactIds];

      const messages = await Message.find({
        $or: [
          { senderId: { $in: relevantUserIds }, receiverId: { $in: relevantUserIds } },
          { senderId: user._id },
          { receiverId: user._id }
        ]
      }).sort({ timestamp: 1 }).limit(100);

      const history = messages.map(msg => {
        let decryptedContent = '';
        if (msg.original_message) {
          const tree = deserializeTree(msg.huffman_tree);
          try {
            decryptedContent = decryptMessage(huffmanDecompress(msg.compressed_data, tree), msg.key_seed);
          } catch (e) {
            console.warn('Could not decrypt message:', msg._id, e.message);
            decryptedContent = '⚠️ [Decryption Error]';
          }
        }
        console.log('DEBUG HISTORY:', {
          id: msg._id,
          key_seed: msg.key_seed,
          encrypted_message: msg.encrypted_message,
          decryptedContent
        });
        return {
          id: msg._id,
          senderId: msg.senderId,
          senderMobileNumber: msg.senderMobileNumber,
          receiverId: msg.receiverId,
          receiverMobileNumber: msg.receiverMobileNumber,
          message: decryptedContent,
          encrypted_message: msg.encrypted_message,
          timestamp: msg.timestamp,
          hasAttachment: msg.hasAttachment,
          attachment: msg.attachment
        };
      });
      socket.emit('history', history);

    } catch (err) {
      console.error(' Socket authentication failed for', socket.id, ':', err.message);
      socket.emit('auth_error', { message: 'Authentication failed: ' + err.message });
      socket.disconnect(true);
    }
  });

  socket.on('message', async (data) => {
    if (!socket.isAuth || !socket.user) {
      return socket.emit('error', { message: 'Not authenticated to send messages' });
    }

    try {
      const senderId = socket.user._id;
      const senderMobileNumber = socket.user.mobileNumber;
      const { receiverId, message, attachment } = data;

      if (!receiverId || (!message && !attachment)) {
        return socket.emit('error', { message: 'Receiver ID and message content or attachment are required' });
      }

      const receiverUser = await User.findById(receiverId);
      if (!receiverUser) {
        return socket.emit('error', { message: 'Receiver user not found' });
      }
      const receiverMobileNumber = receiverUser.mobileNumber;

      // === WORD PROTECTION ANALYSIS ===
      let originalMessage = message;
      let filteredMessage = message;
      let wordProtectionAnalysis = null;

      if (message) {
        // Analyze message for word protection
        wordProtectionAnalysis = wordProtection.analyzeMessage(message);
        filteredMessage = wordProtectionAnalysis.filteredMessage;
        
        // Log protection analysis for monitoring
        if (!wordProtectionAnalysis.isClean) {
          console.log(` Word protection triggered for user ${senderMobileNumber}:`);
          if (wordProtectionAnalysis.bannedWords.length > 0) {
            console.log(`   - Banned words found: ${wordProtectionAnalysis.bannedWords.map(w => w.word).join(', ')}`);
          }
          if (wordProtectionAnalysis.spamPatterns.length > 0) {
            console.log(`   - Spam patterns detected: ${wordProtectionAnalysis.spamPatterns.length}`);
          }
          if (wordProtectionAnalysis.spellCheck.length > 0) {
            console.log(`   - Spell check issues: ${wordProtectionAnalysis.spellCheck.length} words`);
          }
        }
      }

      let encrypted = '';
      let keySeed = 0;
      let encodedText = '';
      let serializedTree = null;

      // Only encrypt if there's a text message (use filtered message)
      if (filteredMessage) {
        const encryptionResult = encryptMessage(filteredMessage);
        encrypted = encryptionResult.encrypted;
        keySeed = encryptionResult.keySeed;
        const compressionResult = huffmanCompress(encrypted);
        encodedText = compressionResult.encodedText;
        serializedTree = serializeTree(compressionResult.tree);
      }

      const msgDoc = new Message({
        senderId,
        senderMobileNumber,
        receiverId,
        receiverMobileNumber,
        original_message: originalMessage || '', // Store original message
        encrypted_message: encrypted,
        key_seed: keySeed,
        compressed_data: encodedText,
        huffman_tree: serializedTree,
        hasAttachment: !!attachment,
        attachment: attachment || null
      });
      await msgDoc.save();

      let decryptedContent = '';
      if (filteredMessage) {
        decryptedContent = decryptMessage(huffmanDecompress(encodedText, deserializeTree(serializedTree)), keySeed);
      }
      console.log('DEBUG NEW MESSAGE:', {
        keySeed,
        encrypted,
        decryptedContent
      });

      const messageData = {
        id: msgDoc._id,
        senderId: senderId,
        senderMobileNumber: senderMobileNumber,
        receiverId: receiverId,
        receiverMobileNumber: receiverMobileNumber,
        message: decryptedContent,
        encrypted_message: encrypted,
        timestamp: msgDoc.timestamp,
        hasAttachment: msgDoc.hasAttachment,
        attachment: msgDoc.attachment,
        // Add word protection metadata
        wordProtection: wordProtectionAnalysis ? {
          isClean: wordProtectionAnalysis.isClean,
          bannedWordsCount: wordProtectionAnalysis.bannedWords.length,
          spamPatternsCount: wordProtectionAnalysis.spamPatterns.length,
          spellCheckIssues: wordProtectionAnalysis.spellCheck.length,
          wasFiltered: originalMessage !== filteredMessage
        } : null
      };

      io.to(socket.id).emit('message', messageData);

      io.allSockets().then(async (sockets) => {
        for (const [id, s] of io.sockets.sockets) {
          if (s.user && s.user._id.toString() === receiverId.toString() && s.id !== socket.id) {
            s.emit('message', messageData);
          }
        }
      });

    } catch (err) {
      console.error(' Error handling message for socket', socket.id, ':', err);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    console.log(' Client disconnected:', socket.id);
  });
});

// === START SERVER ===
server.listen(PORT, '0.0.0.0', () => {
  console.log(` Server running on http://localhost:${PORT}`);
  console.log(`Authentication routes: http://localhost:${PORT}/api/auth`);
  console.log(`Contact routes: http://localhost:${PORT}/api/contacts`);
  console.log(`File upload route: http://localhost:${PORT}/api/upload`);
});
