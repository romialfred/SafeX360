package com.hrms.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller TEMPORAIRE de reparation BDD (SQL direct via JdbcTemplate).
 *
 * Cible : reparer les comptes corrompus (TransientObjectException sur Account.employee/company)
 * via UPDATE SQL natif, sans passer par Hibernate. Hibernate ne peut pas remettre une
 * reference orpheline en NULL via save() — il faut SQL direct.
 *
 * SECURITE : tous les endpoints exigent le header X-Repair-Secret = SAFEX_REPAIR_2026.
 * Cet endpoint DOIT etre supprime apres usage en production.
 *
 * Usage :
 *   curl -X POST http://localhost:9000/hrms/admin-repair/clear-employee/2 -H "X-Repair-Secret: SAFEX_REPAIR_2026"
 *   curl -X POST http://localhost:9000/hrms/admin-repair/clear-company/2 -H "X-Repair-Secret: SAFEX_REPAIR_2026"
 *   curl -X POST "http://localhost:9000/hrms/admin-repair/set-company/2?companyId=1" -H "X-Repair-Secret: SAFEX_REPAIR_2026"
 *   curl -X POST "http://localhost:9000/hrms/admin-repair/set-employee/2?empId=1" -H "X-Repair-Secret: SAFEX_REPAIR_2026"
 *   curl    http://localhost:9000/hrms/admin-repair/diag/2 -H "X-Repair-Secret: SAFEX_REPAIR_2026"
 */
@RestController
@RequestMapping("/admin-repair")
public class AdminRepairController {

    private static final String SECRET = "SAFEX_REPAIR_2026";

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Value("${spring.datasource.url:NONE}")
    private String dsUrl;

    private ResponseEntity<?> guard(String header) {
        if (header == null || !SECRET.equals(header)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "missing or invalid X-Repair-Secret header"));
        }
        return null;
    }

    /** Diagnostic complet : structure du compte + presence FK. */
    @GetMapping("/diag/{accountId}")
    public ResponseEntity<?> diagnose(@PathVariable Long accountId, @RequestHeader(value = "X-Repair-Secret", required = false) String header) {
        ResponseEntity<?> g = guard(header); if (g != null) return g;
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM account WHERE id = ?", accountId);
            Map<String, Object> resp = new HashMap<>();
            resp.put("accountId", accountId);
            resp.put("found", !rows.isEmpty());
            if (!rows.isEmpty()) resp.put("row", rows.get(0));
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /** Reset complet : enleve emp_id ET company_id (revient a un compte detache). */
    @PostMapping("/clear-all/{accountId}")
    public ResponseEntity<?> clearAll(@PathVariable Long accountId, @RequestHeader(value = "X-Repair-Secret", required = false) String header) {
        ResponseEntity<?> g = guard(header); if (g != null) return g;
        try {
            int n = jdbcTemplate.update("UPDATE account SET emp_id = NULL, company_id = NULL WHERE id = ?", accountId);
            return ResponseEntity.ok(Map.of("updated", n, "accountId", accountId, "operation", "clear-all"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /** Enleve la reference employee uniquement (laisse company en place). */
    @PostMapping("/clear-employee/{accountId}")
    public ResponseEntity<?> clearEmployee(@PathVariable Long accountId, @RequestHeader(value = "X-Repair-Secret", required = false) String header) {
        ResponseEntity<?> g = guard(header); if (g != null) return g;
        try {
            int n = jdbcTemplate.update("UPDATE account SET emp_id = NULL WHERE id = ?", accountId);
            return ResponseEntity.ok(Map.of("updated", n, "accountId", accountId));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /** Enleve la reference company uniquement. */
    @PostMapping("/clear-company/{accountId}")
    public ResponseEntity<?> clearCompany(@PathVariable Long accountId, @RequestHeader(value = "X-Repair-Secret", required = false) String header) {
        ResponseEntity<?> g = guard(header); if (g != null) return g;
        try {
            int n = jdbcTemplate.update("UPDATE account SET company_id = NULL WHERE id = ?", accountId);
            return ResponseEntity.ok(Map.of("updated", n, "accountId", accountId));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /** Force une company_id valide. */
    @PostMapping("/set-company/{accountId}")
    public ResponseEntity<?> setCompany(@PathVariable Long accountId, @RequestParam Long companyId, @RequestHeader(value = "X-Repair-Secret", required = false) String header) {
        ResponseEntity<?> g = guard(header); if (g != null) return g;
        try {
            // Verifie que la company existe avant d'updater
            Integer exists = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM company WHERE id = ?", Integer.class, companyId);
            if (exists == null || exists == 0) {
                return ResponseEntity.status(404).body(Map.of("error", "Company not found", "companyId", companyId));
            }
            int n = jdbcTemplate.update("UPDATE account SET company_id = ? WHERE id = ?", companyId, accountId);
            return ResponseEntity.ok(Map.of("updated", n, "accountId", accountId, "companyId", companyId));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /** Force un emp_id valide. */
    @PostMapping("/set-employee/{accountId}")
    public ResponseEntity<?> setEmployee(@PathVariable Long accountId, @RequestParam Long empId, @RequestHeader(value = "X-Repair-Secret", required = false) String header) {
        ResponseEntity<?> g = guard(header); if (g != null) return g;
        try {
            Integer exists = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM employee WHERE id = ?", Integer.class, empId);
            if (exists == null || exists == 0) {
                return ResponseEntity.status(404).body(Map.of("error", "Employee not found", "empId", empId));
            }
            int n = jdbcTemplate.update("UPDATE account SET emp_id = ? WHERE id = ?", empId, accountId);
            return ResponseEntity.ok(Map.of("updated", n, "accountId", accountId, "empId", empId));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /** Change le nom affiche d'un compte (champ account.name). */
    @PostMapping("/set-name/{accountId}")
    public ResponseEntity<?> setName(@PathVariable Long accountId, @RequestParam String name,
                                     @RequestHeader(value = "X-Repair-Secret", required = false) String header) {
        ResponseEntity<?> g = guard(header); if (g != null) return g;
        try {
            int n = jdbcTemplate.update("UPDATE account SET name = ? WHERE id = ?", name, accountId);
            return ResponseEntity.ok(Map.of("updated", n, "accountId", accountId, "name", name));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /** Copie le password hash d'un compte source vers un compte cible. */
    @PostMapping("/copy-password/{targetId}")
    public ResponseEntity<?> copyPassword(@PathVariable Long targetId, @RequestParam Long sourceId,
                                          @RequestHeader(value = "X-Repair-Secret", required = false) String header) {
        ResponseEntity<?> g = guard(header); if (g != null) return g;
        try {
            String hash = jdbcTemplate.queryForObject("SELECT password FROM account WHERE id = ?", String.class, sourceId);
            if (hash == null) return ResponseEntity.status(404).body(Map.of("error", "Source not found"));
            int n = jdbcTemplate.update("UPDATE account SET password = ? WHERE id = ?", hash, targetId);
            return ResponseEntity.ok(Map.of("updated", n, "targetId", targetId, "sourceId", sourceId));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /** Active un compte (active=1). */
    @PostMapping("/activate/{accountId}")
    public ResponseEntity<?> activate(@PathVariable Long accountId, @RequestHeader(value = "X-Repair-Secret", required = false) String header) {
        ResponseEntity<?> g = guard(header); if (g != null) return g;
        try {
            int n = jdbcTemplate.update("UPDATE account SET active = 1 WHERE id = ?", accountId);
            return ResponseEntity.ok(Map.of("updated", n, "accountId", accountId, "active", true));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
