# LOT 49 — Seed Réunions Sécurité + Tournées Leadership.
# 1) Crée des activités du plan annuel 2026 (catégories HSE et TDM, statut PENDING)
# 2) Crée des hs-activities (HSM = réunions, ST = tournées) rattachées au plan
# 3) Fait évoluer quelques statuts (IN_PROGRESS / COMPLETED) pour la démo

$envLine = Get-Content "$PSScriptRoot\..\Backend\.env" | Where-Object { $_ -match '^INTERNAL_GATEWAY_SECRET=' }
$secret = ($envLine -split '=', 2)[1].Trim().Trim("'").Trim('"')
$h = @{ 'X-Secret-Key' = $secret }
$base = 'http://localhost:8081/hns'

function Invoke-Api {
    param([string]$Method, [string]$Url, [object]$Body)
    if ($null -ne $Body) {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes((ConvertTo-Json $Body -Depth 8))
        return Invoke-RestMethod -Uri $Url -Method $Method -Headers $h -Body $bytes -ContentType 'application/json; charset=utf-8' -TimeoutSec 60
    }
    return Invoke-RestMethod -Uri $Url -Method $Method -Headers $h -TimeoutSec 60
}

# Employés réels pour les participants (le backend ne stocke que id + role)
$employees = Invoke-Api -Method Get -Url "$base/compliance-docs/getAllEmpStatus"
function Participants {
    param([int[]]$Indices, [string[]]$Roles)
    $list = @()
    for ($i = 0; $i -lt $Indices.Count; $i++) {
        $e = $employees[$Indices[$i]]
        $list += @{ id = $e.id; role = $Roles[$i] }
    }
    return $list
}

# ─── 1. Plan annuel 2026 ────────────────────────────────────────────────────
$planItems = @(
    @{ title = 'Réunion sécurité mensuelle — Extraction'; category = 'HSE'; month = '2026-01-01' },
    @{ title = 'Causerie risques de chute en hauteur'; category = 'HSE'; month = '2026-02-01' },
    @{ title = 'Réunion retour d''expérience incidents T1'; category = 'HSE'; month = '2026-03-01' },
    @{ title = 'Causerie manipulation des produits chimiques'; category = 'HSE'; month = '2026-04-01' },
    @{ title = 'Réunion préparation saison des pluies'; category = 'HSE'; month = '2026-05-01' },
    @{ title = 'Réunion sécurité mensuelle — Traitement'; category = 'HSE'; month = '2026-06-01' },
    @{ title = 'Causerie consignation électrique (LOTO)'; category = 'HSE'; month = '2026-07-01' },
    @{ title = 'Réunion bilan HSE semestriel'; category = 'HSE'; month = '2026-08-01' },
    @{ title = 'Tournée direction — Fosse principale'; category = 'TDM'; month = '2026-02-01' },
    @{ title = 'Tournée direction — Usine de traitement'; category = 'TDM'; month = '2026-04-01' },
    @{ title = 'Tournée direction — Magasin explosifs'; category = 'TDM'; month = '2026-06-01' },
    @{ title = 'Tournée direction — Atelier maintenance'; category = 'TDM'; month = '2026-08-01' }
)
$responsibles = @(1, 4, 5, 6)
$planIds = @{ HSE = @(); TDM = @() }
$i = 0
foreach ($p in $planItems) {
    $payload = @{
        title = $p.title; category = $p.category; month = $p.month
        responsibleId = $responsibles[$i % $responsibles.Count]
        dateTime = ($p.month.Substring(0, 8) + '15T08:00:00')
        status = 'PENDING'
    }
    try {
        $created = Invoke-Api -Method Post -Url "$base/activity/create" -Body $payload
        $id = if ($created -is [long] -or $created -is [int]) { $created } elseif ($created.id) { $created.id } else { $created }
        $planIds[$p.category] += $id
        Write-Output "PLAN  $($p.category) #$id $($p.title)"
    } catch { Write-Output "ECHEC plan $($p.title) : $($_.Exception.Message)" }
    $i++
}

# ─── 2. Réunions (HSM) et tournées (ST) ────────────────────────────────────
$meetings = @(
    @{ plan = 0; date = '2026-01-22'; start = '08:00'; end = '09:00'; loc = '2'
       obj = "<p>Passer en revue les indicateurs sécurité de janvier avec l'équipe Extraction et rappeler les fondamentaux du plan de circulation.</p>"
       agenda = "<p>1. Indicateurs du mois — 2. Presqu'accidents signalés — 3. Plan de circulation fosse — 4. Questions des équipes.</p>"
       res = "<p>Plan de circulation réaffiché aux vestiaires, deux actions de balisage décidées.</p>"
       ppe = @('helmet', 'vest', 'boots'); part = (Participants -Indices 0,3,5 -Roles 'Responsable HSE','Superviseur','Opérateur'); status = 'COMPLETED' },
    @{ plan = 1; date = '2026-02-19'; start = '14:00'; end = '15:00'; loc = '3'
       obj = "<p>Sensibiliser les équipes maintenance au travail en hauteur après le presqu'accident du portique de criblage.</p>"
       agenda = "<p>1. Retour sur le presqu'accident — 2. Vérification des harnais — 3. Points d'ancrage homologués — 4. Engagements.</p>"
       res = "<p>Inventaire des harnais programmé, deux points d'ancrage à requalifier.</p>"
       ppe = @('helmet', 'harness', 'boots'); part = (Participants -Indices 1,4,6 -Roles 'Responsable HSE','Chef d''équipe','Technicien'); status = 'COMPLETED' },
    @{ plan = 2; date = '2026-03-26'; start = '10:00'; end = '11:30'; loc = '3'
       obj = "<p>Analyser collectivement les trois incidents du premier trimestre et partager les enseignements.</p>"
       agenda = "<p>1. Chronologie des incidents — 2. Causes racines — 3. Leçons apprises — 4. Plan d'action consolidé.</p>"
       res = "<p>Trois leçons apprises publiées, plan d'action consolidé validé par la direction.</p>"
       ppe = @('helmet', 'vest'); part = (Participants -Indices 0,2,7,8 -Roles 'Responsable HSE','Enquêteur','Superviseur','Opérateur'); status = 'COMPLETED' },
    @{ plan = 3; date = '2026-04-23'; start = '08:30'; end = '09:30'; loc = '5'
       obj = "<p>Former les équipes du laboratoire et du traitement à la lecture des fiches de données de sécurité.</p>"
       agenda = "<p>1. Pictogrammes SGH — 2. Lecture d'une FDS — 3. Stockages incompatibles — 4. Exercice pratique.</p>"
       res = "<p>Quiz validé par l'ensemble des participants, affiche SGH posée au laboratoire.</p>"
       ppe = @('goggles', 'gloves', 'mask'); part = (Participants -Indices 3,9,10 -Roles 'Responsable HSE','Chimiste','Opérateur'); status = 'COMPLETED' },
    @{ plan = 4; date = '2026-05-21'; start = '08:00'; end = '09:00'; loc = '2'
       obj = "<p>Préparer le site à la saison des pluies : drainage, stabilité des gradins et plan d'urgence inondation.</p>"
       agenda = "<p>1. État des drains — 2. Zones à risque de ravinement — 3. Consignes orage et foudre — 4. Répartition des contrôles.</p>"
       res = "<p>Programme de curage des drains arrêté, responsables de zone désignés.</p>"
       ppe = @('helmet', 'vest', 'boots'); part = (Participants -Indices 1,5,11 -Roles 'Responsable HSE','Géologue','Superviseur'); status = 'IN_PROGRESS' },
    @{ plan = 5; date = '2026-06-18'; start = '08:30'; end = '09:15'; loc = '3'
       obj = "<p>Réunion mensuelle de l'usine de traitement : indicateurs, remontées terrain et suivi des actions.</p>"
       agenda = "<p>1. Indicateurs de mai — 2. Remontées des opérateurs — 3. Suivi des actions ouvertes — 4. Divers.</p>"
       res = "<p>Deux remontées transformées en actions correctives, point EPI programmé.</p>"
       ppe = @('helmet', 'goggles', 'vest'); part = (Participants -Indices 2,6,9 -Roles 'Responsable HSE','Chef de poste','Opérateur'); status = 'IN_PROGRESS' },
    @{ plan = 6; date = '2026-07-16'; start = '14:00'; end = '15:00'; loc = '3'
       obj = "<p>Rappeler la procédure de consignation électrique avant les arrêts de maintenance de juillet.</p>"
       agenda = "<p>1. Les 5 étapes de la consignation — 2. Cadenas et étiquettes — 3. Cas concrets de l'atelier — 4. Évaluation.</p>"
       res = "<p>À renseigner après la tenue de la réunion.</p>"
       ppe = @('helmet', 'gloves'); part = (Participants -Indices 4,7,10 -Roles 'Responsable HSE','Électricien','Mécanicien'); status = 'PENDING' },
    @{ plan = 7; date = '2026-08-20'; start = '09:00'; end = '11:00'; loc = '5'
       obj = "<p>Présenter le bilan HSE du premier semestre à l'encadrement et fixer les priorités du second semestre.</p>"
       agenda = "<p>1. Bilan des indicateurs — 2. Avancement du plan annuel — 3. Priorités S2 — 4. Budget prévention.</p>"
       res = "<p>À renseigner après la tenue de la réunion.</p>"
       ppe = @('vest'); part = (Participants -Indices 0,1,2,3 -Roles 'Responsable HSE','Directeur d''exploitation','Superviseur','Représentant du personnel'); status = 'PENDING' }
)
$tours = @(
    @{ plan = 0; date = '2026-02-12'; start = '07:30'; end = '09:30'; loc = '2'
       obj = "<p>Tournée de la direction en fosse principale : conformité du plan de circulation et état des pistes.</p>"
       agenda = "<p>1. Accueil au poste de garde — 2. Parcours fosse niveau 1080 — 3. Échanges avec les conducteurs — 4. Synthèse.</p>"
       res = "<p>Deux observations positives, une zone de croisement à élargir sous 30 jours.</p>"
       ppe = @('helmet', 'vest', 'boots', 'goggles'); part = (Participants -Indices 1,0,5 -Roles 'Directeur d''exploitation','Responsable HSE','Superviseur'); status = 'COMPLETED' },
    @{ plan = 1; date = '2026-04-15'; start = '10:00'; end = '12:00'; loc = '3'
       obj = "<p>Tournée de la direction à l'usine : propreté des installations et respect du port des EPI.</p>"
       agenda = "<p>1. Broyage — 2. Lixiviation — 3. Salle de contrôle — 4. Restitution à chaud.</p>"
       res = "<p>Port des EPI conforme, signalisation à renforcer autour des cuves.</p>"
       ppe = @('helmet', 'goggles', 'mask', 'vest'); part = (Participants -Indices 2,0,9 -Roles 'Directeur d''exploitation','Responsable HSE','Chef de poste'); status = 'COMPLETED' },
    @{ plan = 2; date = '2026-06-17'; start = '08:00'; end = '09:30'; loc = '4'
       obj = "<p>Tournée de la direction au magasin explosifs : sûreté, registres et distances de sécurité.</p>"
       agenda = "<p>1. Contrôle d'accès — 2. Tenue des registres — 3. État du stockage — 4. Synthèse avec le boutefeu.</p>"
       res = "<p>À renseigner après la tournée.</p>"
       ppe = @('helmet', 'vest', 'boots'); part = (Participants -Indices 3,0,6 -Roles 'Directeur d''exploitation','Responsable HSE','Boutefeu'); status = 'IN_PROGRESS' },
    @{ plan = 3; date = '2026-08-12'; start = '14:00'; end = '16:00'; loc = '3'
       obj = "<p>Tournée de la direction à l'atelier maintenance : consignation, levage et rangement des zones de travail.</p>"
       agenda = "<p>1. Zone soudure — 2. Pont roulant — 3. Stockage des bouteilles de gaz — 4. Restitution.</p>"
       res = "<p>À renseigner après la tournée.</p>"
       ppe = @('helmet', 'goggles', 'gloves', 'boots'); part = (Participants -Indices 4,0,10 -Roles 'Directeur d''exploitation','Responsable HSE','Chef d''atelier'); status = 'PENDING' }
)

function Build-HsPayload {
    param([hashtable]$Item, [string]$Type, [long]$PlanId)
    return @{
        activityId = $PlanId; type = $Type; locationId = [long]$Item.loc
        plannedDate = $Item.date; startTime = $Item.start; endTime = $Item.end
        objectives = $Item.obj; agenda = $Item.agenda; expectedResults = $Item.res
        ppe = $Item.ppe; participants = $Item.part
    }
}

# Création (le POST ne renvoie pas d'identifiant : passe de statut séparée)
$ok = 0; $ko = 0
for ($m = 0; $m -lt $meetings.Count; $m++) {
    try {
        Invoke-Api -Method Post -Url "$base/hs-activity/create" -Body (Build-HsPayload -Item $meetings[$m] -Type 'HSM' -PlanId $planIds.HSE[$meetings[$m].plan]) | Out-Null
        Write-Output "HSM  $($meetings[$m].date)"
        $ok++
    } catch { Write-Output "ECHEC reunion $($meetings[$m].date) : $($_.Exception.Message)"; $ko++ }
}
for ($t = 0; $t -lt $tours.Count; $t++) {
    try {
        Invoke-Api -Method Post -Url "$base/hs-activity/create" -Body (Build-HsPayload -Item $tours[$t] -Type 'ST' -PlanId $planIds.TDM[$tours[$t].plan]) | Out-Null
        Write-Output "ST   $($tours[$t].date)"
        $ok++
    } catch { Write-Output "ECHEC tournee $($tours[$t].date) : $($_.Exception.Message)"; $ko++ }
}

# ─── 3. Passe de statuts (IN_PROGRESS / COMPLETED) ──────────────────────────
$allMeetings = Invoke-Api -Method Get -Url "$base/hs-activity/getAllMeetings"
$allTours = Invoke-Api -Method Get -Url "$base/hs-activity/getAllTours"
$statusOk = 0
function Set-HsStatus {
    param([array]$Rows, [array]$Items, [string]$Type, [hashtable]$PlanByIdx, [string]$Category)
    $count = 0
    foreach ($item in $Items) {
        if ($item.status -eq 'PENDING') { continue }
        $row = $Rows | Where-Object { "$($_.plannedDate)" -eq $item.date } | Select-Object -First 1
        if ($null -eq $row) { Write-Output "  (introuvable pour statut : $($item.date))"; continue }
        $payload = Build-HsPayload -Item $item -Type $Type -PlanId $PlanByIdx[$Category][$item.plan]
        $payload['id'] = $row.id
        $payload['status'] = $item.status
        try {
            Invoke-Api -Method Put -Url "$base/hs-activity/update" -Body $payload | Out-Null
            Write-Output "STAT $Type $($item.date) -> $($item.status)"
            $count++
        } catch { Write-Output "  (echec statut $($item.date) : $($_.Exception.Message))" }
    }
    return $count
}
$statusOk += Set-HsStatus -Rows $allMeetings -Items $meetings -Type 'HSM' -PlanByIdx $planIds -Category 'HSE'
$statusOk += Set-HsStatus -Rows $allTours -Items $tours -Type 'ST' -PlanByIdx $planIds -Category 'TDM'

Write-Output "Terminé : $ok hs-activities créées, $statusOk statuts appliqués, $ko échecs."
