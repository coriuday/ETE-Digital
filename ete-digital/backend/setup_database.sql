-- ETE Digital Database Setup
-- Run this in PostgreSQL to create the database

-- Create database
CREATE DATABASE ete_digital;

-- Create user
CREATE USER ete_user WITH PASSWORD 'ete_dev_password_change_in_prod';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ete_digital TO ete_user;

-- Connect to database and grant schema privileges
\c ete_digital
GRANT ALL ON SCHEMA public TO ete_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ete_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ete_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ete_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ete_user;
