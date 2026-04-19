import mysql from 'mysql2/promise'

let db

try {
  db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'auth_app'
  })

  console.log('✅ Database connected')
} catch (err) {
  console.error('❌ Database connection failed:', err.message)
}

export { db }