# Deploy email verification fix to jobsrow VPS (run from repo root on your PC)
$ErrorActionPreference = "Stop"

Write-Host "=== SSH connectivity test ===" -ForegroundColor Cyan
ssh -o ConnectTimeout=25 jobsrow-vps "echo VPS_OK"
if ($LASTEXITCODE -ne 0) {
    throw "Cannot reach jobsrow-vps. Check VPS is online and port 22 is open."
}

Write-Host "=== Deploy on VPS ===" -ForegroundColor Cyan
scp "ete-digital/infra/apply_email_fix_vps.sh" jobsrow-vps:/tmp/apply_email_fix_vps.sh
ssh jobsrow-vps "chmod +x /tmp/apply_email_fix_vps.sh; bash /tmp/apply_email_fix_vps.sh"

Write-Host "=== Public health check ===" -ForegroundColor Cyan
curl.exe -sf https://jobsrow.com/health
Write-Host ""
Write-Host "Done. Try login again." -ForegroundColor Green
