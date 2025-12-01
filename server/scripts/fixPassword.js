const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const fixPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const user = await User.findOne({ username: 'admin' });
    
    if (!user) {
      console.log('Admin user not found');
      process.exit(1);
    }

    // Hash the password directly
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Update without triggering pre-save hook
    await User.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } }
    );

    // Verify it works
    const updatedUser = await User.findOne({ username: 'admin' });
    const isValid = await bcrypt.compare('admin123', updatedUser.password);
    
    if (isValid) {
      console.log('✅ Password fixed successfully!');
      console.log('Username: admin');
      console.log('Password: admin123');
    } else {
      console.log('❌ Password still not working');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error fixing password:', error);
    process.exit(1);
  }
};

fixPassword();

