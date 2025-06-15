const express = require('express');
const router = express.Router();
const User = require('../models/User');
const protect = require('../middleware/authMiddleware');

// @route   GET /api/contacts/search?mobileNumber=<number>
// @desc    Search for users by mobile number
// @access  Private
router.get('/search', protect, async (req, res) => {
  const { mobileNumber } = req.query;

  if (!mobileNumber) {
    return res.status(400).json({ message: 'Please provide a mobile number to search' });
  }

  try {
    // Search for users, excluding the current authenticated user
    const users = await User.find({
      mobileNumber: { $regex: mobileNumber, $options: 'i' }, // Case-insensitive regex search
      _id: { $ne: req.user._id } // Exclude the current user
    }).select('mobileNumber'); // Only return mobile number

    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Server error during user search' });
  }
});

// @route   POST /api/contacts/add
// @desc    Add a user to the current user's contact list
// @access  Private
router.post('/add', protect, async (req, res) => {
  const { mobileNumber } = req.body;

  if (!mobileNumber) {
    return res.status(400).json({ message: 'Please provide a mobile number to add' });
  }

  try {
    const user = req.user; // Authenticated user
    const contactToAdd = await User.findOne({ mobileNumber });

    if (!contactToAdd) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    if (user._id.toString() === contactToAdd._id.toString()) {
      return res.status(400).json({ message: 'Cannot add yourself as a contact' });
    }
    if (user.contacts.some(contact => contact.toString() === contactToAdd._id.toString())) {
      return res.status(400).json({ message: 'Contact already in your list' });
    }

    user.contacts.push(contactToAdd._id);
    await user.save();
    await user.populate('contacts', 'mobileNumber'); // Populate to return updated contacts with mobile numbers

    res.status(200).json({
      message: 'Contact added successfully',
      contacts: user.contacts,
    });
  } catch (error) {
    console.error('Error adding contact:', error);
    res.status(500).json({ message: 'Server error during adding contact' });
  }
});

// @route   GET /api/contacts
// @desc    Get the current user's contact list
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // Populate the contacts array to get full contact details (mobile number)
    const user = await User.findById(req.user._id).populate('contacts', 'mobileNumber');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ message: 'Server error during fetching contacts' });
  }
});

module.exports = router; 