import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt.js';
import { apiResponse } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';
import User from '../models/User.model.js';

// POST /auth/signup
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json(apiResponse.error('Email already in use'));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = generateToken({ id: user.id, email: user.email });

    logger.info(`New user signed up: ${email}`);

    return res.status(201).json(
      apiResponse.success('Account created', {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
      })
    );
  } catch (err) {
    logger.error('signup error', err);
    return res.status(500).json(apiResponse.error('Signup failed'));
  }
};

// POST /auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json(apiResponse.error('Invalid credentials'));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json(apiResponse.error('Invalid credentials'));
    }

    const token = generateToken({ id: user.id, email: user.email });

    logger.info(`User logged in: ${email}`);

    return res.status(200).json(
      apiResponse.success('Login successful', {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
    );
  } catch (err) {
    logger.error('login error', err);
    return res.status(500).json(apiResponse.error('Login failed'));
  }
};

// GET /auth/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(404).json(apiResponse.error('User not found'));
    }

    return res.status(200).json(apiResponse.success('User fetched', user));
  } catch (err) {
    logger.error('getMe error', err);
    return res.status(500).json(apiResponse.error('Could not fetch user'));
  }
};

// POST /auth/logout
export const logout = async (req, res) => {
  // JWT is stateless — client drops the token
  // If using a token blocklist (Redis), add it here
  logger.info(`User logged out: ${req.user?.email}`);
  return res.status(200).json(apiResponse.success('Logged out'));
};

// POST /auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal whether the email exists
      return res.status(200).json(apiResponse.success('If that email exists, a reset link was sent'));
    }

    // TODO: generate reset token, store in DB, send email via nodemailer/sendgrid
    logger.info(`Password reset requested for: ${email}`);

    return res.status(200).json(apiResponse.success('If that email exists, a reset link was sent'));
  } catch (err) {
    logger.error('forgotPassword error', err);
    return res.status(500).json(apiResponse.error('Request failed'));
  }
};

// POST /auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // TODO: verify reset token from DB, check expiry
    // const record = await PasswordReset.findOne({ where: { token } });

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // TODO: await User.update({ password: hashedPassword }, { where: { id: record.userId } });
    // await record.destroy();

    logger.info('Password reset completed');

    return res.status(200).json(apiResponse.success('Password updated'));
  } catch (err) {
    logger.error('resetPassword error', err);
    return res.status(500).json(apiResponse.error('Reset failed'));
  }
};
