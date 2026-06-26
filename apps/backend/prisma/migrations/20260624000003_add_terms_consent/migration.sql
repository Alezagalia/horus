-- Terms of Service / Privacy consent captured at registration (S-02.3)

-- AlterTable
ALTER TABLE "users" ADD COLUMN "acceptedTermsVersion" TEXT;
ALTER TABLE "users" ADD COLUMN "acceptedTermsAt" TIMESTAMP(3);
