#!/usr/bin/env bash
# Seed 5 points de rassemblement realistes pour Burkina GOLD SA (companyId=1)
# Utilise des fichiers JSON intermediaires (UTF-8) pour eviter le bug d'encodage
# curl/Git-Bash avec les accents francais dans le payload.

SECRET="a-very-long-random-string-must-be-rotated-prod-XYZ-2026-LOT41"
HS="http://localhost:8081/hns"
TMP="$(dirname "$0")/.seed-tmp"
mkdir -p "$TMP"

create_ap() {
    local file="$1"
    local resp
    resp=$(curl -s -X POST -H "X-Secret-Key: $SECRET" \
        -H "Content-Type: application/json; charset=UTF-8" \
        --data-binary "@$file" \
        "$HS/emergency/assembly-points?actorId=1")
    echo "  -> $resp" | head -c 220
    echo ""
}

# ─────────────────────────────────────────────────────────────────────
cat > "$TMP/ap1.json" <<'EOF'
{
  "companyId": 1,
  "name": "Aire de rassemblement Principale",
  "latitude": 12.371428,
  "longitude": -1.519660,
  "evacuationPriority": 1,
  "maxCapacity": 500,
  "managerId": 1,
  "deputyManagerId": 7,
  "locationText": "Devant la grille d'entrée principale, parking visiteurs",
  "description": "Zone bétonnée éclairée et signalisée — accès véhicules de secours par l'ouest. Point central pour évacuation générale. Testée lors du drill annuel de mars 2026.",
  "departmentIdsCsv": "18,19,32,2,7,26,3,4,6,12,40,21,5,11,9,17,14,1,27,28"
}
EOF

cat > "$TMP/ap2.json" <<'EOF'
{
  "companyId": 1,
  "name": "Aire Administration & Bureaux",
  "latitude": 12.372150,
  "longitude": -1.518900,
  "evacuationPriority": 2,
  "maxCapacity": 150,
  "managerId": 4,
  "deputyManagerId": 11,
  "locationText": "Parking du bâtiment administratif, côté est",
  "description": "Réservée au personnel administratif (Finance, RH, IT, Administration, Audit). Proximité immédiate des bureaux pour évacuation rapide en moins de 90s.",
  "departmentIdsCsv": "2,26,27,28,1,14"
}
EOF

cat > "$TMP/ap3.json" <<'EOF'
{
  "companyId": 1,
  "name": "Aire Maintenance & Atelier",
  "latitude": 12.370800,
  "longitude": -1.520400,
  "evacuationPriority": 2,
  "maxCapacity": 200,
  "managerId": 13,
  "deputyManagerId": 14,
  "locationText": "Cour de l'atelier de maintenance, devant les hangars",
  "description": "Dédiée aux équipes maintenance (Mobile, Préventive), magasin (Warehouse), Transport et Amélioration Continue. Accès direct aux véhicules de secours et fontaines de décontamination.",
  "departmentIdsCsv": "3,4,6,12,8"
}
EOF

cat > "$TMP/ap4.json" <<'EOF'
{
  "companyId": 1,
  "name": "Aire Camp & Hébergement",
  "latitude": 12.369500,
  "longitude": -1.521700,
  "evacuationPriority": 3,
  "maxCapacity": 300,
  "managerId": 16,
  "deputyManagerId": 17,
  "locationText": "Esplanade centrale du camp vie, près des dortoirs",
  "description": "Zone d'évacuation pour les employés en hébergement (camp), équipes Communauté et Communication. Espace ouvert avec point d'eau et abri solaire pour attente prolongée.",
  "departmentIdsCsv": "40,21,5,20,25,12"
}
EOF

cat > "$TMP/ap5.json" <<'EOF'
{
  "companyId": 1,
  "name": "Aire Laboratoire & Environnement",
  "latitude": 12.373100,
  "longitude": -1.517500,
  "evacuationPriority": 4,
  "maxCapacity": 80,
  "managerId": 15,
  "deputyManagerId": 18,
  "locationText": "Cour entre le laboratoire d'analyse et la station environnement",
  "description": "Point de rassemblement spécifique pour Laboratoire d'Analyse, Environnement, Safety et Audit & SOX. Équipée de douches de décontamination chimique.",
  "departmentIdsCsv": "9,11,17,14"
}
EOF

echo "════════════════════════════════════════════════════════"
echo "  SEED 5 POINTS DE RASSEMBLEMENT — Burkina GOLD SA"
echo "════════════════════════════════════════════════════════"
for i in 1 2 3 4 5; do
    echo "[$i] Creation AP #$i..."
    create_ap "$TMP/ap$i.json"
done

echo ""
echo "═══ VÉRIFICATION — liste finale ═══"
curl -s -H "X-Secret-Key: $SECRET" "$HS/emergency/assembly-points?companyId=1" \
    | python -c "
import sys, json
data = json.load(sys.stdin)
print(f'{len(data)} points actifs dans la BDD:')
for p in data:
    deps = p.get('departmentIdsCsv') or ''
    n = len([d for d in deps.split(',') if d.strip()]) if deps else 0
    print(f'  P{p[\"evacuationPriority\"]} #{p[\"id\"]} - {p[\"name\"]}')
    print(f'    Capacite: {p[\"maxCapacity\"]} pers. - Departements: {n} - Position: {p[\"latitude\"]:.4f}, {p[\"longitude\"]:.4f}')
" 2>&1

rm -rf "$TMP"
echo ""
echo "✓ Termine."
