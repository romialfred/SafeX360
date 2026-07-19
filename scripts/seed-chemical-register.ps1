# LOT 49 — Seed du registre chimique (vide en base).
# 8 produits chimiques réels du secteur minier + leur analyse de risque
# positionnée sur la matrice probabilité × gravité (riskMap frontend).

if ([string]::IsNullOrWhiteSpace($env:SAFEX_ADMIN_SESSION_COOKIE)) { throw 'SAFEX_ADMIN_SESSION_COOKIE requis' }
$h = @{ 'Cookie' = "jwt=$($env:SAFEX_ADMIN_SESSION_COOKIE)" }
$base = 'http://localhost:9100/hns'
$today = Get-Date

function Invoke-Api {
    param([string]$Method, [string]$Url, [object]$Body)
    $bytes = [System.Text.Encoding]::UTF8.GetBytes((ConvertTo-Json $Body -Depth 6))
    return Invoke-RestMethod -Uri $Url -Method $Method -Headers $h -Body $bytes -ContentType 'application/json; charset=utf-8' -TimeoutSec 60
}

# severity = rang du niveau riskMap (Low=1, Low Med=2, Medium=3, Med High=4, High=5)
# riskLevel = "{probabilité}{severity}"
$risks = @(
    @{
        title = 'Cyanure de sodium — Circuit de lixiviation'; chemicalName = 'Cyanure de sodium (NaCN)'; casNumber = '143-33-9'
        classification = 'Toxic'; hazardSource = 'Handling'; status = 'IN_PROGRESS'
        description = "Préparation et dosage de la solution cyanurée pour la lixiviation du minerai aurifère. Manipulation de briquettes solides deux fois par poste."
        potentialConsequences = "Intoxication aiguë mortelle par inhalation d'acide cyanhydrique ou contact cutané, pollution majeure du bassin en cas de déversement."
        methodOfUse = "Dissolution en cuve agitée fermée, dosage automatique vers les tanks de lixiviation."
        departmentId = 4; workProcessId = 2; ownerId = 4
        analysis = @{ gravity = 5; probability = 3; severity = 4; riskLevel = '34'
            currentControls = "Local cyanure ventilé sous contrôle d'accès, détecteurs HCN fixes, EPI complets (combinaison, masque à cartouche B2P3), binôme obligatoire, kit d'antidote au poste."
            additionalControl = "Automatiser l'ouverture des fûts pour supprimer la manipulation manuelle des briquettes."
            preventiveMeasures = "Recyclage annuel cyanure pour tous les opérateurs du circuit, exercice de déversement semestriel." }
    },
    @{
        title = 'Acide sulfurique 98 % — Dépotage et stockage'; chemicalName = 'Acide sulfurique 98 %'; casNumber = '7664-93-9'
        classification = 'Corrosive'; hazardSource = 'Storage'; status = 'OPEN'
        description = "Réception hebdomadaire par camion-citerne et stockage en cuve de 30 m3 pour l'ajustement du pH du circuit de traitement."
        potentialConsequences = "Brûlures chimiques graves lors du dépotage, dégagement de vapeurs corrosives, corrosion des structures en cas de fuite de cuve."
        methodOfUse = "Dépotage par flexible avec raccord sec, transfert automatique vers les cuves de dilution."
        departmentId = 6; workProcessId = 1; ownerId = 5
        analysis = @{ gravity = 4; probability = 3; severity = 3; riskLevel = '33'
            currentControls = "Rétention béton 110 %, douche et lave-œil à moins de 10 m, écran facial et tablier néoprène, procédure de dépotage à deux."
            additionalControl = "Installer un bras de dépotage articulé à la place du flexible."
            preventiveMeasures = "Inspection trimestrielle de l'état de la cuve et des flexibles, formation au dépotage des corrosifs." }
    },
    @{
        title = "Nitrate d'ammonium — Magasin explosifs"; chemicalName = "Nitrate d'ammonium (ANFO)"; casNumber = '6484-52-2'
        classification = 'Explosive'; hazardSource = 'Storage'; status = 'IN_PROGRESS'
        description = "Stockage du nitrate d'ammonium en big bags au magasin explosifs du site B avant fabrication de l'ANFO pour les tirs."
        potentialConsequences = "Explosion en masse en cas d'incendie ou de contamination par hydrocarbures, effets dominos sur les installations voisines."
        methodOfUse = "Stockage sur palettes bois propres, mélange ANFO préparé le jour du tir uniquement."
        departmentId = 7; workProcessId = 3; ownerId = 6
        analysis = @{ gravity = 5; probability = 2; severity = 3; riskLevel = '23'
            currentControls = "Magasin agréé sous double clé, distances de sécurité réglementaires, interdiction de tout produit combustible dans le local, ronde de surveillance."
            additionalControl = "Détection incendie reliée au poste de garde."
            preventiveMeasures = "Audit annuel du magasin par la Direction des Mines, contrôle d'intégrité des big bags à réception." }
    },
    @{
        title = 'Soude caustique 50 % — Atelier élution'; chemicalName = 'Hydroxyde de sodium 50 %'; casNumber = '1310-73-2'
        classification = 'Corrosive'; hazardSource = 'Mixing'; status = 'OPEN'
        description = "Préparation de la solution d'élution (soude + cyanure) pour la désorption du charbon actif."
        potentialConsequences = "Projections caustiques aux yeux et au visage lors de la préparation, réaction exothermique en cas d'ajout d'eau incorrect."
        methodOfUse = "Dilution en cuve dédiée avec agitation, ajout lent contrôlé par débitmètre."
        departmentId = 4; workProcessId = 2; ownerId = 7
        analysis = @{ gravity = 3; probability = 3; severity = 2; riskLevel = '32'
            currentControls = "Écran facial intégral, gants néoprène manchettes longues, procédure d'ajout acide-dans-eau affichée au poste."
            additionalControl = ''
            preventiveMeasures = "Rappel au quart sur l'ordre d'ajout des réactifs." }
    },
    @{
        title = 'Chaux vive — Silo de neutralisation'; chemicalName = 'Chaux vive (oxyde de calcium)'; casNumber = '1305-78-8'
        classification = 'Irritant'; hazardSource = 'Handling'; status = 'CLOSED'
        description = "Dépotage pneumatique de la chaux vive vers le silo et dosage automatique pour la neutralisation des effluents."
        potentialConsequences = "Irritations cutanées et oculaires par envol de poussières lors du dépotage, brûlures au contact de chaux humide."
        methodOfUse = "Transfert pneumatique fermé citerne-silo, dosage vis sans fin asservi au pH-mètre."
        departmentId = 3; workProcessId = 4; ownerId = 8
        analysis = @{ gravity = 2; probability = 4; severity = 2; riskLevel = '42'
            currentControls = "Filtre à manches sur l'évent du silo, lunettes masque et gants lors des raccordements, consigne d'arrêt en cas de fuite visible."
            additionalControl = "Asservissement du dépotage à la dépression du filtre (réalisé)."
            preventiveMeasures = "Contrôle mensuel du filtre à manches." }
    },
    @{
        title = 'Gazole — Distribution engins miniers'; chemicalName = 'Gazole non routier'; casNumber = '68334-30-5'
        classification = 'Flammable'; hazardSource = 'Transport'; status = 'OPEN'
        description = "Ravitaillement quotidien des tombereaux et pelles à la station-service du site et par camion-citerne au front de taille."
        potentialConsequences = "Incendie lors du ravitaillement moteur chaud, pollution des sols en cas d'épandage au front."
        methodOfUse = "Pistolets à arrêt automatique, ravitaillement au front par citerne équipée."
        departmentId = 3; workProcessId = 5; ownerId = 1
        analysis = @{ gravity = 3; probability = 3; severity = 2; riskLevel = '32'
            currentControls = "Extincteurs sur citerne et engins, coupure moteur obligatoire, kit antipollution dans chaque citerne, aire de ravitaillement étanche."
            additionalControl = "Baliser une zone d'exclusion de 5 m pendant le ravitaillement au front."
            preventiveMeasures = "Sensibilisation conducteurs au risque incendie carburant." }
    },
    @{
        title = "Peroxyde d'hydrogène 50 % — Détoxification"; chemicalName = "Peroxyde d'hydrogène 50 %"; casNumber = '7722-84-1'
        classification = 'Oxidizing'; hazardSource = 'Storage'; status = 'CLOSED'
        description = "Stockage en cubitainers pour la détoxification des effluents cyanurés avant rejet vers le parc à résidus."
        potentialConsequences = "Décomposition exothermique en cas de contamination, comburant aggravant tout départ de feu, projections oxydantes."
        methodOfUse = "Dosage par pompe doseuse depuis le cubitainer d'origine, jamais de transvasement."
        departmentId = 6; workProcessId = 1; ownerId = 4
        analysis = @{ gravity = 4; probability = 2; severity = 2; riskLevel = '22'
            currentControls = "Stockage ombragé ventilé à l'écart des matières organiques, rétention dédiée, rinçage systématique des lignes."
            additionalControl = ''
            preventiveMeasures = "Vérification mensuelle des évents de cubitainers." }
    },
    @{
        title = 'Floculant polyacrylamide — Épaississeur'; chemicalName = 'Floculant polyacrylamide'; casNumber = '9003-05-8'
        classification = 'Environmental Hazard'; hazardSource = 'Disposal'; status = 'OPEN'
        description = "Préparation de la solution de floculant pour l'épaississeur de résidus et gestion des emballages vides."
        potentialConsequences = "Sols extrêmement glissants en cas d'épandage, toxicité aquatique des rejets concentrés vers le milieu naturel."
        methodOfUse = "Préparation automatique en centrale de dilution, sacs vidés via lance-sacs."
        departmentId = 4; workProcessId = 4; ownerId = 5
        analysis = @{ gravity = 3; probability = 2; severity = 2; riskLevel = '22'
            currentControls = "Caillebotis antidérapants autour de la centrale, kit d'absorption dédié, collecte des sacs vides en filière agréée."
            additionalControl = "Mettre une rétention sous la pompe de transfert."
            preventiveMeasures = "Consigne de nettoyage immédiat de tout épandage." }
    }
)

$ok = 0; $ko = 0
foreach ($r in $risks) {
    $analysis = $r.analysis
    $payload = @{} + $r
    $payload.Remove('analysis')
    $payload['reviewDate'] = $today.AddDays(180).ToString('yyyy-MM-dd')
    try {
        $riskId = Invoke-Api -Method Post -Url "$base/chemical-risks/create" -Body $payload
        $aPayload = @{
            riskId = $riskId
            gravity = $analysis.gravity; probability = $analysis.probability
            severity = $analysis.severity; riskLevel = $analysis.riskLevel
            currentControls = $analysis.currentControls
            additionalControl = $analysis.additionalControl
            preventiveMeasures = $analysis.preventiveMeasures
            improvementsMeasures = ''; comments = ''; reason = ''
        }
        Invoke-Api -Method Post -Url "$base/chemical-risks/analysis/create" -Body $aPayload | Out-Null
        Write-Output "OK   $($r.chemicalName) (risque $riskId, niveau $($analysis.riskLevel))"
        $ok++
    } catch {
        Write-Output "ECHEC $($r.chemicalName) : $($_.Exception.Message)"
        $ko++
    }
}
Write-Output "Terminé : $ok produits crées, $ko échecs."
