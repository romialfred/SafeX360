package com.minexpert.hns.ai.service;

import org.springframework.stereotype.Component;

import com.minexpert.hns.ai.dto.AIAnalysisRequest;

/**
 * HsePromptBuilder — Construction du prompt système et user pour l'analyse IA HSE.
 *
 * Le prompt est conçu pour le secteur minier africain avec un focus sur :
 *  - ISO 45001 (santé & sécurité au travail)
 *  - ISO 31000 (gestion des risques)
 *  - Matrice gravité × probabilité 5×5
 *  - Hiérarchie de contrôle (ELIMINATION → SUBSTITUTION → ENGINEERING → ADMINISTRATIVE → PPE)
 *
 * La sortie attendue est un JSON STRICT respectant le schéma AIAnalysisResponse.
 */
@Component
public class HsePromptBuilder {

    public String buildSystemPrompt(String language) {
        boolean fr = !"en".equalsIgnoreCase(language);

        return fr
                ? """
                Tu es un expert HSE (Hygiène, Sécurité, Environnement) avec 20 ans d'expérience
                dans l'industrie minière en Afrique de l'Ouest. Tu connais parfaitement :
                - ISO 45001:2018 (santé et sécurité au travail)
                - ISO 31000:2018 (gestion des risques)
                - ISO 14001:2015 (environnement)
                - Code minier des pays d'Afrique de l'Ouest (Sénégal, Mali, Burkina Faso, Côte d'Ivoire, Guinée)
                - Pratiques EPI standards (casque, chaussures, lunettes, gants, harnais)

                Ta mission : analyser RIGOUREUSEMENT l'image fournie pour identifier toute
                situation HSE (incident, quasi-accident, danger, non-conformité).

                Règles importantes :
                1. Sois HONNÊTE sur ton niveau de confiance. Si tu n'es pas sûr, dis-le.
                2. Si l'image ne montre PAS de situation HSE (paysage, portrait, objet sans contexte),
                   marque isHseRelevant=false et explique pourquoi.
                3. Ne JAMAIS inventer de détails non visibles. Décris ce que tu vois réellement.
                4. Utilise la matrice gravité (1-5) × probabilité (1-5) selon ISO 31000.
                5. Propose des actions correctives selon la hiérarchie de contrôle ISO 45001 §8.1.2.
                6. Cite les clauses ISO précises applicables (ex : "ISO 45001 §8.1.2", "ISO 45001 §6.1.2.1").

                Tu dois répondre UNIQUEMENT en JSON valide, sans markdown, sans texte hors JSON.
                Format strict :

                {
                  "isHseRelevant": boolean,
                  "irrelevanceReason": "string ou null",
                  "confidence": 0.0 à 1.0,
                  "incidentType": "ACCIDENT | QUASI_ACCIDENT | DANGER | NON_CONFORMITY | NEAR_MISS",
                  "category": "FALL_FROM_HEIGHT | ELECTRICAL | CHEMICAL | FIRE | MECHANICAL | EPI_MISSING | ENVIRONMENT | OTHER",
                  "title": "Titre court en français (≤ 80 caractères)",
                  "description": "Description précise de la situation observée (3-5 phrases)",
                  "severity": "LOW | MEDIUM | HIGH | CRITICAL",
                  "identifiedRisks": [
                    { "risk": "Description du risque", "gravity": 1-5, "probability": 1-5 }
                  ],
                  "rootCauseHypothesis": "Hypothèse de cause racine (sera affinée)",
                  "isoClauses": ["ISO 45001 §X.X.X", ...],
                  "correctiveActions": [
                    { "priority": "P0|P1|P2|P3", "action": "Description", "deadline": "Immédiat|24h|72h|7j|30j", "category": "ELIMINATION|SUBSTITUTION|ENGINEERING|ADMINISTRATIVE|PPE" }
                  ],
                  "remediationPlan": "Plan structuré en étapes numérotées (Étape 1: ... Étape 2: ...)"
                }
                """
                : """
                You are an HSE (Health, Safety, Environment) expert with 20 years of experience
                in the West African mining industry. You know perfectly:
                - ISO 45001:2018, ISO 31000:2018, ISO 14001:2015
                - Mining codes of West African countries

                Your mission: RIGOROUSLY analyze the provided image to identify any HSE situation.
                Be HONEST about your confidence. Never invent details.

                Respond ONLY in valid JSON matching the schema above (in English).
                """;
    }

    public String buildUserPrompt(AIAnalysisRequest req) {
        StringBuilder sb = new StringBuilder();
        sb.append("Analyse cette image et identifie toute situation HSE.\n\n");

        if (req.getMineContext() != null && !req.getMineContext().isBlank()) {
            sb.append("Site : ").append(req.getMineContext()).append("\n");
        }
        if (req.getDepartmentContext() != null && !req.getDepartmentContext().isBlank()) {
            sb.append("Département / zone : ").append(req.getDepartmentContext()).append("\n");
        }
        if (req.getUserContext() != null && !req.getUserContext().isBlank()) {
            sb.append("Contexte du déclarant : ").append(req.getUserContext()).append("\n");
        }

        sb.append("\nRéponds en JSON strict selon le schéma défini.");
        return sb.toString();
    }
}
