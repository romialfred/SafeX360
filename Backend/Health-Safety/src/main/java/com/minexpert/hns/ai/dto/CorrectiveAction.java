package com.minexpert.hns.ai.dto;

/**
 * CorrectiveAction — Action corrective proposée par l'IA suite à l'analyse.
 *
 *  - P0 : action immédiate (évacuation, arrêt)
 *  - P1 : court terme (24-72h)
 *  - P2 : moyen terme (1 semaine)
 *  - P3 : long terme (>1 mois)
 */
public class CorrectiveAction {

    private String priority;     // P0, P1, P2, P3
    private String action;
    private String deadline;     // ex : "Immédiat", "24h", "7j"
    private String category;     // ex : "ELIMINATION", "SUBSTITUTION", "ENGINEERING", "ADMINISTRATIVE", "PPE"

    public CorrectiveAction() {}

    public CorrectiveAction(String priority, String action, String deadline, String category) {
        this.priority = priority;
        this.action = action;
        this.deadline = deadline;
        this.category = category;
    }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getDeadline() { return deadline; }
    public void setDeadline(String deadline) { this.deadline = deadline; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
}
