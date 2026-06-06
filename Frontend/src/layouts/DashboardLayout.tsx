import { Outlet } from "react-router-dom";
import Header from "../components/Dashboard/Header/Header";
import { useAppSelector } from "../slices/hooks";
import { Affix, LoadingOverlay } from "@mantine/core";
import Sidebar from "../components/NewComponents/Sidebar/Sidebar";
import FloatingAIAssistant from "../components/NewComponents/AiAssistant/FloatingAiAssistant";
import AppFooter from "../components/UtilityComp/AppFooter";
import { useEffect, useMemo, useState } from "react";
import { loadModuleFlagsOnce } from "../components/NewComponents/data/ModuleConfig";
import InactivityHandler from "../components/UtilityComp/InactivityHandler";
import { EmergencyWebSocketProvider } from "../components/EmergencyManagement/Sos/EmergencyWebSocketProvider";
import CoordinatorAlertListener from "../components/EmergencyManagement/Sos/CoordinatorAlertListener";
import GeneralAlertListener from "../components/EmergencyManagement/GeneralAlert/GeneralAlertListener";
import { installAutoReplay } from "../utility/OfflineSosQueue";
import { installAutoReplayCheckIns } from "../utility/OfflineCheckInQueue";
import { createSosAlert } from "../services/SosService";
import { checkInToAlert } from "../services/GeneralAlertService";
import { successNotification } from "../utility/NotificationUtility";

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
    const [flagsLoaded, setFlagsLoaded] = useState(false);
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
            <InactivityHandler inactivityMinutes={inactivityMinutes} />
            <div className="flex w-full">
                <Sidebar />
                <div className="flex flex-col min-h-screen w-full">
                    <Header />

                    {/* Contenu principal — pt aligné sur la hauteur exacte du header (72px ligne 1 + 56px ligne 2) */}
                    <main
                        className={`relative flex-1 pt-[128px] ${overlay ? "overflow-y-hidden" : ""}`}
                    >
                        <LoadingOverlay
                            visible={overlay || !flagsLoaded}
                            zIndex={1000}
                            overlayProps={{ radius: 'sm', blur: 2 }}
                            loaderProps={{ color: 'red', type: 'bars' }}
                        />
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
        </EmergencyWebSocketProvider>
    );
};

export default DashboardLayout;
