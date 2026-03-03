# PostgreSQL Password Reset Guide

## Quick Fix (Easiest Method)

### Step 1: Find PostgreSQL Data Directory
```bash
# Common locations on Windows:
C:\Program Files\PostgreSQL\15\data
C:\Program Files\PostgreSQL\16\data
# Or check your installation path
```

### Step 2: Stop PostgreSQL Service
```bash
# Open Services (Win+R, type services.msc)
# Find "postgresql-x64-15" (or your version)
# Right-click → Stop
```

### Step 3: Edit pg_hba.conf
Navigate to: `C:\Program Files\PostgreSQL\[VERSION]\data\pg_hba.conf`

**Backup the file first!**

Find this line near the bottom:
```
# IPv4 local connections:
host    all             all             127.0.0.1/32            scram-sha-256
```

Change `scram-sha-256` to `trust`:
```
# IPv4 local connections:
host    all             all             127.0.0.1/32            trust
```

Also change this line:
```
host    all             all             ::1/128                 scram-sha-256
```
To:
```
host    all             all             ::1/128                 trust
```

**Save the file!**

### Step 4: Start PostgreSQL Service
```bash
# Back in Services
# Right-click postgresql service → Start
```

### Step 5: Connect and Change Password
```bash
psql -U postgres

# Inside psql:
ALTER USER postgres WITH PASSWORD 'your_new_password';

# Exit:
\q
```

### Step 6: Restore Security
Edit `pg_hba.conf` again and change `trust` back to `scram-sha-256`

Restart PostgreSQL service one more time.

---

## Alternative: Using Command Prompt

If you have admin access, run as Administrator:

```bash
# Stop service
net stop postgresql-x64-15

# Edit configuration (use notepad as admin)
notepad "C:\Program Files\PostgreSQL\15\data\pg_hba.conf"

# Start service after editing
net start postgresql-x64-15

# Connect without password
psql -U postgres

# Change password
ALTER USER postgres WITH PASSWORD 'NewPassword123';

# Exit and restore pg_hba.conf
\q
```

---

## For Our Project Database User

Once postgres password is reset, also reset the `ete_user` password:

```sql
psql -U postgres

ALTER USER ete_user WITH PASSWORD 'ete_dev_password_change_in_prod';

\q
```

---

## Important Notes

⚠️ **Security Warning**: The `trust` authentication method allows anyone to connect without a password! Only use it temporarily.

✅ **Always backup** `pg_hba.conf` before editing

🔒 **Remember to restore** `scram-sha-256` authentication after changing the password
