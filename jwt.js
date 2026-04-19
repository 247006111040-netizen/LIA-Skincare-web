



import jwt from 'jsonwebtoken'

const SECRET = "secret123" // HARUS SAMA

export function generateToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '1h' })
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET)
}