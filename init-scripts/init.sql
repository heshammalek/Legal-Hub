-- Initialize legal_hub database
CREATE DATABASE legal_hub;

-- Create user if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'legal_user') THEN
        CREATE USER legal_user WITH PASSWORD 'legal_password';
    END IF;
END
$$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE legal_hub TO legal_user;

-- Connect to legal_hub database
\c legal_hub;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO legal_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO legal_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO legal_user;