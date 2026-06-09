# LOT 49 — Génération des justificatifs de conformité de démonstration.
# Pour chaque couple (employé, exigence du poste) non couvert, crée un document
# PDF placeholder puis l'approuve, avec une distribution réaliste des statuts :
# conforme / échéance proche / expiré / en attente de validation / manquant.

$h = @{ 'X-Secret-Key' = 'a-very-long-random-string-must-be-rotated-prod-XYZ-2026-LOT41' }
$base = 'http://localhost:8081/hns'

$pdf = "%PDF-1.4`n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj`n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj`n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj`ntrailer<</Size 4/Root 1 0 R>>`n%%EOF"
$pdfB64 = [Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes($pdf))

function Invoke-Api {
    param([string]$Method, [string]$Url, [object]$Body)
    if ($null -ne $Body) {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes((ConvertTo-Json $Body -Depth 6))
        return Invoke-RestMethod -Uri $Url -Method $Method -Headers $h -Body $bytes -ContentType 'application/json; charset=utf-8' -TimeoutSec 60
    }
    return Invoke-RestMethod -Uri $Url -Method $Method -Headers $h -TimeoutSec 60
}

$employees = Invoke-Api -Method Get -Url "$base/compliance-docs/getAllEmpStatus"
Write-Output "Employés suivis : $($employees.Count)"

$created = 0; $approved = 0; $pending = 0; $skipped = 0; $errors = 0
$today = Get-Date

foreach ($emp in $employees) {
    try {
        $assign = Invoke-Api -Method Get -Url "$base/compliance-docs/getRequirementsByEmpId/$($emp.id)"
    } catch {
        Write-Output "ECHEC exigences employé $($emp.id) : $($_.Exception.Message)"
        $errors++; continue
    }
    foreach ($req in $assign.requirements) {
        if ($req.status -ne 'Non-Compliance') { continue }
        $hsh = [Math]::Abs(($emp.id * 31 + $req.requirementId * 17)) % 100
        $bucket = if ($hsh -lt 60) { 'COMPLIANT' } elseif ($hsh -lt 72) { 'UPCOMING' } elseif ($hsh -lt 83) { 'EXPIRED' } elseif ($hsh -lt 91) { 'PENDING' } else { 'MISSING' }
        if ($bucket -eq 'MISSING') { $skipped++; continue }

        $expiry = switch ($bucket) {
            'COMPLIANT' { $today.AddDays(60 + (($hsh * 4) % 320)) }
            'UPCOMING'  { $today.AddDays(3 + ($hsh % 26)) }
            'EXPIRED'   { $today.AddDays(-(5 + (($hsh - 72) * 15))) }
            'PENDING'   { $today.AddDays(150 + $hsh) }
        }
        $payload = @{
            requirementId = $req.requirementId
            employeeId    = $emp.id
            expiryDate    = $expiry.ToString('yyyy-MM-dd')
            media         = @{ name = "justificatif_$($req.requirementName -replace '[^a-zA-Z0-9]+','_').pdf"; file = $pdfB64 }
        }
        try {
            $docId = Invoke-Api -Method Post -Url "$base/compliance-docs/create" -Body $payload
            $created++
            if ($bucket -ne 'PENDING') {
                Invoke-Api -Method Put -Url "$base/compliance-docs/approve/$docId" | Out-Null
                $approved++
            } else {
                $pending++
            }
        } catch {
            Write-Output "ECHEC doc emp=$($emp.id) req=$($req.requirementId) : $($_.Exception.Message)"
            $errors++
        }
    }
}

Write-Output "Créés : $created (dont $approved approuvés, $pending en attente) · Manquants volontaires : $skipped · Erreurs : $errors"
