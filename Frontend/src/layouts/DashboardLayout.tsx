import { Outlet, useNavigate } from "react-router-dom";
import Header from "../components/Dashboard/Header/Header";
import { useAppSelector, useAppDispatch } from "../slices/hooks";
import { setupResponseInterceptor } from "../interceptors/AxiosInterceptor";
import { Affix, LoadingOverlay } from "@mantine/core";
import Sidebar from "../components/NewComponents/Sidebar/Sidebar";
import FloatingAIAssistant from "../components/NewComponents/AiAssistant/FloatingAiAssistant";
import AppFooter from "../components/UtilityComp/AppFooter";
import { useEffect, useMemo, useRef, useState } from "react";
import { loadModuleFlagsOnce } from "../components/NewComponents/data/ModuleConfig";
import InactivityHandler from "../components/UtilityComp/InactivityHandler";
import { EmergencyWebSocketProvider } from "../components/EmergencyManagement/Sos/EmergencyWebSocketProvider";
import CoordinatorAlertListener from "../components/EmergencyManagement/Sos/CoordinatorAlertListener";
import GeneralAlertListener from "../components/EmergencyManagement/GeneralAlert/GeneralAlertListener";
import BlastPopupListener from "../components/Blast/BlastPopupListener";
import { installAutoReplay } from "../utility/OfflineSosQueue";
import { installAutoReplayCheckIns } from "../utility/OfflineCheckInQueue";
import { createSosAlert } from "../services/SosService";
import { checkInToAlert } from "../services/GeneralAlertService";
import { successNotification } from "../utility/NotificationUtility";
import DosimetryAlertsBanner from "../components/Dosimetry/DosimetryAlertsBanner";
import MobileRedirectGuard from "../m/components/MobileRedirectGuard";
import { Z } from "../constants/zIndex";

/**
 * DashboardLayout — Coque générale post-login.
 *
 * LOT 41 :
 *   - Footer pleine largeur ajouté (AppFooter)
 *   - Marges du contenu réduites (px-4 → px-6) avec breakpoints
 *   - Conteneur d'app passé en flex column pour le footer collant
 */
const DashboardLayout = () => {
    const overlay = useAppSelector((state) => state.overlay);
    const selectedCompanyId = useAppSelector((s) => s.companySelection?.selectedCompanyId ?? null);
    const [flagsLoaded, setFlagsLoaded] = useState(false);
    const [switching, setSwitching] = useState(false);
    const prevCompanyRef = useRef(selectedCompanyId);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    // Gestion globale des sessions expirées : sans cet enregistrement, un 401
    // sur un appel applicatif laissait l'utilisateur sur un dashboard cassé
    // sans aucune notification ni redirection vers /login.
    useEffect(() => {
        setupResponseInterceptor(navigate, dispatch);
    }, [navigate, dispatch]);

    useEffect(() => {
        if (prevCompanyRef.current !== selectedCompanyId) {
            prevCompanyRef.current = selectedCompanyId;
            setSwitching(true);
            const id = window.setTimeout(() => setSwitching(false), 600);
            return () => window.clearTimeout(id);
        }
    }, [selectedCompanyId]);
    const inactivityMinutes = useMemo(() => {
        const inactivityEnv = import.meta.env.VITE_INACTIVITY_TIMEOUT_MINUTES as string | undefined;
        const parsedInactivity = Number(inactivityEnv);
        return Number.isFinite(parsedInactivity) && parsedInactivity > 0 ? parsedInactivity : undefined;
    }, []);

    useEffect(() => {
        let mounted = true;
        loadModuleFlagsOnce().finally(() => {
            if (mounted) setFlagsLoaded(true);
        });
        return () => { mounted = false; };
    }, []);

    // LOT 48 Phase 3.c — Auto-replay IndexedDB des SOS hors-ligne
    useEffect(() => {
        const cleanup = installAutoReplay(
            (payload, actorId) => createSosAlert(payload, actorId),
            (result) => {
                if (result.succeeded > 0) {
                    successNotification(
                        `${result.succeeded} alerte(s) SOS hors-ligne re-transmise(s) avec succès.`
                    );
                }
            }
        );
        return cleanup;
    }, []);

    // LOT 48 Phase 6 — Auto-replay des check-in d'évacuation hors-ligne
    useEffect(() => {
        const cleanup = installAutoReplayCheckIns(
            (entry) => checkInToAlert({
                alertId: entry.alertId,
                employeeId: entry.employeeId,
                assemblyPointId: entry.assemblyPointId,
                status: entry.status,
                latitude: entry.latitude,
                longitude: entry.longitude,
                gpsAccuracy: entry.gpsAccuracy,
                note: entry.note,
                actorId: entry.actorId,
            }),
            (result) => {
                if (result.succeeded > 0) {
                    successNotification(
                        `${result.succeeded} check-in(s) d'évacuation hors-ligne re-transmis avec succès.`
                    );
                }
            }
        );
        return cleanup;
    }, []);

    return (
        <EmergencyWebSocketProvider>
            {/* LOT mobile Phase M1 — redirection auto vers /m/home si l'utilisateur
                est detecte sur mobile (Capacitor APK ou UA mobile). N'affecte pas
                les desktops. Render: null (effet de bord uniquement). */}
            <MobileRedirectGuard />
            <InactivityHandler inactivityMinutes={inactivityMinutes} />
            {/* A11y — Skip-to-content : visible uniquement au focus clavier */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-teal-600 focus:text-white focus:rounded-md focus:text-sm focus:font-medium focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-300"
            >
                Aller au contenu principal
            </a>
            <div className="flex w-full">
                <Sidebar />
                <div className="flex flex-col min-h-screen w-full">
                    <Header />

                    {/* Contenu principal — pt aligné sur la hauteur du header :
                        mobile (< sm) : 64px ligne 1 + 56px ligne 2 = 120px
                        desktop (sm+) : 92px ligne 1 + 56px ligne 2 = 148px
                        LOT 48 P6.j — Responsive padding-top */}
                    <main
                        id="main-content"
                        tabIndex={-1}
                        className={`relative flex-1 pt-[120px] sm:pt-[148px] ${overlay ? "overflow-y-hidden" : ""}`}
                    >
                        <LoadingOverlay
                            visible={overlay || !flagsLoaded || switching}
                            zIndex={Z.overlay}
                            overlayProps={{ radius: 'sm', blur: 2 }}
                            loaderProps={{ color: 'teal', type: 'bars' }}
                        />
                        {/* LOT Dosimetrie Phase 5 — Bandeau global d'alertes critiques.
                            Auto-masque hors routes /dosimetry/* et sur /dosimetry/alerts. */}
                        <DosimetryAlertsBanner />
                        <Outlet />
                    </main>

                    {/* LOT 41 — Footer institutionnel pleine largeur */}
                    <AppFooter />
                </div>
                <Affix position={{ bottom: 80, right: 20 }}>
                    <FloatingAIAssistant />
                </Affix>
            </div>
            {/* LOT 48 Phase 3.b — Popup global gyrophare pour coordinateurs */}
            <CoordinatorAlertListener />
            {/* LOT 48 Phase 4 — Popup global Alerte Générale pour tous */}
            <GeneralAlertListener />
            {/* LOT Blast P4 — Popup d'avertissement de tir imminent (T-2h -> T-0) */}
            <BlastPopupListener />
        </EmergencyWebSocketProvider>
    );
};

export default DashboardLayout;
