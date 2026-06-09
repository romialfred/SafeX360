# LOT 49 — Enrichissement des exigences réglementaires existantes.
# Remplace les 11 exigences héritées (titres anglais, fautes de frappe) par le
# catalogue minier français et complète jusqu'à 15. Conserve les IDs pour ne
# pas casser les affectations de postes ni les documents existants.

# Secret interne lu depuis Backend/.env (jamais en dur dans le depot).
$envLine = Get-Content "$PSScriptRoot\..\Backend\.env" | Where-Object { $_ -match '^INTERNAL_GATEWAY_SECRET=' }
$secret = ($envLine -split '=', 2)[1].Trim().Trim("'").Trim('"')
$h = @{ 'X-Secret-Key' = $secret }
$base = 'http://localhost:8081/hns/compliance-requirement'

$catalogue = @(
    @{ id = 1; referenceCode = 'EXG-001'; title = "Certificat d'aptitude médicale au poste"; description = "Visite médicale d'aptitude réalisée par le médecin du travail, obligatoire pour tout salarié affecté à un poste en zone minière."; category = 'Medical'; renewalFrequency = 'Annually'; docType = 'Certificate'; legalSource = 'Code du Travail — Médecine du travail'; authority = 'Ministère du Travail'; criticality = 'CRITIQUE' },
    @{ id = 2; referenceCode = 'EXG-002'; title = 'Visite médicale spéciale poussières (silicose)'; description = 'Suivi médical renforcé des salariés exposés aux poussières de silice cristalline : radiographie pulmonaire et spirométrie.'; category = 'Medical'; renewalFrequency = 'Semi-Annually'; docType = 'Scan'; legalSource = 'Convention OIT C176 — Sécurité dans les mines'; authority = 'Organisation Internationale du Travail'; criticality = 'CRITIQUE' },
    @{ id = 3; referenceCode = 'EXG-003'; title = 'Habilitation boutefeu (tir de mines)'; description = "Autorisation préfectorale individuelle de mise en oeuvre des explosifs : stockage, transport, chargement et tir."; category = 'Legal'; renewalFrequency = 'Annually'; docType = 'Certificate'; legalSource = 'Code Minier — Réglementation des explosifs'; authority = 'Direction Générale des Mines'; criticality = 'CRITIQUE' },
    @{ id = 4; referenceCode = 'EXG-004'; title = "Permis de conduite d'engins miniers (CACES)"; description = "Certificat d'aptitude à la conduite en sécurité des engins de chantier : tombereaux, pelles hydrauliques, chargeuses."; category = 'Training'; renewalFrequency = 'Biennially'; docType = 'Certificate'; legalSource = 'Recommandation CACES R482'; authority = 'Organisme certificateur agréé'; criticality = 'MAJEURE' },
    @{ id = 5; referenceCode = 'EXG-005'; title = 'Formation travail en espace confiné'; description = "Formation à l'intervention en espace confiné : détection de gaz, ventilation, procédures d'évacuation et de sauvetage."; category = 'Training'; renewalFrequency = 'Annually'; docType = 'Certificate'; legalSource = 'ISO 45001 — Maîtrise opérationnelle'; authority = 'Organisme de formation HSE'; criticality = 'CRITIQUE' },
    @{ id = 6; referenceCode = 'EXG-006'; title = 'Formation travail en hauteur'; description = "Formation au port du harnais, vérification des points d'ancrage et utilisation des équipements antichute."; category = 'Training'; renewalFrequency = 'Biennially'; docType = 'Certificate'; legalSource = 'ISO 45001 — Maîtrise opérationnelle'; authority = 'Organisme de formation HSE'; criticality = 'MAJEURE' },
    @{ id = 7; referenceCode = 'EXG-007'; title = 'Certification Sauveteur Secouriste du Travail (SST)'; description = 'Formation initiale ou maintien-actualisation des compétences de secourisme en milieu professionnel.'; category = 'Training'; renewalFrequency = 'Biennially'; docType = 'Certificate'; legalSource = 'Référentiel INRS SST'; authority = 'INRS / Croix-Rouge'; criticality = 'MAJEURE' },
    @{ id = 8; referenceCode = 'EXG-008'; title = 'Habilitation électrique (B1V/B2V/BR)'; description = "Habilitation pour travaux d'ordre électrique sur installations basse tension des sites d'extraction et de traitement."; category = 'Legal'; renewalFrequency = 'Biennially'; docType = 'Certificate'; legalSource = 'Norme NF C18-510'; authority = 'Employeur après formation certifiée'; criticality = 'CRITIQUE' },
    @{ id = 9; referenceCode = 'EXG-009'; title = 'Formation manipulation des produits chimiques (SGH)'; description = "Sensibilisation au Système Général Harmonisé : étiquetage, fiches de données de sécurité, stockage des réactifs."; category = 'Training'; renewalFrequency = 'Annually'; docType = 'Certificate'; legalSource = 'Règlement SGH/GHS'; authority = 'Service HSE interne'; criticality = 'MAJEURE' },
    @{ id = 10; referenceCode = 'EXG-010'; title = 'Audiogramme annuel (exposition au bruit)'; description = "Contrôle audiométrique des salariés exposés à un niveau sonore quotidien supérieur à 85 dB(A)."; category = 'Medical'; renewalFrequency = 'Annually'; docType = 'Scan'; legalSource = 'ISO 45001 — Surveillance de la santé'; authority = 'Médecine du travail'; criticality = 'STANDARD' },
    @{ id = 11; referenceCode = 'EXG-011'; title = 'Accueil sécurité site et test de validation'; description = "Induction HSE obligatoire avant tout accès au site : risques majeurs, plan d'évacuation, consignes EPI, test de compréhension."; category = 'Safety'; renewalFrequency = 'On Demand'; docType = 'PDF'; legalSource = 'Procédure interne HSE-ACC-01'; authority = 'Service HSE interne'; criticality = 'STANDARD' },
    @{ referenceCode = 'EXG-012'; title = 'Formation conduite défensive'; description = 'Formation à la conduite préventive sur pistes minières : distances de sécurité, angles morts des engins, conduite de nuit.'; category = 'Training'; renewalFrequency = 'Biennially'; docType = 'Certificate'; legalSource = 'Procédure interne HSE-TRA-04'; authority = 'Service HSE interne'; criticality = 'STANDARD' },
    @{ referenceCode = 'EXG-013'; title = 'Autorisation de travail à chaud (permis feu)'; description = 'Habilitation à délivrer ou exécuter des permis feu : soudage, meulage, oxycoupage hors zones dédiées.'; category = 'Safety'; renewalFrequency = 'Annually'; docType = 'PDF'; legalSource = 'ISO 45001 — Permis de travail'; authority = 'Service HSE interne'; criticality = 'MAJEURE' },
    @{ referenceCode = 'EXG-014'; title = 'Certificat de radioprotection (zones contrôlées)'; description = "Formation réglementaire pour l'accès aux zones contrôlées : sources scellées des analyseurs et jauges nucléaires."; category = 'Legal'; renewalFrequency = 'Annually'; docType = 'Certificate'; legalSource = 'Normes AIEA GSR Part 3'; authority = 'Autorité de Radioprotection Nationale'; criticality = 'CRITIQUE' },
    @{ referenceCode = 'EXG-015'; title = 'Attestation de dotation et port des EPI'; description = "Attestation annuelle de remise des équipements de protection individuelle et d'engagement au port obligatoire."; category = 'Safety'; renewalFrequency = 'Annually'; docType = 'PDF'; legalSource = 'ISO 45001 — Équipements de protection'; authority = 'Service HSE interne'; criticality = 'STANDARD' }
)

$ok = 0; $ko = 0
foreach ($req in $catalogue) {
    $payload = @{} + $req
    $payload['status'] = 'ACTIVE'
    $json = ConvertTo-Json $payload -Depth 5
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    try {
        if ($req.ContainsKey('id')) {
            Invoke-RestMethod -Uri "$base/update" -Method Put -Headers $h -Body $bytes -ContentType 'application/json; charset=utf-8' -TimeoutSec 30 | Out-Null
            Write-Output "MAJ  $($req.referenceCode) — $($req.title)"
        } else {
            Invoke-RestMethod -Uri "$base/create" -Method Post -Headers $h -Body $bytes -ContentType 'application/json; charset=utf-8' -TimeoutSec 30 | Out-Null
            Write-Output "CREA $($req.referenceCode) — $($req.title)"
        }
        $ok++
    } catch {
        Write-Output "ECHEC $($req.referenceCode) : $($_.Exception.Message)"
        $ko++
    }
}
Write-Output "Terminé : $ok réussites, $ko échecs."
