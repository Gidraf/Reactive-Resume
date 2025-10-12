#!/bin/bash

# Path to your migrations folder
MIGRATIONS_DIR="./tools/prisma/migrations"

# Loop through all migration folders
for migration in "$MIGRATIONS_DIR"/*; do
  migration_name=$(basename "$migration")
  echo "Resolving migration: $migration_name"
  pnpm exec prisma migrate resolve --applied "$migration_name"
done

echo "All migrations resolved."
