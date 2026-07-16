package com.minexpert.hns.seed;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.minexpert.hns.entity.equipment.Equipment;
import com.minexpert.hns.repository.equipment.EquipmentRepository;

import lombok.RequiredArgsConstructor;

/**
 * Seed idempotent du registre des équipements de démonstration.
 *
 * <p>~6 équipements pour la mine 1 (Burkina GOLD SA) et ~3 pour la mine 6.
 * Idempotent au grain du couple (companyId, code) : un équipement déjà présent
 * n'est jamais dupliqué ni écrasé — un code manquant est (ré)inséré au prochain
 * démarrage.</p>
 */
@Component
@RequiredArgsConstructor
public class EquipmentSeeder implements CommandLineRunner {

    private static final Logger LOG = LoggerFactory.getLogger(EquipmentSeeder.class);

    private final EquipmentRepository equipmentRepository;

    @Override
    public void run(String... args) {
        int inserted = 0;

        // ── Mine 1 — Burkina GOLD SA ────────────────────────────────────────
        inserted += seed(1L, "CAM-A40G-18", "Camion benne Volvo A40G #18", "Camions", "Volvo", "A40G", "VCE-A40G-000018");
        inserted += seed(1L, "EXC-336", "Pelle hydraulique Cat 336", "Pelles", "Caterpillar", "336", "CAT0336-0004521");
        inserted += seed(1L, "FOR-DML", "Foreuse de production Epiroc DML", "Foreuses", "Epiroc", "DML-1200", "EPI-DML-000712");
        inserted += seed(1L, "CHA-966H", "Chargeuse sur pneus Cat 966H", "Chargeuses", "Caterpillar", "966H", "CAT966H-0001188");
        inserted += seed(1L, "CONC-C160", "Concasseur à mâchoires Metso C160", "Concasseurs", "Metso", "Nordberg C160", "MET-C160-0033");
        inserted += seed(1L, "GEN-500", "Groupe électrogène 500 kVA", "Groupes électrogènes", "Cummins", "C500 D5", "CUM-C500-0091");

        // ── Mine 6 ──────────────────────────────────────────────────────────
        inserted += seed(6L, "CAM-777F", "Camion benne Cat 777F", "Camions", "Caterpillar", "777F", "CAT777F-0002054");
        inserted += seed(6L, "EXC-6015B", "Pelle minière Cat 6015B", "Pelles", "Caterpillar", "6015B", "CAT6015-0000317");
        inserted += seed(6L, "GEN-250", "Groupe électrogène 250 kVA", "Groupes électrogènes", "Cummins", "C250 D5", "CUM-C250-0044");

        if (inserted > 0) {
            LOG.info("[EquipmentSeeder] {} équipement(s) de démo inséré(s).", inserted);
        }
    }

    /**
     * Insère l'équipement s'il n'existe pas déjà pour cette mine (par code).
     *
     * @return 1 si inséré, 0 si déjà présent.
     */
    private int seed(Long companyId, String code, String name, String type,
                     String brand, String model, String serialNumber) {
        if (equipmentRepository.findByCompanyIdAndCodeIgnoreCase(companyId, code).isPresent()) {
            return 0;
        }
        Equipment e = new Equipment();
        e.setCode(code);
        e.setName(name);
        e.setType(type);
        e.setBrand(brand);
        e.setModel(model);
        e.setSerialNumber(serialNumber);
        e.setStatus("ACTIVE");
        e.setCompanyId(companyId);
        e.setCreatedAt(LocalDateTime.now());
        e.setUpdatedAt(LocalDateTime.now());
        equipmentRepository.save(e);
        return 1;
    }
}
