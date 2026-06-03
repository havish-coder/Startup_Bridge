import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { buildApp } from './app.js'

dotenv.config()

// Validate required env vars at startup — fail fast if missing
if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET is missing in .env')
  process.exit(1)
}

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const app = buildApp()

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
