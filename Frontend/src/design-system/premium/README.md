# Design System Premium — SafeX 360

**Bibliothèque de composants extraits du module Non-conformité.**

## ⚠️ Règle fondamentale

> Le **module Non-conformité** (`src/components/LeadingIndicator/Non-conformity/*`)
> est la **SOURCE DE VÉRITÉ** intouchable. Les patterns sont **extraits** ici
> pour être réutilisés dans les autres modules **sans modifier** Non-conformité.

## Composants livrés

| Composant | Inspiré de | Usage |
|---|---|---|
| `PremiumPageHeader` | NonConformityForm.tsx ligne 406 | Header avec breadcrumbs + badge + actions |
| `PremiumKpiTile` | NonConformityDashboard.tsx ligne 210 | Tile KPI gradient + icône |
| `PremiumSegmentedFilter` | (existant `SegmentedFilter`) | Filtre onglets sémantiques |
| `PremiumStatusBadge` | NonConformityDashboard.tsx ligne 295 | Badge statut/severity coloré |
| `PremiumFormSection` | DeclarationStep.tsx | Section formulaire avec label uppercase |
| `PremiumStepper` | NonConformityForm.tsx ligne 454 | Stepper sobre avec icônes |
| `PremiumHelpPanel` | NonConformityForm.tsx ligne 488 | Volet d'aide collapsible |
| `PremiumDualViewToggle` | NonConformityDashboard.tsx | Toggle cards/table |
| `PremiumActionMenu` | NonConformityDashboard.tsx ligne 307 | Menu actions avec tooltip |

## Tokens

Les couleurs sémantiques (severity, priority, status) sont exportés dans
`tokens.ts` pour cohérence inter-modules.

## Workflow d'usage par module

```tsx
// Ancien (à refactorer module par module)
import PageHeader from '../UtilityComp/PageHeader';
import StatCard from '../UtilityComp/StatCard';

// Nouveau (Refonte ISO)
import {
  PremiumPageHeader,
  PremiumKpiTile,
  PremiumStatusBadge,
  PremiumFormSection,
} from '@/design-system/premium';
```

**Important** : les nouveaux composants **n'ont pas vocation à remplacer**
ceux de Non-conformité. Ils s'utilisent dans les modules refondus
(Audits, Incidents, Investigations, etc.).
