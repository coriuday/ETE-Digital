# Deploy email verification fix to jobsrow VPS (run from repo root on your PC)
$ErrorActionPreference = "Stop"

Write-Host "=== [1/4] Push to GitHub ===" -ForegroundColor Cyan
git push origin main
if ($LASTEXITCODE -ne 0) { throw "git push failed" }

Write-Host "=== [2/4] SSH connectivity test ===" -ForegroundColor Cyan
ssh -o ConnectTimeout=20 jobsrow-vps "echo VPS OK"
if ($LASTEXITCODE -ne 0) { throw "Cannot reach jobsrow-vps — check VPS is online and port 22 is open" }

Write-Host "=== [3/4] Deploy on VPS ===" -ForegroundColor Cyan
scp "ete-digital/infra/apply_email_fix_vps.sh" jobsrow-vps:/tmp/apply_email_fix_vps.sh
ssh jobsrow-vps "chmod +x /tmp/apply_email_fix_vps.sh && bash /tmp/apply_email_fix_vps.sh"

Write-Host "=== [4/4] Public health check ===" -ForegroundColor Cyan
curl.exe -sf https://jobsrow.com/health
Write-Host ""
Write-Host "Done. Try login — use Resend verification if still unverified." -ForegroundColor Green
