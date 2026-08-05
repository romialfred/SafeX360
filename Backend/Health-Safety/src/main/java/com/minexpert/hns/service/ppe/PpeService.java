package com.minexpert.hns.service.ppe;

import com.minexpert.hns.dto.ppe.PpeDTO;
import com.minexpert.hns.entity.ppe.PpeMovementType;
import com.minexpert.hns.exception.HSException;

import java.util.List;

public interface PpeService {
    PpeDTO create(PpeDTO dto) throws HSException;

    public PpeDTO update(PpeDTO dto, Long companyId) throws HSException;

    PpeDTO getById(Long id, Long companyId) throws HSException;

    List<PpeDTO> getAllStocks(Long companyId) throws HSException;

    List<PpeDTO> getActiveStocks(Long companyId) throws HSException;

    void activateStock(Long id, Long companyId) throws HSException;

    void deactivateStock(Long id, Long companyId) throws HSException;

    public Integer updateStockQuantity(Long id, Integer quantity, String operation) throws HSException;

    public List<Integer> updateStockQuantities(List<Long> ids, Integer quantity, String operation)
            throws HSException;

    /**
     * SEULE VOIE DE MUTATION DU STOCK. Applique un mouvement SIGNÉ à un EPI : écrit
     * une ligne immuable dans le journal {@code ppe_stock_movement} ET met à jour
     * l'agrégat {@code Ppe.stock} dans la MÊME transaction. Garantit l'invariant
     * {@code Ppe.stock == SUM(mouvements)}, refuse un stock négatif, respecte le
     * cloisonnement mine, et s'appuie sur le verrou optimiste contre la concurrence.
     *
     * @param ppeId       EPI concerné.
     * @param signedDelta delta signé (positif = entrée, négatif = sortie).
     * @param type        nature du mouvement (RECEIPT, ISSUE, CORRECTION…).
     * @param reference   référence du document d'origine (ex. « REQ-5 »), ou null.
     * @param companyId   mine appelante ; si non null, doit correspondre à celle de l'EPI.
     * @param actorId     utilisateur à l'origine, ou null.
     * @return le nouveau solde de l'EPI.
     */
    int applyStockMovement(Long ppeId, int signedDelta, PpeMovementType type, String reference,
            Long companyId, Long actorId) throws HSException;

    List<PpeDTO> getLowStock(Long companyId) throws HSException;
}
