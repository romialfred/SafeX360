import { Navigate } from 'react-router-dom';

/**
 * TechnicalDocumentation — redirection vers le Centre d'aide.
 *
 * Refonte 2026-06 : l'ancienne « Documentation technique » exposait du contenu
 * interne réservé aux développeurs (architecture microservices, endpoints API,
 * schéma de base de données, secrets de passerelle). Ce contenu est inapproprié
 * pour un centre d'aide client-facing d'une plateforme HSE et a été retiré.
 *
 * La route /technical-docs (toujours référencée par le pied de page et la
 * navigation de la documentation) redirige désormais vers le Centre d'aide,
 * où l'utilisateur trouve les guides, l'aperçu des fonctionnalités et les
 * ressources de support.
 */
const TechnicalDocumentation = () => <Navigate to="/how-to" replace />;

export default TechnicalDocumentation;
