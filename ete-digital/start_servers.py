import subprocess

f = open('d:/all_projects/ind/ete-digital/frontend_log.txt', 'w')
p1 = subprocess.Popen('npm run dev', shell=True, cwd='d:/all_projects/ind/ete-digital/frontend', stdout=f, stderr=subprocess.STDOUT)

b = open('d:/all_projects/ind/ete-digital/backend_log.txt', 'w')
p2 = subprocess.Popen('uvicorn app.main:app --host 0.0.0.0 --port 8000', shell=True, cwd='d:/all_projects/ind/ete-digital/backend', stdout=b, stderr=subprocess.STDOUT)

print("Started with PIDs:", p1.pid, p2.pid)
import time
while True:
    time.sleep(1)
