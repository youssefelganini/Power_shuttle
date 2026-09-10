require('dotenv').config()
const fs = require('fs')
const path = require('path')
const express = require('express')
const cors = require('cors')

const routes = require('./routes') 
require('./database') 

const UPLOAD_DIR = path.join(__dirname, 'uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const app = express()

// Vite falls back to the next free port when 5173 is taken, so accept any
// localhost origin in dev instead of hardcoding one and breaking on restart.
const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin === process.env.FRONTEND_ORIGIN || LOCALHOST_ORIGIN.test(origin)) {
        return callback(null, true)
      }
      callback(new Error('Not allowed by CORS'))
    },
  })
)
app.use('/uploads', express.static(UPLOAD_DIR))
app.use('/api/v1', routes)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Power Shuttle backend running on port ${PORT}`))