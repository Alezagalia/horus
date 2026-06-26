-- Track last successful login to drive inactive-account retention (S-02.4)

-- AlterTable
ALTER TABLE "users" ADD COLUMN "lastLoginAt" TIMESTAMP(3);
