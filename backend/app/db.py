import os
from contextlib import contextmanager

from dotenv import load_dotenv

load_dotenv()

try:
    import psycopg
    from psycopg.rows import dict_row
except ImportError:  # Lets the memory-store prototype run before dependencies are installed.
    psycopg = None
    dict_row = None


def database_url() -> str:
    return os.getenv("DATABASE_URL", "").strip()


def is_configured() -> bool:
    return bool(database_url())


@contextmanager
def connection():
    if not is_configured():
        yield None
        return
    if psycopg is None:
        raise RuntimeError("PostgreSQL support requires psycopg. Run pip install -r requirements.txt.")

    with psycopg.connect(database_url(), row_factory=dict_row) as conn:
        yield conn
