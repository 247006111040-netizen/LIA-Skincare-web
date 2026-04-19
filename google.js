
import { Hono } from 'hono'
import { db } from '../db.js'
import { generateToken } from '../utils/jwt.js'

const googleAuthRoute = new Hono()

// 🔹 LOGIN GOOGLE (redirect ke Google)
googleAuthRoute.get('/google', (c) => {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')

  url.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID)
  url.searchParams.set('redirect_uri', 'http://localhost:3000/auth/google/callback')
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'openid email profile')

  return c.redirect(url.toString())
})

// 🔹 CALLBACK GOOGLE
googleAuthRoute.get('/google/callback', async (c) => {
  try {
    const code = c.req.query('code')

    if (!code) {
      return c.text('Code tidak ditemukan', 400)
    }

    // 🔥 ambil access token
    const params = new URLSearchParams()
    params.append('code', code)
    params.append('client_id', process.env.GOOGLE_CLIENT_ID)
    params.append('client_secret', process.env.GOOGLE_CLIENT_SECRET)
    params.append('redirect_uri', 'http://localhost:3000/auth/google/callback')
    params.append('grant_type', 'authorization_code')

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    })

    const tokenData = await tokenRes.json()
    const access_token = tokenData.access_token

    if (!access_token) {
      return c.text('Gagal ambil access token', 400)
    }

    // 🔥 ambil data user dari Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    const user = await userRes.json()
    const email = user.email

    if (!email) {
      return c.text('Email tidak ditemukan', 400)
    }

    // 🔥 cek user di database
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    )

    let dbUser = rows[0]

    // 🔥 kalau belum ada → insert
    if (!dbUser) {
      const [result] = await db.execute(
        'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
        [email, '', 'user']
      )

      dbUser = {
        id: result.insertId,
        email,
        role: 'user',
      }
    }

    // 🔥 generate JWT
    const token = generateToken({
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
    })

    // 🔥 redirect ke dashboard (TIDAK ADA JSON)
    const redirectUrl =
      `http://localhost:3000/dashboard.html?` +
      `email=${encodeURIComponent(dbUser.email)}&` +
      `token=${encodeURIComponent(token)}`

    return c.redirect(redirectUrl)

  } catch (error) {
    console.error(error)
    return c.text('Terjadi error server', 500)
  }
})

export default googleAuthRoute