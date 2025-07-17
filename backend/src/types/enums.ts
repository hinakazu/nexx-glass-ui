// Types for enums that were removed from Prisma schema (SQLite doesn't support enums)

export enum Role {
  EMPLOYEE = 'EMPLOYEE',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN'
}

export enum RedemptionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  FULFILLED = 'FULFILLED',
  CANCELLED = 'CANCELLED'
}

export enum TransactionType {
  EARNED = 'EARNED',
  SPENT = 'SPENT',
  ALLOCATED = 'ALLOCATED'
}