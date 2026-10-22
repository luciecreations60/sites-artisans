# Déploie submit-commercial-request sans `supabase login` interactif (GitHub).
# Prérequis : Access Token créé dans le Dashboard (voir commentaires ci-dessous).
#
# 1. Ouvre https://supabase.com/dashboard/account/tokens
# 2. Generate new token (nom ex. "cli-site-az")
# 3. Puis dans PowerShell :
#      $env:SUPABASE_ACCESS_TOKEN = "sbp_..."
#      .\scripts\deploy-submit-commercial.ps1

$ErrorActionPreference = "Stop"
$ProjectRef = "ukmxnyqbrqjwednhqdxg"

if (-not $env:SUPABASE_ACCESS_TOKEN) {
  Write-Host @"
SUPABASE_ACCESS_TOKEN manquant.

Le login GitHub CLI est souvent bloqué (504 auth.supabase.io).
Utilise un Access Token Dashboard a la place :

  1. Connecte-toi au Dashboard (e-mail/mot de passe si GitHub timeout)
  2. https://supabase.com/dashboard/account/tokens
  3. Generate new token
  4. `$env:SUPABASE_ACCESS_TOKEN = 'sbp_...'`
  5. Relance ce script

Sinon, change manuellement dans le Dashboard :
  Edge Functions > submit-commercial-request
  Remplace SA- par AZ- dans trackingCode() puis Deploy.
"@
  exit 1
}

Set-Location $PSScriptRoot\..
npx supabase link --project-ref $ProjectRef
npx supabase functions deploy submit-commercial-request --project-ref $ProjectRef
Write-Host "Deploy OK. Smoke : tracking_code doit commencer par AZ-"
