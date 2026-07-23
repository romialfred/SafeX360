import { Navigate, useParams } from 'react-router-dom';

/**
 * Redirection des anciens chemins de gestion d'utilisateur vers la fiche unique.
 *
 * Les liens `/users-management/edit/:id` et
 * `/users-management/usersManagement-details/:id` ouvraient encore les écrans
 * hérités — c'est exactement ce que voyait un administrateur qui cliquait sur
 * « Modifier » : l'ancienne page, alors que la liste et la création avaient déjà
 * été refaites. Plutôt que de laisser deux écrans concurrents pour un même
 * compte (ils divergeront), les anciens chemins amènent au bon onglet de la
 * fiche. Les favoris et les liens déjà partagés continuent donc de fonctionner.
 */
export default function LegacyUserRedirect({ tab }: { tab: 'profile' | 'rights' }) {
    const { id } = useParams();
    if (!id) {
        return <Navigate to="/users-admin" replace />;
    }
    return <Navigate to={`/users-admin/${id}?tab=${tab}`} replace />;
}
