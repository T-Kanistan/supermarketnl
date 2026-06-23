import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'manager'],
        message: 'Role must be either admin or manager',
      },
      default: 'manager',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    accountStatus: {
      type: String,
      enum: ['Active', 'Inactive', 'Suspended', 'Deleted'],
      default: 'Active',
    },
    lastPasswordChangedAt: {
      type: Date,
      default: null,
    },
    mustChangePassword: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.lastPasswordChangedAt = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.pre('save', function syncAccountStatus(next) {
  if (this.isModified('isActive') || this.isNew) {
    if (!this.isActive) {
      this.accountStatus = this.accountStatus === 'Deleted' ? 'Deleted' : 'Inactive';
    } else if (!['Suspended', 'Deleted'].includes(this.accountStatus)) {
      this.accountStatus = 'Active';
    }
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
