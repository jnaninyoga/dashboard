-- Custom migration to handle existing state + rename
DO $$ BEGIN
    -- Rename sex -> gender enum if exists
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sex') THEN
        ALTER TYPE "public"."sex" RENAME TO "gender";
    END IF;

    -- Create gender type if it makes sense (and create other missing types if needed, but assuming they exist)
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender') THEN
        CREATE TYPE "public"."gender" AS ENUM('male', 'female');
    END IF;

    -- Rename column if exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'sex') THEN
        ALTER TABLE "clients" RENAME COLUMN "sex" TO "gender";
    END IF;

    -- Add gender column if it's completely missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'gender') THEN
        ALTER TABLE "clients" ADD COLUMN "gender" "gender";
    END IF;
END $$;