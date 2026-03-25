import psycopg2

try:
    conn = psycopg2.connect(
        host="localhost",
        port=5432,
        database="ete_digital",
        user="ete_user",
        password="ete_dev_password_change_in_prod"
    )
    print("✅ Connection successful!")
    conn.close()
except Exception as e:
    print(f"❌ Connection failed: {e}")
