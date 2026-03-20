import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL!,
    // @ts-ignore - Some versions of Prisma config types may not have directUrl yet
    directUrl: process.env.DIRECT_URL!,
  },
} as any)
