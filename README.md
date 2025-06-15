# End-to-End Messaging System with MongoDB

A secure, encrypted messaging system with MongoDB database integration for message storage and management.

## Features

- 🔐 **End-to-End Encryption**: Custom encryption algorithm with Huffman compression
- 💾 **MongoDB Integration**: Persistent message storage with full CRUD operations
- 📊 **Message Statistics**: Real-time statistics and analytics
- 📱 **GUI Interface**: User-friendly Tkinter-based interface
- 🔍 **Message History**: View and search through message history
- 🛠️ **Database Manager**: Comprehensive database management tool

## Prerequisites

### 1. Install MongoDB

#### Windows:
1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Install MongoDB with default settings
3. Start MongoDB service:
   ```cmd
   net start MongoDB
   ```

#### macOS (using Homebrew):
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

## Project Structure

```
├── core.py              # Encryption and compression algorithms
├── database.py          # MongoDB connection and operations
├── node1.py            # Server application
├── node2.py            # Client application
├── db_manager.py       # Database management tool
├── requirements.txt    # Python dependencies
└── README.md          # This file
```

## Usage

### 1. Start MongoDB
Ensure MongoDB is running on your system (default port: 27017)

### 2. Run the Server
```bash
python node1.py
```
- Server will start listening on port 9999
- Database connection status will be displayed
- Use "View Message History" to see stored messages
- Use "Show Statistics" to view message analytics

### 3. Run the Client
```bash
python node2.py
```
- Client will connect to the server automatically
- Start sending messages - they will be stored in MongoDB
- View message history and statistics

### 4. Database Manager (Optional)
```bash
python db_manager.py
```
- Comprehensive database management interface
- View, search, and manage all messages
- Export/import functionality
- Test message creation

## Database Schema

### Messages Collection
```json
{
  "_id": "ObjectId",
  "sender": "string",
  "receiver": "string", 
  "original_message": "string",
  "encrypted_message": "string",
  "key_seed": "number",
  "compressed_data": "string",
  "huffman_tree": "binary",
  "timestamp": "datetime",
  "is_read": "boolean"
}
```

## Features Explained

### Encryption System
- **Huffman Compression**: Reduces message size
- **Custom Encryption**: Time-based key generation with mathematical constants
- **Secure Transmission**: Messages are encrypted before storage

### Database Operations
- **Store Messages**: Automatically stores all sent/received messages
- **Retrieve Messages**: Get messages by sender/receiver
- **Message Statistics**: Total, unread, and recent message counts
- **Read Status**: Track which messages have been read

### GUI Features
- **Real-time Status**: Database connection status
- **Message History**: View all stored messages
- **Statistics**: Message analytics and metrics
- **Error Handling**: Graceful handling of connection issues

## Configuration

### MongoDB Connection
Default connection string: `mongodb://localhost:27017/`

To change the connection string, modify the `MessageDatabase` class in `database.py`:
```python
db = MessageDatabase("mongodb://your-server:27017/")
```

### Database Name
Default database: `messaging_system`

To change the database name, modify in `database.py`:
```python
self.db = self.client['your_database_name']
```

## Troubleshooting

### MongoDB Connection Issues
1. **Check if MongoDB is running**:
   ```bash
   # Windows
   net start MongoDB
   
   # Linux/macOS
   sudo systemctl status mongodb
   ```

2. **Check MongoDB port**:
   ```bash
   netstat -an | grep 27017
   ```

3. **Test connection**:
   ```bash
   mongo --eval "db.runCommand('ping')"
   ```

### Python Dependencies
If you encounter import errors:
```bash
pip install --upgrade pymongo
pip install --upgrade tkinter
```

### Permission Issues
- Ensure MongoDB has write permissions to the data directory
- Run the application with appropriate permissions

## Security Considerations

1. **Encryption**: Messages are encrypted before storage
2. **Local Database**: MongoDB runs locally by default
3. **No External Dependencies**: All encryption is custom-built
4. **Secure Key Generation**: Time-based keys with mathematical constants

## Performance

- **Indexing**: Database indexes on timestamp, sender, and receiver
- **Compression**: Huffman compression reduces storage size
- **Efficient Queries**: Optimized MongoDB queries for fast retrieval

## Future Enhancements

- [ ] User authentication system
- [ ] Message encryption at rest
- [ ] Real-time notifications
- [ ] File sharing capabilities
- [ ] Group messaging
- [ ] Message backup/restore
- [ ] Advanced search filters
- [ ] Message threading

## Support

For issues or questions:
1. Check the troubleshooting section
2. Verify MongoDB is running
3. Check Python dependencies
4. Review error messages in the GUI

## License

This project is for educational purposes. Use responsibly and ensure compliance with local laws regarding encryption and data storage. 