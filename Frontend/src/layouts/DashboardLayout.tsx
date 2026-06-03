import { Outlet } from "react-router-dom";
import Header from "../components/Dashboard/Header/Header";
import { useAppSelector } from "../slices/hooks";
import { Affix, LoadingOverlay } from "@mantine/core";
import Sidebar from "../components/NewComponents/Sidebar/Sidebar";
import FloatingAIAssistant from "../components/NewComponents/AiAssistant/FloatingAiAssistant";
import { useEffect, useMemo, useState } from "react";
import { loadModuleFlagsOnce } from "../components/NewComponents/data/ModuleConfig";
import InactivityHandler from "../components/UtilityComp/InactivityHandler";



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
    return (
        <>
            <InactivityHandler inactivityMinutes={inactivityMinutes} />
            <div className="flex  w-full">
                <Sidebar />
                <div className="flex flex-col w-full h-screen">
                    <Header />

                    <div className={`relative pt-[120px] ${overlay ? "h-screen overflow-y-hidden" : ""} `}>
                        <LoadingOverlay
                            visible={overlay || !flagsLoaded}
                            zIndex={1000}
                            overlayProps={{ radius: 'sm', blur: 2 }}
                            loaderProps={{ color: 'red', type: 'bars' }}
                        />
                        <Outlet />
                    </div>
                </div>
                <Affix position={{ bottom: 20, right: 20 }}>
                    <FloatingAIAssistant />
                </Affix>
            </div >
        </>
    )
}

export default DashboardLayout
