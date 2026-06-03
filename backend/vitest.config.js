import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // These let the app + middleware boot without a real .env. The validation
    // and middleware tests never touch the database, so a dummy URL is fine.
    env: {
      FRONTEND_URL: 'http://localhost:5173',
      JWT_SECRET: 'test-secret-not-for-production',
      DATABASE_URL: 'postgresql://postgres:postgres123@127.0.0.1:5432/startupbridge_test',
    },
  },
})
