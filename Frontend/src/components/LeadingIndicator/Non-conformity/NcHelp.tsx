import HelpPanel, { type HelpItem } from '../../UtilityComp/HelpPanel';
import {
  IconHash, IconAlertTriangle, IconFileText, IconCalendar, IconClock,
  IconUser, IconCategory, IconMapPin, IconActivity, IconUsers, IconTarget,
  IconChartDots3, IconChartBar, IconShield, IconTool, IconScale,
  IconCircleCheck, IconArchive, IconCertificate, IconBulb,
} from '@tabler/icons-react';

/**
 * NcHelp — volet d'aide pour le formulaire de déclaration de constat central
 * (non-conformité / quasi-accident).
 *
 * Refonte pro : utilise le composant HelpPanel générique avec accordions sobres
 * et références ISO 45001 / ISO 9001 / ISO 31000.
 */

interface NcHelpProps {
  activeStep: number;
  onClose?: () => void;
}

const stepConfig: Record<number, { title: string; subtitle: string; items: HelpItem[]; tip?: string }> = {
  0: {
    title: "Aide : Déclaration",
    subtitle: "Renseignement initial de la non-conformité ou du quasi-accident",
    items: [
      {
        key: 'number', icon: IconHash, iconColor: 'slate',
        title: "Numéro de référence",
        content: "Identifiant unique généré automatiquement à la soumission (NC-AAAA-NNNN pour non-conformité, NM-AAAA-NNNN pour quasi-accident).",
      },
      {
        key: 'type', icon: IconAlertTriangle, iconColor: 'red',
        title: "Type d'événement",
        content: "Non-conformité = écart constaté par rapport à une exigence (norme, procédure, légale). Quasi-accident = incident potentiel évité de peu, sans dommage.",
        isoRef: 'ISO 45001 §3.35',
      },
      {
        key: 'title', icon: IconFileText, iconColor: 'teal',
        title: "Titre",
        content: "Intitulé court et factuel. Exemple : « Déversement de produit chimique en zone de stockage » ou « Chute de plain-pied évitée — atelier 3 ».",
      },
      {
        key: 'date', icon: IconCalendar, iconColor: 'orange',
        title: "Date de l'événement",
        content: "Date à laquelle l'événement s'est réellement produit (ou a été constaté pour la première fois).",
      },
      {
        key: 'detection', icon: IconClock, iconColor: 'indigo',
        title: "Date de détection",
        content: "Date à laquelle l'événement a été détecté, signalé ou rapporté à la hiérarchie. Peut être postérieure à la date de survenance.",
      },
      {
        key: 'reportedBy', icon: IconUser, iconColor: 'teal',
        title: "Déclarant",
        content: "Personne qui rapporte l'événement. Par défaut : utilisateur connecté. Modifiable si la déclaration est faite pour le compte d'un tiers.",
        isoRef: 'ISO 45001 §10.2.1.b',
      },
      {
        key: 'category', icon: IconCategory, iconColor: 'red',
        title: "Catégorie",
        content: "Classification principale : Sécurité (accident, blessure), Environnement (rejet, pollution), Qualité (défaut produit), Sûreté (intrusion, vol).",
      },
      {
        key: 'location', icon: IconMapPin, iconColor: 'pink',
        title: "Lieu",
        content: "Localisation physique précise : site, zone, atelier, équipement. Plus le détail est précis, meilleure sera l'analyse.",
      },
      {
        key: 'process', icon: IconActivity, iconColor: 'green',
        title: "Processus de travail",
        content: "Activité en cours au moment de l'événement (soudage, forage, transport de matières dangereuses, manutention...).",
      },
      {
        key: 'description', icon: IconFileText, iconColor: 'yellow',
        title: "Description",
        content: "Récit chronologique et factuel : qui, quoi, où, quand, comment. Éviter les interprétations ou jugements à ce stade.",
      },
    ],
    tip: "Soyez factuel et précis. Joignez des photos et schémas pour faciliter l'analyse en aval.",
  },
  1: {
    title: "Aide : Analyse causale",
    subtitle: "Comprendre les causes profondes pour prévenir la récurrence",
    items: [
      {
        key: 'team', icon: IconUsers, iconColor: 'teal',
        title: "Équipe d'analyse",
        content: "Sélectionner les personnes participant à l'analyse causale : pilote d'analyse, expert technique, témoins, représentant CHSCT.",
      },
      {
        key: 'method', icon: IconChartDots3, iconColor: 'indigo',
        title: "Méthode ICAM",
        content: "Incident Cause Analysis Method — examen systématique des facteurs organisationnels, individuels et techniques. Alternative : 5 Pourquoi, Ishikawa, arbre des causes.",
        isoRef: 'ISO 45001 §10.2.1.c',
      },
      {
        key: 'individual', icon: IconUser, iconColor: 'orange',
        title: "Facteurs individuels",
        content: "Comportement, formation, expérience, fatigue, état de santé, motivation. Sans recherche de coupable.",
      },
      {
        key: 'technical', icon: IconTool, iconColor: 'blue',
        title: "Facteurs techniques",
        content: "État de l'équipement, conception, ergonomie, EPI, signalisation, conditions environnementales (météo, éclairage, bruit).",
      },
      {
        key: 'organizational', icon: IconCertificate, iconColor: 'violet',
        title: "Facteurs organisationnels",
        content: "Procédures, ressources, planning, charge de travail, supervision, culture sécurité, communication, formation.",
      },
      {
        key: 'rootCauses', icon: IconTarget, iconColor: 'red',
        title: "Causes profondes",
        content: "Causes systémiques sous-jacentes identifiées au-delà des symptômes immédiats. Doivent être actionnables (modifiables).",
        isoRef: 'ISO 9001 §10.2.1.b',
      },
      {
        key: 'priority', icon: IconChartBar, iconColor: 'amber',
        title: "Priorité et gravité",
        content: "Probabilité × Gravité = niveau de risque. Détermine la priorité de traitement (Faible / Modérée / Élevée / Critique).",
        isoRef: 'ISO 31000',
      },
    ],
    tip: "Concentrez-vous sur les faits, pas sur les personnes. Cherchez les causes systémiques modifiables.",
  },
  2: {
    title: "Aide : Traitement",
    subtitle: "Actions correctives — éliminer la cause profonde",
    items: [
      {
        key: 'corrective', icon: IconShield, iconColor: 'green',
        title: "Actions correctives",
        content: "Actions qui éliminent les causes profondes identifiées. Hiérarchie ISO 45001 §8.1.2 : Élimination > Substitution > Ingénierie > Administratif > EPI.",
        isoRef: 'ISO 45001 §10.2.1.d',
      },
      {
        key: 'preventive', icon: IconCircleCheck, iconColor: 'teal',
        title: "Actions préventives",
        content: "Mesures complémentaires pour éviter qu'un événement similaire ne se reproduise ailleurs dans l'organisation.",
      },
      {
        key: 'responsible', icon: IconUser, iconColor: 'indigo',
        title: "Responsable",
        content: "Personne nominativement accountable de la mise en œuvre. Une seule personne par action — éviter la responsabilité partagée.",
      },
      {
        key: 'deadline', icon: IconCalendar, iconColor: 'orange',
        title: "Échéance",
        content: "Date réaliste basée sur la complexité de l'action et la criticité du risque. Pas plus de 90 jours en standard.",
      },
      {
        key: 'status', icon: IconChartBar, iconColor: 'blue',
        title: "Statut",
        content: "Non commencé / En cours / Terminé / En attente. Mise à jour régulière par le responsable jusqu'à clôture.",
      },
      {
        key: 'effectiveness', icon: IconScale, iconColor: 'violet',
        title: "Vérification d'efficacité",
        content: "Comment et quand vérifier que l'action a effectivement supprimé la cause. À planifier dès la création de l'action.",
        isoRef: 'ISO 45001 §10.2.1.f',
      },
    ],
    tip: "Privilégier les actions qui éliminent la cause à la source plutôt que celles qui ajoutent une protection.",
  },
  3: {
    title: "Aide : Clôture & Diffusion",
    subtitle: "Validation, partage des leçons et archivage",
    items: [
      {
        key: 'closure', icon: IconArchive, iconColor: 'teal',
        title: "Clôture finale",
        content: "Date de clôture et statut final (Clôturée / Annulée / Transférée). Toutes les actions doivent être terminées et vérifiées.",
      },
      {
        key: 'effectiveness', icon: IconScale, iconColor: 'green',
        title: "Efficacité du traitement",
        content: "Évaluation : Excellente / Bonne / Acceptable / Faible. Basée sur la disparition de la cause et l'absence de récurrence.",
      },
      {
        key: 'risk', icon: IconAlertTriangle, iconColor: 'orange',
        title: "Risque résiduel de récurrence",
        content: "Évaluation du risque qu'un événement similaire se reproduise après mise en œuvre des actions. Doit être ALARP.",
        isoRef: 'ISO 31000',
      },
      {
        key: 'lessons', icon: IconBulb, iconColor: 'yellow',
        title: "Leçons apprises",
        content: "Synthèse des enseignements à partager : ce qui a fonctionné, ce qui pourrait être amélioré, recommandations pour d'autres sites/équipes.",
      },
      {
        key: 'sharing', icon: IconUsers, iconColor: 'blue',
        title: "Plan de diffusion",
        content: "Comment et à qui diffuser les leçons : causerie sécurité, flash sécurité, mise à jour de procédure, formation, intranet.",
        isoRef: 'ISO 45001 §7.4',
      },
      {
        key: 'validator', icon: IconCertificate, iconColor: 'violet',
        title: "Validation",
        content: "Personne (généralement responsable HSE ou direction) qui valide formellement la clôture et la conformité du traitement.",
      },
      {
        key: 'nextCheck', icon: IconCircleCheck, iconColor: 'cyan',
        title: "Prochaine vérification",
        content: "Date à laquelle l'efficacité sera réévaluée (typiquement 3, 6 ou 12 mois après clôture). Permet de détecter les récurrences tardives.",
      },
    ],
    tip: "Documentez clairement les leçons apprises — elles alimentent l'amélioration continue de tout le système HSE.",
  },
};

const NcHelp = ({ activeStep, onClose }: NcHelpProps) => {
  const config = stepConfig[activeStep] ?? stepConfig[0];

  // Couleur d'accent par étape (rouge=déclaration, jaune=analyse, orange=traitement, vert=clôture)
  const accentColors: Record<number, 'red' | 'yellow' | 'orange' | 'green'> = {
    0: 'red',
    1: 'yellow',
    2: 'orange',
    3: 'green',
  };

  return (
    <HelpPanel
      title={config.title}
      subtitle={config.subtitle}
      items={config.items}
      tip={config.tip}
      accentColor={accentColors[activeStep] ?? 'red'}
      onClose={onClose}
    />
  );
};

export default NcHelp;
