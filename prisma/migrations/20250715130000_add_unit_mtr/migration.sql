-- AlterEnum (idempotent for DBs that already include MTR in baseline)
DO $$ BEGIN
  ALTER TYPE "Unit" ADD VALUE 'MTR';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
