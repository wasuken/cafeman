import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset } from 'jest-mock-extended'
import { DeepMockProxy } from 'jest-mock-extended/lib/cjs/Mock'

const prisma = mockDeep<PrismaClient>()

beforeEach(() => {
  mockReset(prisma)
})

export { prisma }
export type { DeepMockProxy }
