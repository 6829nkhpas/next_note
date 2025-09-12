import jwt from "jsonwebtoken";

export function signJwt(payload, options = {}) {
  const secret = process.env.JWT_SECRET;
  const expiresIn = options.expiresIn || process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyJwt(token) {
  try {
    const secret = process.env.JWT_SECRET;
    return jwt.verify(token, secret);
  } catch (err) {
    return null;
  }
}


