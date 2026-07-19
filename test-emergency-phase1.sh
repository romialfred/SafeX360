#!/usr/bin/env bash
# ===========================================================================
# Test runtime Emergency Phase 1 (LOT 48)
# ---------------------------------------------------------------------------
# À exécuter APRÈS redémarrage du service Health-Safety.
#
# Vérifie en cascade :
#   1. Le service Health-Safety répond (port 8081)
#   2. Le gateway 9000 route vers Emergency
#   3. La table emergency_settings est créée et accessible
#   4. GET getOrCreate fonctionne
#   5. PUT update persiste
#   6. Permissions endpoint répond
#   7. RescueTeam endpoint répond
#   8. EscalationRule endpoint répond
#   9. EmergencyMedia endpoint répond
# ===========================================================================

: "${INTERNAL_GATEWAY_SECRET:?INTERNAL_GATEWAY_SECRET is required}"
SECRET="$INTERNAL_GATEWAY_SECRET"
GW="http://localhost:9000"
HS_DIRECT="http://localhost:8081/hns"
COMPANY_ID=1   # Adapter à votre BDD (Burkina GOLD SA)

echo "═══════════════════════════════════════════════════════════════"
echo "  TEST 1 — Health-Safety direct (port 8081 actuator)"
echo "═══════════════════════════════════════════════════════════════"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:8081/hns/actuator/health

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  TEST 2 — Gateway route /hns/emergency/settings/${COMPANY_ID}"
echo "═══════════════════════════════════════════════════════════════"
curl -s -w "\nStatus: %{http_code}\n" \
    -H "X-Secret-Key: ${SECRET}" \
    "${GW}/hns/emergency/settings/${COMPANY_ID}"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  TEST 3 — PUT mise à jour Settings (autoDispatchSeconds=90)"
echo "═══════════════════════════════════════════════════════════════"
curl -s -w "\nStatus: %{http_code}\n" \
    -X PUT \
    -H "X-Secret-Key: ${SECRET}" \
    -H "Content-Type: application/json" \
    -d "{\"companyId\": ${COMPANY_ID}, \"autoDispatchSeconds\": 90}" \
    "${GW}/hns/emergency/settings?actorId=1"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  TEST 4 — GET permissions holders (COORDINATOR)"
echo "═══════════════════════════════════════════════════════════════"
curl -s -w "\nStatus: %{http_code}\n" \
    -H "X-Secret-Key: ${SECRET}" \
    "${GW}/hns/emergency/permissions/holders?permission=COORDINATOR&companyId=${COMPANY_ID}"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  TEST 5 — GET liste équipes secours"
echo "═══════════════════════════════════════════════════════════════"
curl -s -w "\nStatus: %{http_code}\n" \
    -H "X-Secret-Key: ${SECRET}" \
    "${GW}/hns/emergency/teams?companyId=${COMPANY_ID}"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  TEST 6 — GET liste règles escalade"
echo "═══════════════════════════════════════════════════════════════"
curl -s -w "\nStatus: %{http_code}\n" \
    -H "X-Secret-Key: ${SECRET}" \
    "${GW}/hns/emergency/escalation?companyId=${COMPANY_ID}"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  TEST 7 — GET liste médias"
echo "═══════════════════════════════════════════════════════════════"
curl -s -w "\nStatus: %{http_code}\n" \
    -H "X-Secret-Key: ${SECRET}" \
    "${GW}/hns/emergency/media?companyId=${COMPANY_ID}"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Tests terminés."
echo "  Status 200 partout = ✅ runtime OK"
echo "  Status 500 ou 404 = ❌ erreur à investiguer dans les logs Health-Safety"
echo "═══════════════════════════════════════════════════════════════"
