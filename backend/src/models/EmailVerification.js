import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const emailVerificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    userModel: {
      type: String,
      required: true,
      enum: ['User', 'Admin', 'ManagerAccount', 'Manager'],
    },
    pendingEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    otpCode: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'email_verifications',
  }
);

// TTL index to automatically delete documents after expiresAt
emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to verify OTP code
emailVerificationSchema.methods.compareOtp = async function (enteredOtp) {
  return bcrypt.compare(enteredOtp, this.otpCode);
};

// Static helper to hash OTP
emailVerificationSchema.statics.hashOtp = async function (otp) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp, salt);
};

const EmailVerification = mongoose.model('EmailVerification', emailVerificationSchema);

export default EmailVerification;
