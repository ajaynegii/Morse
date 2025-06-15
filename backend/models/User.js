const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  mobileNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 10, // Assuming a 10-digit mobile number
    maxlength: 15  // Allow for country codes etc.
  },
  password: {
    type: String,
    required: true,
    minlength: 6 // Minimum password length
  },
  contacts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ], // NEW: Array to store contacts
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash the password before saving the user
UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Method to compare entered password with hashed password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', UserSchema);

module.exports = User; 