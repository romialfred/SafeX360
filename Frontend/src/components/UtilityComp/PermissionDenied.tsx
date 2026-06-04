import { Button } from '@mantine/core';
import { IconLock, IconArrowLeft, IconHome } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

/**
 * Écran "Accès restreint" — affiché lorsqu'un utilisateur tente d'accéder
 * à un module pour lequel il n'a pas les permissions requises.
 *
 * Pattern visuel cohérent avec la nouvelle identité Mirka :
 * fond cream, carte blanche, serif sur le titre, peu de gras.
 */
interface PermissionDeniedProps {
    moduleLabel?: string;
    message?: string;
}

export default function PermissionDenied({
    moduleLabel = 'ce module',
    message,
}: PermissionDeniedProps) {
    const navigate = useNavigate();

    return (
        <div className="p-5 max-w-2xl mx-auto mt-12 sm:mt-20">
            <div className="bg-white border border-amber-200/70 rounded-xl p-10 text-center shadow-sm">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 border border-amber-200 mb-5">
                    <IconLock size={26} className="text-amber-600" stroke={1.75} />
                </div>

                <h1 className="text-2xl text-slate-900 mb-2 tracking-tight">
                    Accès restreint
                </h1>

                <p className="text-sm text-slate-600 leading-relaxed mb-6 max-w-md mx-auto">
                    {message ?? (
                        <>
                            Votre compte ne dispose pas des permissions requises pour accéder à{' '}
                            <span className="text-slate-800">« {moduleLabel} »</span>.
                            <br />
                            Cette section est réservée aux administrateurs disposant des droits sur la gestion des utilisateurs et des rôles.
                        </>
                    )}
                </p>

                <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-100">
                    <Button
                        variant="default"
                        size="sm"
                        leftSection={<IconArrowLeft size={14} />}
                        onClick={() => navigate(-1)}
                    >
                        Retour
                    </Button>
                    <Button
                        color="teal"
                        size="sm"
                        leftSection={<IconHome size={14} />}
                        onClick={() => navigate('/')}
                    >
                        Accueil
                    </Button>
                </div>

                <p className="text-xs text-slate-400 mt-6">
                    Pour explorer cette fonctionnalité, veuillez contacter votre administrateur SafeX 360.
                </p>
            </div>
        </div>
    );
}
