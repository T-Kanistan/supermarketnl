import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const managerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: '',
    },
    profileImage: {
      type: String,
      default: '',
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['manager'],
      default: 'manager',
    },
    status: {
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
    lastLogin: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    passwordResetToken: {
      type: String,
      default: null,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'managerUsers',
  }
);

managerSchema.pre('save', function syncAccountStatus(next) {
  if (this.isModified('status') || this.isNew) {
    if (!this.status) {
      this.accountStatus = this.accountStatus === 'Deleted' ? 'Deleted' : 'Inactive';
    } else if (!['Suspended', 'Deleted'].includes(this.accountStatus)) {
      this.accountStatus = 'Active';
    }
  }
  if (this.isModified('passwordHash')) {
    this.lastPasswordChangedAt = new Date();
  }
  next();
});

managerSchema.methods.comparePassword = async function comparePassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.passwordHash);
};

managerSchema.statics.hashPassword = async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
};

const Manager = mongoose.model('Manager', managerSchema);

export default Manager;
