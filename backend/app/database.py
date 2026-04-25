# Implemented in Step 2.
# Will provide:
#   - async engine (asyncpg driver, pool_size=5, max_overflow=10)
#   - async_session_maker
#   - get_db() — AsyncGenerator[AsyncSession, None] for FastAPI Depends
