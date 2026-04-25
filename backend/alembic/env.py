# Implemented in Step 2.
# Will:
#   - Read ALEMBIC_DATABASE_URL (or fall back to DATABASE_URL) from env
#   - Configure synchronous connection for Alembic (asyncpg needs a sync wrapper)
#   - Import Base.metadata for autogenerate support
