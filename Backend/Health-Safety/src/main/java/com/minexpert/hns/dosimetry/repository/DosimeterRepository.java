package com.minexpert.hns.dosimetry.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.dosimetry.entity.Dosimeter;
import com.minexpert.hns.dosimetry.enums.DosimeterStatus;
import com.minexpert.hns.dosimetry.enums.DosimeterType;

@Repository
public interface DosimeterRepository extends JpaRepository<Dosimeter, Long> {

    List<Dosimeter> findByMineId(Long mineId);

    /** Compat. avec la convention companyId : equivalent a findByMineId pour ce module. */
    default List<Dosimeter> findByCompanyId(Long companyId) {
        return findByMineId(companyId);
    }

    Optional<Dosimeter> findBySerial(String serial);

    Optional<Dosimeter> findByQrCode(String qrCode);

    List<Dosimeter> findByStatus(DosimeterStatus status);

    List<Dosimeter> findByMineIdAndStatus(Long mineId, DosimeterStatus status);

    List<Dosimeter> findByType(DosimeterType type);

    /**
     * Liste les dosimetres d'une mine dont le statut est dans la liste fournie, tries par numero
     * de serie ascendant. Utilise pour la liste filtree du parc (ex. AVAILABLE + ASSIGNED).
     */
    List<Dosimeter> findByMineIdAndStatusInOrderBySerialAsc(Long mineId, List<DosimeterStatus> statuses);

    /**
     * Lookup precis d'un dosimetre par son QR code dans le perimetre d'une mine. Utilise pour le
     * scan terrain (un meme QR ne doit etre lu que dans le contexte de la mine de l'operateur).
     */
    Optional<Dosimeter> findByQrCodeAndMineId(String qrCode, Long mineId);

    /**
     * Dosimetres dont la date d'etalonnage prevue est anterieure a la date fournie, en excluant
     * un statut donne (typiquement RETIRED : un dosimetre retire n'a plus besoin d'etalonnage).
     * Utilise pour la generation des alertes calibration.
     */
    List<Dosimeter> findByCalibrationDueDateBeforeAndStatusNot(LocalDate date,
            DosimeterStatus excludedStatus);

    /**
     * Compte le nombre de dosimetres d'une mine pour un statut donne. Utilise pour les KPI du
     * tableau de bord parc (nb AVAILABLE, nb ASSIGNED, nb DAMAGED, ...).
     */
    int countByMineIdAndStatus(Long mineId, DosimeterStatus status);
}
