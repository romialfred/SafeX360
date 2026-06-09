import HomeTabs from "../../components/NewComponents/Home/HomeTabs";

/**
 * HomePage — Page d'accueil de la plateforme SafeX 360.
 *
 * Refonte ISO Phase 1 : remplace la grille plate de 21 modules par un
 * système de 6 onglets thématiques (Pilotage / Sécurité / Santé /
 * Environnement / Système ISO / Administration). Le composant Home.tsx
 * original reste disponible (ses moduleGroups sont réutilisés par
 * HomeTabs via export). Aucune régression : tous les liens vers les
 * modules existants continuent de fonctionner.
 */
const HomePage = () => {
    return (
        <div className="p-5">
            <HomeTabs />
        </div>
    );
};

export default HomePage;