import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * @desc    Login Admin/Manager
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact the administrator.',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Current Logged-in User Profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
export const getProfile = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        mustChangePassword: req.user.mustChangePassword,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change Logged-in User Password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify old password
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password',
      });
    }

    // Set new password
    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get All Managers
 * @route   GET /api/admin/managers
 * @access  Private (Admin Only)
 */
export const getManagers = async (req, res, next) => {
  try {
    const managers = await User.find({ role: 'manager' }).select('-password').populate('createdBy', 'name email');
    res.status(200).json({
      success: true,
      count: managers.length,
      data: managers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create Manager User
 * @route   POST /api/admin/managers
 * @access  Private (Admin Only)
 */
export const createManager = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const manager = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'manager',
      createdBy: req.user._id,
      mustChangePassword: true, // Force new managers to change their password on first login
    });

    res.status(201).json({
      success: true,
      message: 'Manager created successfully',
      data: {
        id: manager._id,
        name: manager.name,
        email: manager.email,
        role: manager.role,
        isActive: manager.isActive,
        mustChangePassword: manager.mustChangePassword,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Manager Details
 * @route   PUT /api/admin/managers/:id
 * @access  Private (Admin Only)
 */
export const updateManager = async (req, res, next) => {
  try {
    const { name, email, isActive } = req.body;
    const manager = await User.findOne({ _id: req.params.id, role: 'manager' });

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found',
      });
    }

    if (name) manager.name = name;
    if (email) manager.email = email.toLowerCase();
    if (typeof isActive !== 'undefined') manager.isActive = isActive;

    await manager.save();

    res.status(200).json({
      success: true,
      message: 'Manager updated successfully',
      data: {
        id: manager._id,
        name: manager.name,
        email: manager.email,
        role: manager.role,
        isActive: manager.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete Manager Account
 * @route   DELETE /api/admin/managers/:id
 * @access  Private (Admin Only)
 */
export const deleteManager = async (req, res, next) => {
  try {
    const manager = await User.findOneAndDelete({ _id: req.params.id, role: 'manager' });

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Manager deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset Manager Password
 * @route   PUT /api/admin/managers/:id/reset-password
 * @access  Private (Admin Only)
 */
export const resetManagerPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const manager = await User.findOne({ _id: req.params.id, role: 'manager' });

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found',
      });
    }

    manager.password = newPassword;
    manager.mustChangePassword = true;
    await manager.save();

    res.status(200).json({
      success: true,
      message: 'Manager password reset successfully. They will be forced to change it upon login.',
    });
  } catch (error) {
    next(error);
  }
};
