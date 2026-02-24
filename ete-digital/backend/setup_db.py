"""
DB Setup Script — run ONCE to create the ete_user and ete_digital database.
Connects as 'postgres' superuser (no password prompt on most local installs).
Run: .\venv\Scripts\python.exe setup_db.py
"""
import subprocess
import sys

cmds = [
    "CREATE USER ete_user WITH PASSWORD 'ete_dev_password_change_in_prod';",
    "CREATE DATABASE ete_digital OWNER ete_user;",
    "GRANT ALL PRIVILEGES ON DATABASE ete_digital TO ete_user;",
    r"\c ete_digital",
    "GRANT ALL ON SCHEMA public TO ete_user;",
]

for cmd in cmds:
    result = subprocess.run(
        ["psql", "-U", "postgres", "-c", cmd],
        capture_output=True, text=True
    )
    if result.returncode == 0:
        print(f"✅ {cmd[:60]}")
    else:
        # May already exist — not fatal
        err = result.stderr.strip()
        if "already exists" in err:
            print(f"⚠️  already exists: {cmd[:60]}")
        else:
            print(f"❌ Error: {err}")

print("\nDone! Now run: .\\venv\\Scripts\\python.exe -m alembic upgrade head")
