import urllib.request
import json

url = "http://localhost:8000/api/auth/register"
headers = {"Content-Type": "application/json"}
data = json.dumps({"email": "testqa2@digital.com", "password": "Password123!", "full_name": "Test QA", "role": "candidate"}).encode('utf-8')

req = urllib.request.Request(url, data=data, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print("Body:", response.read().decode())
except urllib.error.HTTPError as e:
    print("Error Status:", e.code)
    print("Error Body:", e.read().decode())
except Exception as e:
    print("Error:", e)
