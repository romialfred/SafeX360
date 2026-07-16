package com.minexpert.hns.seed;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.minexpert.hns.entity.inspections.InspectionCheckpoint;
import com.minexpert.hns.entity.inspections.InspectionTemplate;
import com.minexpert.hns.enums.CheckpointResponseType;
import com.minexpert.hns.enums.InspectionTemplateType;
import com.minexpert.hns.repository.inspections.InspectionTemplateRepository;

import lombok.RequiredArgsConstructor;

/**
 * Seed idempotent des modèles d'inspection ABSENTS du référentiel.
 *
 * <p><b>D2 — le modèle est dérivé de la cible.</b> Les modèles applicables à un
 * équipement sont ceux dont {@code type = EQUIPMENT} et
 * {@code scopeRef = equipment.type} (clé canonique de famille, cf. D1). Or le
 * référentiel historique (seed_inspection_templates.py) ne couvrait que 5
 * familles — HEAVY_TRUCK, EXCAVATOR, DRILL_RIG, CONVEYOR, COMPRESSOR — alors
 * que le parc comporte aussi des chargeuses, des concasseurs et des groupes
 * électrogènes. Ces 3 familles n'avaient AUCUN modèle applicable : c'est ce qui
 * obligeait le formulaire à proposer n'importe quel modèle (on pouvait inspecter
 * une chargeuse avec la checklist d'un camion benne).</p>
 *
 * <p>Ce seeder installe les 3 modèles manquants :</p>
 * <ul>
 *   <li>{@code EQ-CHARGEUSE}            → scopeRef {@code WHEEL_LOADER}</li>
 *   <li>{@code EQ-CONCASSEUR}           → scopeRef {@code CRUSHER}</li>
 *   <li>{@code EQ-GROUPE-ELECTROGENE}   → scopeRef {@code GENSET}</li>
 * </ul>
 *
 * <p>Idempotent au grain du {@code code} (unique) : un modèle déjà présent n'est
 * jamais dupliqué ni écrasé — les modifications faites par un administrateur
 * sont donc préservées. Un code manquant est (ré)inséré au prochain démarrage.</p>
 *
 * <p>Contenu métier aligné ISO 45001 §8.1.2 (hiérarchie des moyens de maîtrise)
 * et §9.1 (surveillance et mesure), complété par les pratiques minières
 * (protections des organes en mouvement, consignation LOTO, empoussiérage).</p>
 */
@Component
@RequiredArgsConstructor
public class InspectionTemplateSeeder implements CommandLineRunner {

    private static final Logger LOG = LoggerFactory.getLogger(InspectionTemplateSeeder.class);

    /**
     * Mine propriétaire du référentiel : {@code null} = CATALOGUE GLOBAL, visible
     * de TOUTES les mines (convention déjà en vigueur sur le projet, cf.
     * {@code HsActivityRepository} / {@code EmergencyUserPermissionRepository}).
     *
     * <p>Une checklist « Camion benne » est un référentiel générique, pas une
     * donnée de mine. Le {@code code} étant unique globalement, un modèle ne peut
     * de toute façon pas être dupliqué par mine : le rattacher à la mine 1
     * (ce qu'avait fait {@code migrate_company_scoping.sql}) privait toutes les
     * AUTRES mines de modèle — donc, une fois le filtrage par {@code scopeRef}
     * en place, les empêchait purement et simplement de planifier une inspection.
     * Une mine reste libre de créer ses propres modèles avec son companyId.</p>
     */
    private static final Long REFERENTIAL_COMPANY_ID = null;

    /** Auteur technique du seed (même employé que seed_inspection_templates.py). */
    private static final Long SEED_AUTHOR_ID = 14L;

    private final InspectionTemplateRepository templateRepository;

    @Override
    public void run(String... args) {
        int inserted = 0;
        inserted += seedWheelLoader();
        inserted += seedCrusher();
        inserted += seedGenset();

        if (inserted > 0) {
            LOG.info("[InspectionTemplateSeeder] {} modèle(s) d'inspection inséré(s).", inserted);
        }
    }

    // ── EQUIPEMENT : Chargeuse sur pneus (WHEEL_LOADER) ──────────────────
    private int seedWheelLoader() {
        InspectionTemplate t = template(
                "EQ-CHARGEUSE", "Chargeuse sur pneus", "WHEEL_LOADER", 20,
                "Vérification journalière avant prise de poste. Risques dominants : "
                        + "renversement, écrasement lors de l'articulation, chute de blocs. "
                        + "ISO 45001 §8.1.4 (préparation opérationnelle).");
        if (t == null) {
            return 0;
        }
        int[] order = {0};
        cp(t, order, "État des pneus (usure, hernies, écrous de roue)",
                "Faire le tour de la machine : entailles profondes, jantes fissurées, écrous manquants.",
                CheckpointResponseType.VISUAL_GRADE, "GOOD", true);
        cp(t, order, "Godet : dents, tranchant, axes et bagues",
                "Dents manquantes ou fissurées, jeu anormal aux axes.",
                CheckpointResponseType.VISUAL_GRADE, "GOOD", true);
        cp(t, order, "Articulation centrale : jeu et barre de bridage",
                "La barre de bridage doit être rangée en position service et disponible pour la maintenance.",
                CheckpointResponseType.VISUAL_GRADE, "GOOD", true);
        cp(t, order, "Essai de freinage de service", null,
                CheckpointResponseType.BOOLEAN, "true", true);
        cp(t, order, "Frein de parc opérationnel",
                "Essai machine à l'arrêt, moteur tournant.",
                CheckpointResponseType.BOOLEAN, "true", true);
        cp(t, order, "Direction (réponse et absence de point dur)", null,
                CheckpointResponseType.VISUAL_GRADE, "GOOD", true);
        cp(t, order, "Klaxon de recul (avertisseur sonore de marche arrière)", null,
                CheckpointResponseType.BOOLEAN, "true", true);
        cp(t, order, "Avertisseur sonore avant (klaxon)", null,
                CheckpointResponseType.BOOLEAN, "true", false);
        cp(t, order, "Structure ROPS / FOPS intègre",
                "Aucune fissure, aucune soudure ou perçage non homologué sur la structure de protection.",
                CheckpointResponseType.VISUAL_GRADE, "GOOD", true);
        cp(t, order, "Fuites hydrauliques (vérins levage/cavage, flexibles)",
                "Vérins de levage et de cavage, flexibles et raccords : toute fuite = arrêt machine.",
                CheckpointResponseType.VISUAL_GRADE, "GOOD", true);
        cpNum(t, order, "Niveau hydraulique réservoir", null, 70.0, 100.0, "%", false);
        cp(t, order, "Éclairage (feux avant/arrière, gyrophare)", null,
                CheckpointResponseType.BOOLEAN, "true", false);
        cp(t, order, "Ceinture de sécurité (état et verrouillage)", null,
                CheckpointResponseType.BOOLEAN, "true", true);
        cp(t, order, "Extincteur présent et contrôlé", null,
                CheckpointResponseType.BOOLEAN, "true", true);
        cp(t, order, "Photo du godet et du train de roulement", null,
                CheckpointResponseType.PHOTO_REQUIRED, null, false);
        cp(t, order, "Observation générale conducteur", null,
                CheckpointResponseType.FREE_TEXT, null, false);
        templateRepository.save(t);
        return 1;
    }

    // ── EQUIPEMENT : Concasseur (CRUSHER) ────────────────────────────────
    private int seedCrusher() {
        InspectionTemplate t = template(
                "EQ-CONCASSEUR", "Concasseur", "CRUSHER", 30,
                "Inspection hebdomadaire de l'installation de concassage. Risques dominants : "
                        + "entraînement et écrasement aux organes en mouvement, projection lors "
                        + "du débourrage, empoussiérage siliceux, bruit. "
                        + "ISO 45001 §8.1.2 (hiérarchie des moyens de maîtrise).");
        if (t == null) {
            return 0;
        }
        int[] order = {0};
        cp(t, order, "Protections et carters des organes en mouvement en place",
                "Poulies, courroies, accouplements : aucun carter déposé ou incomplet.",
                CheckpointResponseType.VISUAL_GRADE, "GOOD", true);
        cp(t, order, "Arrêts d'urgence accessibles et testés",
                "Tester au moins un arrêt d'urgence par tronçon et vérifier l'absence de redémarrage automatique.",
                CheckpointResponseType.BOOLEAN, "true", true);
        cp(t, order, "Consignation LOTO disponible et appliquée",
                "Points de consignation identifiés, cadenas personnels et étiquettes disponibles au poste.",
                CheckpointResponseType.BOOLEAN, "true", true);
        cp(t, order, "Procédure de débourrage / déblocage des mâchoires affichée et respectée",
                "Aucune intervention dans la chambre sans consignation ni dispositif anti-chute de blocs.",
                CheckpointResponseType.BOOLEAN, "true", true);
        cp(t, order, "Plaques de mâchoires / blindages : usure et fixation", null,
                CheckpointResponseType.VISUAL_GRADE, "GOOD", true);
        cp(t, order, "Bandes transporteuses d'alimentation et de sortie",
                "État de la bande, alignement, câble d'arrêt d'urgence (tirette) sur toute la longueur.",
                CheckpointResponseType.VISUAL_GRADE, "GOOD", true);
        cp(t, order, "Carters de protection des rouleaux et tambours d'entraînement", null,
                CheckpointResponseType.BOOLEAN, "true", true);
        cp(t, order, "Garde-corps, plateformes et échelles d'accès",
                "Lisses, sous-lisses et plinthes en place ; caillebotis fixés.",
                CheckpointResponseType.VISUAL_GRADE, "GOOD", true);
        cpNum(t, order, "Empoussiérage en zone (poussières alvéolaires)",
                "Mesure au poste opérateur. Abattage par voie humide / captage en service.",
                0.0, 5.0, "mg/m3", true);
        cp(t, order, "Système d'abattage des poussières en fonctionnement",
                "Rampes d'aspersion ou captage : débit et buses non obstruées.",
                CheckpointResponseType.BOOLEAN, "true", false);
        cpNum(t, order, "Bruit ambiant au poste de conduite", null, 0.0, 85.0, "dB(A)", false);
        cp(t, order, "Vibrations anormales du châssis / des paliers", null,
                CheckpointResponseType.VISUAL_GRADE, "GOOD", false);
        cp(t, order, "Photo de la zone d'alimentation et des protections", null,
                CheckpointResponseType.PHOTO_REQUIRED, null, false);
        cp(t, order, "Mesures correctives proposées", null,
                CheckpointResponseType.FREE_TEXT, null, false);
        templateRepository.save(t);
        return 1;
    }

    // ── EQUIPEMENT : Groupe électrogène (GENSET) ─────────────────────────
    private int seedGenset() {
        InspectionTemplate t = template(
                "EQ-GROUPE-ELECTROGENE", "Groupe électrogène", "GENSET", 20,
                "Contrôle mensuel. Risques dominants : électrisation, incendie, pollution des "
                        + "sols par les hydrocarbures, intoxication aux gaz d'échappement, bruit. "
                        + "ISO 45001 §8.1.2 et §8.2 (situations d'urgence).");
        if (t == null) {
            return 0;
        }
        int[] order = {0};
        cpNum(t, order, "Mise à la terre raccordée (résistance de prise de terre)",
                "Mesure au piquet de terre. Valeur cible conforme à la note de calcul du site.",
                0.0, 10.0, "ohm", true);
        cp(t, order, "Coupure d'urgence accessible, signalée et testée",
                "Arrêt d'urgence du groupe et organe de coupure générale du tableau.",
                CheckpointResponseType.BOOLEAN, "true", true);
        cp(t, order, "Protection différentielle / disjoncteur général contrôlé", null,
                CheckpointResponseType.BOOLEAN, "true", true);
        cp(t, order, "Rétention hydrocarbures étanche et non saturée",
                "Bac de rétention du réservoir : volume conforme, absence de fissure, purge des eaux pluviales.",
                CheckpointResponseType.VISUAL_GRADE, "GOOD", true);
        cp(t, order, "Kit anti-pollution (absorbants) disponible à proximité", null,
                CheckpointResponseType.BOOLEAN, "true", false);
        cp(t, order, "Extincteur adapté (CO2 / poudre) présent et contrôlé", null,
                CheckpointResponseType.BOOLEAN, "true", true);
        cp(t, order, "Ventilation du local et échappement dirigé hors zone occupée",
                "Aucun recyclage des gaz d'échappement vers les prises d'air ou les postes de travail.",
                CheckpointResponseType.BOOLEAN, "true", true);
        cp(t, order, "Ligne d'échappement : étanchéité et calorifugeage",
                "Fuites de gaz, parties chaudes accessibles non protégées.",
                CheckpointResponseType.VISUAL_GRADE, "GOOD", false);
        cp(t, order, "Câblage et armoire électrique (isolation, presse-étoupes, IP)",
                "Aucun conducteur nu, aucune porte d'armoire ouverte ou déverrouillée.",
                CheckpointResponseType.VISUAL_GRADE, "GOOD", true);
        cp(t, order, "Protections des organes tournants (ventilateur, courroies)", null,
                CheckpointResponseType.BOOLEAN, "true", true);
        cpNum(t, order, "Niveau sonore à 1 m du capot", null, 0.0, 95.0, "dB(A)", false);
        cp(t, order, "Signalisation (danger électrique, port des EPI auditifs)", null,
                CheckpointResponseType.BOOLEAN, "true", false);
        cp(t, order, "Photo de la rétention et de l'armoire électrique", null,
                CheckpointResponseType.PHOTO_REQUIRED, null, false);
        cp(t, order, "Constat technicien", null,
                CheckpointResponseType.FREE_TEXT, null, false);
        templateRepository.save(t);
        return 1;
    }

    // ── Fabrique ─────────────────────────────────────────────────────────

    /**
     * Prépare un modèle EQUIPMENT, ou {@code null} si le code existe déjà
     * (idempotence : on ne re-crée ni n'écrase l'existant).
     */
    private InspectionTemplate template(String code, String name, String scopeRef,
                                        Integer estimatedDurationMin, String description) {
        if (templateRepository.findByCode(code).isPresent()) {
            return null;
        }
        InspectionTemplate t = new InspectionTemplate();
        t.setCode(code);
        t.setName(name);
        t.setDescription(description);
        t.setType(InspectionTemplateType.EQUIPMENT);
        t.setScopeRef(scopeRef);
        t.setEstimatedDurationMin(estimatedDurationMin);
        t.setCreatedBy(SEED_AUTHOR_ID);
        t.setCreatedAt(LocalDateTime.now());
        t.setUpdatedAt(LocalDateTime.now());
        t.setActive(Boolean.TRUE);
        t.setCompanyId(REFERENTIAL_COMPANY_ID);
        t.setCheckpoints(new ArrayList<>());
        return t;
    }

    /** Point de contrôle sans bornes numériques (BOOLEAN, VISUAL_GRADE, PHOTO, TEXTE). */
    private void cp(InspectionTemplate t, int[] order, String label, String helpText,
                    CheckpointResponseType type, String expectedValue, boolean critical) {
        add(t, order, label, helpText, type, null, null, null, expectedValue, critical);
    }

    /** Point de contrôle NUMERIC_RANGE (bornes + unité). */
    private void cpNum(InspectionTemplate t, int[] order, String label, String helpText,
                       Double minValue, Double maxValue, String unit, boolean critical) {
        add(t, order, label, helpText, CheckpointResponseType.NUMERIC_RANGE,
                minValue, maxValue, unit, null, critical);
    }

    private void add(InspectionTemplate t, int[] order, String label, String helpText,
                     CheckpointResponseType type, Double minValue, Double maxValue,
                     String unit, String expectedValue, boolean critical) {
        InspectionCheckpoint c = new InspectionCheckpoint();
        c.setTemplate(t);
        c.setLabel(label);
        c.setHelpText(helpText);
        c.setResponseType(type);
        c.setMinValue(minValue);
        c.setMaxValue(maxValue);
        c.setUnit(unit);
        c.setExpectedValue(expectedValue);
        c.setDisplayOrder(++order[0]);
        c.setCritical(critical);
        c.setRequired(Boolean.TRUE);
        List<InspectionCheckpoint> list = t.getCheckpoints();
        if (list == null) {
            list = new ArrayList<>();
            t.setCheckpoints(list);
        }
        list.add(c);
    }
}
