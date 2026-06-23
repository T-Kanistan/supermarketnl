import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
};

const getJwtExpiresIn = () => process.env.JWT_EXPIRES_IN || '7d';

export const signToken = (payload) =>
  jwt.sign(payload, getJwtSecret(), {
    expiresIn: getJwtExpiresIn(),
  });

export const verifyToken = (token) => jwt.verify(token, getJwtSecret());

export default { signToken, verifyToken };
