import mongoose from 'mongoose';
import validator from 'validator';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Please provide a phone number'],
      trim: true,
    },
    village: {
      type: String,
      required: [true, 'Please provide a village'],
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
   role: {
      type: String,
      enum: ['farmer', 'client_admin', 'super_admin'],
      default: 'farmer',
    },
    // clientId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'Client',
    //   default: null,
    // },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;
