import { PrismaClient } from '@prisma/client'

// Create one shared Prisma instance for the whole app
// Importing this file from anywhere always returns the same instance
const prisma = new PrismaClient()

export default prisma
