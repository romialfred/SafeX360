package com.minexpert.hns.ai.dto;

/**
 * IdentifiedRisk — Risque HSE détecté par l'IA dans l'image.
 *
 * Note de gravité (1-5) et probabilité (1-5) selon matrice ISO 31000.
 *  - gravité × probabilité = niveau de criticité (1-25)
 */
public class IdentifiedRisk {

    private String risk;
    private int gravity;        // 1-5 (1=mineur, 5=catastrophique)
    private int probability;    // 1-5 (1=improbable, 5=certain)

    public IdentifiedRisk() {}

    public IdentifiedRisk(String risk, int gravity, int probability) {
        this.risk = risk;
        this.gravity = gravity;
        this.probability = probability;
    }

    public String getRisk() { return risk; }
    public void setRisk(String risk) { this.risk = risk; }

    public int getGravity() { return gravity; }
    public void setGravity(int gravity) { this.gravity = gravity; }

    public int getProbability() { return probability; }
    public void setProbability(int probability) { this.probability = probability; }

    /** Score de criticité gravité × probabilité (1-25). */
    public int getCriticality() {
        return gravity * probability;
    }
}
