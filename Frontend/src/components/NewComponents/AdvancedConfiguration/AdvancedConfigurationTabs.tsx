/**
 * AdvancedConfigurationTabs — coquille de l'écran de configuration.
 *
 * Il ne reste QU'UN SEUL onglet, donc plus de `Tabs` : on rend directement les
 * préférences de notification (qui portent leur propre en-tête et breadcrumb).
 *
 * Les onglets « Paramètres globaux », « Rétention des données » et
 * « Préférences système » ont été SUPPRIMÉS : aucun ne pilotait un
 * comportement réel.
 *   - Paramètres globaux : aucun service backend ne lit un délai configurable.
 *   - Rétention des données : aucun job de purge/archivage n'existe — promettre
 *     une suppression automatique aurait été une fausse garantie de conformité.
 *   - Préférences système : la langue est déjà persistée par le sélecteur du
 *     header (i18next, clé `safex360-lang`) ; fuseau, timeout de session et
 *     taille de fichier sont de la configuration serveur, pas un réglage par
 *     mine.
 */

import NotificationTabs from './NotificationTabs';

const AdvancedConfigurationTabs = () => <NotificationTabs />;

export default AdvancedConfigurationTabs;
