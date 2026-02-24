# PostgreSQL Setup Guide (Fresh Installation)

## Step 1: Verify Installation

Check if PostgreSQL is installed:

```bash
psql --version
```

Check if PostgreSQL service exists:

```bash
sc query postgresql*
# or
services.msc  # Look for "postgresql-x64-XX"
```

---

## Step 2: Initial Database Cluster Setup

### If PostgreSQL Data Directory Doesn't Exist

**Find your PostgreSQL installation**:

- Default: `C:\Program Files\PostgreSQL\[VERSION]`

**Option A: Use Stack Builder (Easiest)**

1. Find "Stack Builder" in Start Menu
2. Select your PostgreSQL installation
3. Follow the wizard to complete setup
4. Set a password for postgres user when prompted

**Option B: Manual Initialize**

Run as Administrator:

```bash
cd "C:\Program Files\PostgreSQL\16\bin"  # Replace 16 with your version

# Initialize database cluster
initdb -D "C:\Program Files\PostgreSQL\16\data" -U postgres -W -E UTF8 -A scram-sha-256

# You'll be prompted to enter a password for postgres user
# Enter a password you'll remember!
```

---

## Step 3: Start PostgreSQL Service

**Method 1: Services GUI**

```bash
# Press Win+R, type: services.msc
# Find "postgresql-x64-XX"
# Right-click → Start
# Right-click → Properties → Set to "Automatic"
```

**Method 2: Command Line** (as Administrator)

```bash
net start postgresql-x64-16  # Replace with your version
```

---

## Step 4: Test Connection

```bash
psql -U postgres

# If successful, you'll see:
# postgres=#

# Test it:
SELECT version();

# Exit:
\q
```

---

## Step 5: Create Project Database & User

```bash
psql -U postgres
```

Then run these SQL commands:

```sql
-- Create our project database
CREATE DATABASE ete_digital;

-- Create our project user
CREATE USER ete_user WITH PASSWORD 'ete_dev_password_change_in_prod';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ete_digital TO ete_user;

-- Connect to the database
\c ete_digital

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO ete_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ete_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ete_user;

-- Verify
\l  -- List databases
\du -- List users

-- Exit
\q
```

---

## Step 6: Update Environment Variables (Optional)

Add to System PATH:

```
C:\Program Files\PostgreSQL\16\bin
```

Add PGDATA environment variable:

```
PGDATA=C:\Program Files\PostgreSQL\16\data
```

---

## Step 7: Verify Setup

Test connection with our project user:

```bash
psql -U ete_user -d ete_digital -h localhost

# Should connect successfully
# Exit with: \q
```

---

## Common Issues

### Issue 1: "psql not recognized"

**Solution**: Add PostgreSQL bin folder to PATH

```
C:\Program Files\PostgreSQL\16\bin
```

### Issue 2: "Data directory not found"

**Solution**: Run initdb (see Step 2B)

### Issue 3: "Service won't start"

**Solution**:

- Check Windows Event Viewer for errors
- Verify data directory permissions
- Check if another PostgreSQL is running on port 5432

### Issue 4: "Password authentication failed"

**Solution**:

- Use the password reset scripts we created earlier
- Or re-initialize the cluster

---

## What We Need for Our Project

After setup, make sure:

- ✅ PostgreSQL service is running
- ✅ postgres superuser password is set
- ✅ Database `ete_digital` exists
- ✅ User `ete_user` exists with correct password
- ✅ User has all privileges on database

Then we can:

1. Run Alembic migrations
2. Start backend server
3. Test the application

---

## Quick Setup Script

Save as `setup_postgres.bat` and run as Administrator:

```batch
@echo off
echo Setting up PostgreSQL...

REM Start service
net start postgresql-x64-16

REM Create database and user (will prompt for postgres password)
psql -U postgres -c "CREATE DATABASE ete_digital;"
psql -U postgres -c "CREATE USER ete_user WITH PASSWORD 'ete_dev_password_change_in_prod';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ete_digital TO ete_user;"

echo Setup complete!
pause
```
