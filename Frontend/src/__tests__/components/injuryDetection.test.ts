import { describe, expect, it } from 'vitest';
import { categorieConcernePersonne, mentionneBlessure, suggereBlessure } from '../../components/LaggingIndicator/IncidentManagement/injuryDetection';

/**
 * La saisie des parties du corps ne doit plus dépendre d'un libellé de type
 * contenant littéralement « blessure » : un référentiel qui nomme ses types
 * autrement fermait la saisie, et une description explicite ne l'ouvrait pas.
 */
describe('détection d’une atteinte corporelle', () => {
    it('reconnaît les libellés de type usuels', () => {
        ['Accident avec blessure', 'Premiers soins', 'First aid', 'Injury', 'Soins médicaux',
            'Accident corporel', 'LTI', 'Blessé léger', 'Arrêt de travail'].forEach((libelle) => {
            expect(mentionneBlessure(libelle), libelle).toBe(true);
        });
    });

    it('reconnaît une blessure décrite dans un texte libre, accents ou non', () => {
        expect(mentionneBlessure('L’opérateur s’est coupé la main sur la tôle.')).toBe(true);
        expect(mentionneBlessure('fracture du poignet gauche')).toBe(true);
        expect(mentionneBlessure('Brulure au bras droit')).toBe(true);
        expect(mentionneBlessure('Le technicien a été blesse à la jambe')).toBe(true);
    });

    it('lit à travers le balisage de l’éditeur riche', () => {
        expect(mentionneBlessure('<p>Chute avec <strong>plaie</strong> ouverte</p>')).toBe(true);
        expect(mentionneBlessure('<p>Aucun dommage</p>')).toBe(false);
    });

    it('ne se déclenche pas sur un mot qui contient seulement le motif', () => {
        // « lti » est un radical court : sans borne de mot il s'allumerait partout.
        expect(mentionneBlessure('Analyse multiple des ultimes contrôles')).toBe(false);
        expect(mentionneBlessure('Déversement de 20 litres d’huile, aucun contact')).toBe(false);
        expect(mentionneBlessure('')).toBe(false);
        expect(mentionneBlessure(null)).toBe(false);
    });

    it('propose « oui » dès qu’un des trois indices est présent', () => {
        expect(suggereBlessure({ typeLabel: 'Accident corporel' })).toBe(true);
        expect(suggereBlessure({ categorieLabel: 'Santé et sécurité — blessure' })).toBe(true);
        expect(suggereBlessure({ typeLabel: 'Événement', textes: ['Le chauffeur a une entorse.'] })).toBe(true);
        // Des parties du corps déjà saisies valent réponse « oui » : à l'ouverture
        // d'un dossier existant, la section ne doit pas se refermer sur les données.
        expect(suggereBlessure({ typeLabel: 'Événement', partiesDejaSaisies: ['3'] })).toBe(true);
    });

    it('ne pose la question que pour une catégorie qui concerne une personne', () => {
        expect(categorieConcernePersonne('Santé et sécurité')).toBe(true);
        expect(categorieConcernePersonne('SANTE ET SECURITE')).toBe(true);
        expect(categorieConcernePersonne('Health and safety')).toBe(true);
        // Les huit autres catégories du référentiel : aucune partie du corps à saisir.
        ['Environnement', 'Dommage matériel', 'Incendie et explosion', 'Communauté',
            'Dynamitage', 'Sûreté', 'Transport', 'Processus opérationnel'].forEach((cat) => {
            expect(categorieConcernePersonne(cat), cat).toBe(false);
        });
        // Sans catégorie choisie, on ne demande rien.
        expect(categorieConcernePersonne('')).toBe(false);
        expect(categorieConcernePersonne(undefined)).toBe(false);
    });

    it('ne propose rien sans indice', () => {
        expect(suggereBlessure({ typeLabel: 'Dégât matériel', categorieLabel: 'Équipement', textes: ['Pare-brise fissuré, aucun contact avec une personne.'] })).toBe(false);
        expect(suggereBlessure({})).toBe(false);
    });
});
