# LOT 49 — Réparation : rattache les analyses de risque aux 8 produits chimiques
# déjà créés (le POST /create renvoie le DTO complet, pas un Long).

$envLine = Get-Content "$PSScriptRoot\..\Backend\.env" | Where-Object { $_ -match '^INTERNAL_GATEWAY_SECRET=' }
$secret = ($envLine -split '=', 2)[1].Trim().Trim("'").Trim('"')
$h = @{ 'X-Secret-Key' = $secret }
$base = 'http://localhost:8081/hns'

function Invoke-Api {
    param([string]$Method, [string]$Url, [object]$Body)
    if ($null -ne $Body) {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes((ConvertTo-Json $Body -Depth 6))
        return Invoke-RestMethod -Uri $Url -Method $Method -Headers $h -Body $bytes -ContentType 'application/json; charset=utf-8' -TimeoutSec 60
    }
    return Invoke-RestMethod -Uri $Url -Method $Method -Headers $h -TimeoutSec 60
}

# Cotations par numéro CAS (clé stable, indépendante des accents)
$analyses = @{
    '143-33-9'   = @{ gravity = 5; probability = 3; severity = 4; riskLevel = '34'
        currentControls = "Local cyanure ventilé sous contrôle d'accès, détecteurs HCN fixes, EPI complets (combinaison, masque à cartouche B2P3), binôme obligatoire, kit d'antidote au poste."
        additionalControl = "Automatiser l'ouverture des fûts pour supprimer la manipulation manuelle des briquettes."
        preventiveMeasures = "Recyclage annuel cyanure pour tous les opérateurs du circuit, exercice de déversement semestriel." }
    '7664-93-9'  = @{ gravity = 4; probability = 3; severity = 3; riskLevel = '33'
        currentControls = "Rétention béton 110 %, douche et lave-œil à moins de 10 m, écran facial et tablier néoprène, procédure de dépotage à deux."
        additionalControl = "Installer un bras de dépotage articulé à la place du flexible."
        preventiveMeasures = "Inspection trimestrielle de l'état de la cuve et des flexibles, formation au dépotage des corrosifs." }
    '6484-52-2'  = @{ gravity = 5; probability = 2; severity = 3; riskLevel = '23'
        currentControls = "Magasin agréé sous double clé, distances de sécurité réglementaires, interdiction de tout produit combustible dans le local, ronde de surveillance."
        additionalControl = "Détection incendie reliée au poste de garde."
        preventiveMeasures = "Audit annuel du magasin par la Direction des Mines, contrôle d'intégrité des big bags à réception." }
    '1310-73-2'  = @{ gravity = 3; probability = 3; severity = 2; riskLevel = '32'
        currentControls = "Écran facial intégral, gants néoprène manchettes longues, procédure d'ajout acide-dans-eau affichée au poste."
        additionalControl = ''
        preventiveMeasures = "Rappel au quart sur l'ordre d'ajout des réactifs." }
    '1305-78-8'  = @{ gravity = 2; probability = 4; severity = 2; riskLevel = '42'
        currentControls = "Filtre à manches sur l'évent du silo, lunettes masque et gants lors des raccordements, consigne d'arrêt en cas de fuite visible."
        additionalControl = "Asservissement du dépotage à la dépression du filtre (réalisé)."
        preventiveMeasures = "Contrôle mensuel du filtre à manches." }
    '68334-30-5' = @{ gravity = 3; probability = 3; severity = 2; riskLevel = '32'
        currentControls = "Extincteurs sur citerne et engins, coupure moteur obligatoire, kit antipollution dans chaque citerne, aire de ravitaillement étanche."
        additionalControl = "Baliser une zone d'exclusion de 5 m pendant le ravitaillement au front."
        preventiveMeasures = "Sensibilisation conducteurs au risque incendie carburant." }
    '7722-84-1'  = @{ gravity = 4; probability = 2; severity = 2; riskLevel = '22'
        currentControls = "Stockage ombragé ventilé à l'écart des matières organiques, rétention dédiée, rinçage systématique des lignes."
        additionalControl = ''
        preventiveMeasures = "Vérification mensuelle des évents de cubitainers." }
    '9003-05-8'  = @{ gravity = 3; probability = 2; severity = 2; riskLevel = '22'
        currentControls = "Caillebotis antidérapants autour de la centrale, kit d'absorption dédié, collecte des sacs vides en filière agréée."
        additionalControl = "Mettre une rétention sous la pompe de transfert."
        preventiveMeasures = "Consigne de nettoyage immédiat de tout épandage." }
}

$risks = Invoke-Api -Method Get -Url "$base/chemical-risks/getAll"
Write-Output "Risques chimiques en base : $($risks.Count)"

$ok = 0; $ko = 0; $skip = 0
foreach ($risk in $risks) {
    $a = $analyses[$risk.casNumber]
    if ($null -eq $a) { $skip++; continue }
    if ($risk.riskLevel) { Write-Output "DEJA  $($risk.chemicalName) (niveau $($risk.riskLevel))"; $skip++; continue }
    $payload = @{
        riskId = $risk.id
        gravity = $a.gravity; probability = $a.probability
        severity = $a.severity; riskLevel = $a.riskLevel
        currentControls = $a.currentControls
        additionalControl = $a.additionalControl
        preventiveMeasures = $a.preventiveMeasures
        improvementsMeasures = ''; comments = ''; reason = ''
    }
    try {
        Invoke-Api -Method Post -Url "$base/chemical-risks/analysis/create" -Body $payload | Out-Null
        Write-Output "OK    $($risk.chemicalName) (risque $($risk.id), niveau $($a.riskLevel))"
        $ok++
    } catch {
        Write-Output "ECHEC $($risk.chemicalName) : $($_.Exception.Message)"
        $ko++
    }
}
Write-Output "Terminé : $ok analyses créées, $skip ignorés, $ko échecs."
