import { createMiddleware } from 'hono/factory'
import { verifyToken } from '../utils/jwt.js'

export const jwtMiddleware = createMiddleware(async (c, next) => {
  try {
    const authHeader = c.req.header('Authorization')

    if (!authHeader) {
      return c.json({ message: 'Token tidak ada' }, 401)
    }

    const token = authHeader.split(' ')[1]
    console.log("TOKEN DARI FRONTEND:", token)
    const user = verifyToken(token)

    c.set('user', user)

    await next()

  } catch (err) {
    return c.json({ message: 'Token tidak valid' }, 401)
  }
})