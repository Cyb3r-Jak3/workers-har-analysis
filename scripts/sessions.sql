CREATE TABLE IF NOT EXISTS sessions (
    id        INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    token     TEXT NOT NULL UNIQUE,
    hash      TEXT NOT NULL UNIQUE,
    filename  TEXT NOT NULL
);