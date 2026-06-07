package com.minexpert.hns.dosimetry.service;

import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * Lookup léger des données RH (table {@code employee} du module HRMS MineXpert) depuis le
 * module Health-Safety. Health-Safety et HRMS partagent la même base Aiven MySQL
 * ({@code defaultdb}), donc on peut lire la table {@code employee} via JdbcTemplate sans
 * passer par un appel REST/Feign cross-service (latence et SPOF réduits).
 *
 * <p>Le service expose deux modes :
 * <ul>
 *   <li>{@link #resolveBatch(Collection)} : résolution batch via {@code WHERE id IN (...)}
 *       pour enrichir une liste de DTOs sans N+1.</li>
 *   <li>{@link #resolveOne(Long)} : résolution unitaire pour les vues de détail.</li>
 * </ul>
 *
 * <p>Le service est défensif : si la table {@code employee} n'est pas accessible (ex : tests
 * unitaires sans BDD, environnement standalone, schema séparé), il log un WARN et retourne
 * une map vide / un Optional vide pour ne PAS casser les services appelants. Les champs
 * nominatifs des DTOs restent alors null comme avant.
 *
 * <p><b>Note schema :</b> la table {@code employee} (et ses jointures {@code position},
 * {@code department}) suit la convention Hibernate (camelCase Java -&gt; snake_case SQL via
 * la {@code SpringPhysicalNamingStrategy}). On utilise donc {@code first_name},
 * {@code family_name}, {@code unique_number}, {@code position_id}, {@code department_id}.
 */
@Service
public class EmployeeLookupService {

    private static final Logger LOGGER = LoggerFactory.getLogger(EmployeeLookupService.class);

    /**
     * Requête batch : enrichissement RH minimal (id, nom complet, matricule, poste, département).
     *
     * <p>LEFT JOIN sur {@code position} et {@code department} pour rester tolérant aux
     * employés non rattachés à un poste ou département (cas Phase 1 séed). Backticks autour de
     * {@code `position`} car {@code position} est un mot réservé MySQL.
     */
    private static final String SQL_BATCH =
            "SELECT e.id AS employee_id, "
                    + "       e.first_name AS first_name, "
                    + "       e.family_name AS family_name, "
                    + "       e.unique_number AS matricule, "
                    + "       p.name AS position_name, "
                    + "       d.name AS department_name "
                    + "FROM employee e "
                    + "LEFT JOIN `position` p ON p.id = e.position_id "
                    + "LEFT JOIN department d ON d.id = e.department_id "
                    + "WHERE e.id IN (%s)";

    /**
     * Variante : résolution par workerId (Dosimetry) via la jointure
     * {@code dosimetry_exposed_worker.employee_id -> employee.id}. Permet aux services
     * MedicalVisit / FitnessAssessment / DoseRecord d'enrichir directement à partir d'un
     * {@code workerId}, sans devoir charger ExposedWorker en JPA juste pour récupérer
     * l'employeeId.
     */
    private static final String SQL_BATCH_BY_WORKER =
            "SELECT w.id AS worker_id, "
                    + "       e.id AS employee_id, "
                    + "       e.first_name AS first_name, "
                    + "       e.family_name AS family_name, "
                    + "       e.unique_number AS matricule, "
                    + "       p.name AS position_name, "
                    + "       d.name AS department_name "
                    + "FROM dosimetry_exposed_worker w "
                    + "JOIN employee e ON e.id = w.employee_id "
                    + "LEFT JOIN `position` p ON p.id = e.position_id "
                    + "LEFT JOIN department d ON d.id = e.department_id "
                    + "WHERE w.id IN (%s)";

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public EmployeeLookupService(DataSource dataSource) {
        this.jdbcTemplate = dataSource != null ? new JdbcTemplate(dataSource) : null;
    }

    /** Constructeur dédié aux tests : permet d'injecter un JdbcTemplate mocké (ou null). */
    EmployeeLookupService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Résolution batch d'une collection d'employeeIds.
     *
     * @return une map immutable {employeeId -&gt; EmployeeInfo}. Les IDs non trouvés sont
     *         simplement absents de la map. Retourne une map vide si l'entrée est vide ou null.
     */
    public Map<Long, EmployeeInfo> resolveBatch(Collection<Long> employeeIds) {
        if (jdbcTemplate == null || employeeIds == null || employeeIds.isEmpty()) {
            return Collections.emptyMap();
        }
        // Dédoublonnage + retrait des null pour éviter "id IN (1,1,null,2)" non-portable.
        List<Long> distinctIds = employeeIds.stream()
                .filter(id -> id != null)
                .distinct()
                .collect(Collectors.toList());
        if (distinctIds.isEmpty()) {
            return Collections.emptyMap();
        }
        // Construction sûre de la clause IN : on injecte uniquement des Long.toString() ;
        // pas d'interpolation utilisateur, donc pas de risque d'injection SQL.
        String inClause = distinctIds.stream().map(String::valueOf).collect(Collectors.joining(","));
        String sql = String.format(SQL_BATCH, inClause);
        try {
            List<EmployeeInfo> rows = jdbcTemplate.query(sql, (rs, i) -> {
                Long id = rs.getLong("employee_id");
                String firstName = rs.getString("first_name");
                String familyName = rs.getString("family_name");
                String matricule = rs.getString("matricule");
                String positionName = rs.getString("position_name");
                String departmentName = rs.getString("department_name");
                String fullName = composeFullName(firstName, familyName);
                return new EmployeeInfo(id, fullName, matricule, positionName, departmentName);
            });
            Map<Long, EmployeeInfo> map = new HashMap<>(rows.size());
            for (EmployeeInfo info : rows) {
                map.put(info.employeeId(), info);
            }
            return map;
        } catch (DataAccessException ex) {
            // Tolérance : si la table employee n'est pas accessible (schema séparé, droits, etc.)
            // on ne casse pas l'endpoint dosimetry, on log et on renvoie un résultat dégradé.
            LOGGER.warn("[EmployeeLookupService] resolveBatch failed ({} ids): {}. "
                    + "Returning empty map; nominative fields will be null.",
                    distinctIds.size(), ex.getMessage());
            return Collections.emptyMap();
        }
    }

    /**
     * Résolution batch par workerId (table {@code dosimetry_exposed_worker}).
     *
     * @return map immutable {workerId -&gt; EmployeeInfo}. Comportement défensif identique
     *         à {@link #resolveBatch(Collection)}.
     */
    public Map<Long, EmployeeInfo> resolveByWorkerIds(Collection<Long> workerIds) {
        if (jdbcTemplate == null || workerIds == null || workerIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<Long> distinctIds = workerIds.stream()
                .filter(id -> id != null)
                .distinct()
                .collect(Collectors.toList());
        if (distinctIds.isEmpty()) {
            return Collections.emptyMap();
        }
        String inClause = distinctIds.stream().map(String::valueOf).collect(Collectors.joining(","));
        String sql = String.format(SQL_BATCH_BY_WORKER, inClause);
        try {
            Map<Long, EmployeeInfo> map = new HashMap<>(distinctIds.size());
            jdbcTemplate.query(sql, rs -> {
                Long workerId = rs.getLong("worker_id");
                Long employeeId = rs.getLong("employee_id");
                String fullName = composeFullName(
                        rs.getString("first_name"), rs.getString("family_name"));
                map.put(workerId, new EmployeeInfo(
                        employeeId,
                        fullName,
                        rs.getString("matricule"),
                        rs.getString("position_name"),
                        rs.getString("department_name")));
            });
            return map;
        } catch (DataAccessException ex) {
            LOGGER.warn("[EmployeeLookupService] resolveByWorkerIds failed ({} ids): {}. "
                    + "Returning empty map; nominative fields will be null.",
                    distinctIds.size(), ex.getMessage());
            return Collections.emptyMap();
        }
    }

    /** Résolution unitaire par workerId. */
    public Optional<EmployeeInfo> resolveOneByWorkerId(Long workerId) {
        if (workerId == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(resolveByWorkerIds(List.of(workerId)).get(workerId));
    }

    /** Résolution unitaire (vue de détail). */
    public Optional<EmployeeInfo> resolveOne(Long employeeId) {
        if (employeeId == null) {
            return Optional.empty();
        }
        Map<Long, EmployeeInfo> map = resolveBatch(List.of(employeeId));
        return Optional.ofNullable(map.get(employeeId));
    }

    private static String composeFullName(String firstName, String familyName) {
        String fn = firstName != null ? firstName.trim() : "";
        String ln = familyName != null ? familyName.trim() : "";
        String joined = (fn + " " + ln).trim();
        return joined.isEmpty() ? null : joined;
    }

    /**
     * Vue minimaliste d'un employé pour l'enrichissement des DTOs Dosimetry.
     */
    public record EmployeeInfo(
            Long employeeId,
            String fullName,
            String matricule,
            String position,
            String department) {
    }
}
