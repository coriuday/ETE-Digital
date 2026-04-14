import sys
import os

# Ensure the backend directory is in the python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from app.core.security import pwd_context
except ImportError as e:
    print("Error: Could not import app modules. Please ensure you have activated the virtual environment.")
    print(f"Details: {e}")
    sys.exit(1)

# All test accounts mentioned
accounts = [
    ("admin@etedigital.com", "Admin@1234"),
    ("priya.sharma.tech@gmail.com", "Priya@2024"),
    ("sakshi.hr@technova.in", "TechNova@2024"),
    ("arjun.mehta.dev@gmail.com", "Arjun@2024"),
]

output_file = "update_hashes.sql"

with open(output_file, "w") as f:
    for email, password in accounts:
        hash_val = pwd_context.hash(password)
        f.write(f"UPDATE users SET password_hash = '{hash_val}' WHERE email = '{email}';\n")

print(f"Successfully generated {output_file} with Argon2 hashes for all test accounts.")
print("You can copy the contents of this file into the Supabase SQL editor.")
