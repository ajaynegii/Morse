# End-to-End Encrypted Chat Application

A secure, real-time chat application built with Node.js, Express, Socket.IO, Next.js, and MongoDB, featuring end-to-end encryption, contact management, and WhatsApp-like file sharing capabilities.

## Features

- 🔐 **Secure Authentication**: User signup and signin with JWT for secure session management.
- 👥 **Contact Management**: Search for users by mobile number and add them to your contact list.
- 💬 **Real-time Messaging**: Instant message delivery using Socket.IO.
- 🔒 **End-to-End Encryption**: Messages are encrypted using a custom algorithm combined with Huffman compression before transmission and storage.
- 🖼️ **File & Photo Sharing**: Send and receive various file types (images, documents, archives) with previews and download options, similar to WhatsApp.
- 📊 **Message History**: Persistent storage of messages in MongoDB.
- 🌙 **Theming**: Light and dark mode support for the user interface.

## Technologies Used

### Backend
- **Node.js**: JavaScript runtime environment.
- **Express**: Web application framework for Node.js.
- **Socket.IO**: Real-time bidirectional event-based communication.
- **MongoDB & Mongoose**: NoSQL database and its ODM for data persistence.
- **JWT (JSON Web Tokens)**: For user authentication.
- **Bcrypt.js**: For password hashing.
- **Multer**: For handling file uploads.

### Frontend
- **Next.js**: React framework for building server-rendered and static web applications.
- **React**: JavaScript library for building user interfaces.
- **TypeScript**: Typed superset of JavaScript that compiles to plain JavaScript.
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development.
- **Shadcn/ui**: Reusable UI components.
- **Socket.IO Client**: For real-time communication with the backend.

## Project Structure

```
.github/                 # GitHub workflows (e.g., CI/CD - to be added)
backend/                 # Node.js Express server
├── controllers/         # (Future: Business logic) 
├── middleware/          # Authentication middleware
├── models/              # Mongoose schemas (User, Message)
├── routes/              # API endpoints (auth, contacts)
├── uploads/             # Directory for uploaded files
├── crypto.js            # Custom encryption logic
├── huffman.js           # Huffman compression logic
└── server.js            # Main backend application file
GUI/                     # Next.js React frontend
├── app/                 # Next.js App Router structure
├── components/          # Reusable React components (MessageInput, MessageBubble, FileUpload, etc.)
├── context/             # React context for authentication
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions and type definitions (e.g., types.ts)
├── public/              # Static assets
├── styles/              # Global styles
└── next.config.mjs      # Next.js configuration
.gitignore               # Specifies intentionally untracked files to ignore
DEPLOYMENT_GUIDE.md      # Instructions for deploying the application
FILE_SHARING_GUIDE.md    # Detailed guide on the file sharing feature
README.md                # This file
```

## Setup and Installation

### 1. Clone the repository

```bash
git clone https://github.com/ajaynegii/Morse.git
cd Morse
```

### 2. Backend Setup

Navigate to the `backend` directory, install dependencies, and start the server.

```bash
cd backend
npm install
# Install nodemon for development (optional, but recommended)
npm install -g nodemon

# Run in development mode
npm run dev

# Or run in production mode
npm start
```

**Environment Variables (Backend):**
Create a `.env` file in the `backend/` directory with the following:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```
Replace `your_mongodb_connection_string` with your MongoDB Atlas URI or local MongoDB connection string. Replace `your_jwt_secret_key` with a strong, random string.

### 3. Frontend Setup

Open a **new terminal**, navigate to the `GUI` directory, install dependencies, and start the development server.

```bash
cd GUI
npm install
npm run dev
```

The frontend application will typically run on `http://localhost:3000`.

### 4. MongoDB Setup

Ensure you have a MongoDB instance running (either locally or a cloud-hosted solution like MongoDB Atlas). Update the `MONGODB_URI` in your `backend/.env` file accordingly.

## Usage

1.  Ensure both the backend (`npm start` or `npm run dev` in `backend/`) and frontend (`npm run dev` in `GUI/`) servers are running.
2.  Open your browser and navigate to `http://localhost:3000`.
3.  **Sign Up** for a new account or **Sign In** if you already have one.
4.  Once logged in, you can search for and add contacts by their mobile number.
5.  Select a contact from your list to start chatting in real-time.
6.  Use the text input to send messages or click the paperclip icon to send files/photos.

## File Sharing

Refer to the `FILE_SHARING_GUIDE.md` for detailed instructions and information on the file sharing feature.

## Deployment

Refer to the `DEPLOYMENT_GUIDE.md` for instructions on how to deploy this application.

## Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

## License

This project is for educational purposes. Use responsibly and ensure compliance with local laws regarding encryption and data storage. 