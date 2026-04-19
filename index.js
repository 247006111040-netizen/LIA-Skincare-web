import { Hono } from 'hono'
import { db } from './db.js'
import { generateToken } from './utils/jwt.js'
import { jwtMiddleware } from './middlewares/jwt.middleware.js'
import { isAdminMiddleware } from './middlewares/isAdmin.middleware.js'

const app = new Hono()

// ================= CORS =================
app.use('*', async (c, next) => {
  c.res.headers.set('Access-Control-Allow-Origin', '*')
  c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (c.req.method === 'OPTIONS') {
    return c.text('', 200)
  }

  await next()
})

// ================= ROOT =================
app.get('/', (c) => {
  return c.text('Server jalan 🚀')
})

// ================= LOGIN (FIX) =================
app.post('/login-jwt', async (c) => {
  try {
    const { email, password } = await c.req.json()

    console.log("LOGIN:", email, password)

    if (!email || !password) {
      return c.json({ message: 'Isi semua field' }, 400)
    }

    // ambil user dari DB
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    )

    if (rows.length === 0) {
      return c.json({ message: 'User tidak ditemukan' }, 404)
    }

    const user = rows[0]

    // cek password
    if (user.password !== password) {
      return c.json({ message: 'Password salah' }, 401)
    }

    // 🔥 generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    })

    console.log("TOKEN:", token)

    return c.json({
      message: 'Login berhasil',
      token
    })

  } catch (error) {
    console.error("LOGIN ERROR:", error)
    return c.json({ message: 'Terjadi error server' }, 500)
  }
})

// ================= PROFILE =================
app.get('/profile-jwt', jwtMiddleware, (c) => {
  const user = c.get('user')

  if (!user) {
    return c.json({ message: 'Unauthorized' }, 401)
  }

  return c.json(user)
})

// ================= ADMIN =================
app.get('/admin', jwtMiddleware, isAdminMiddleware, (c) => {
  return c.text('Welcome Admin 👑')
})

// ================= TEST =================
app.get('/test', (c) => {
  return c.json({ status: 'OK' })
})

// ================= RUN SERVER =================
Bun.serve({
  fetch: app.fetch,
  port: 3000
})

// ================= PRODUCTS =================

// GET all
app.get('/products', async (c) => {
  const [rows] = await db.execute('SELECT * FROM products')
  return c.json(rows)
})

// ADD (admin only)
app.post('/products', jwtMiddleware, isAdminMiddleware, async (c) => {
  const body = await c.req.json()

  await db.execute(
    'INSERT INTO products (name, price, description, image) VALUES (?, ?, ?, ?)',
    [body.name, body.price, body.description, body.image]
  )

  return c.json({ message: 'Produk ditambahkan' })
})

// DELETE
app.delete('/products/:id', jwtMiddleware, isAdminMiddleware, async (c) => {
  const id = c.req.param('id')

  await db.execute('DELETE FROM products WHERE id = ?', [id])

  return c.json({ message: 'Produk dihapus' })
})

app.get('/products', async (c) => {
  try {
    const [rows] = await db.query('SELECT * FROM products')
    return c.json(rows)
  } catch (err) {
    console.error(err)
    return c.json({ message: 'Gagal ambil produk' }, 500)
  }
})

console.log("🚀 Server running on http://localhost:3000")