import { PageLoader } from '../components/UtilityComp/SandglassLoader';
import { JSX, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { isModuleEnabled, loadModuleFlagsOnce } from '../components/NewComponents/data/ModuleConfig';

interface ModuleGuardProps {
  moduleId: string;
  children: JSX.Element;
}

export default function ModuleGuard({ moduleId, children }: ModuleGuardProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadModuleFlagsOnce().finally(() => {
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
    return (
      <PageLoader minHeight="60vh" delay={150} />
    );
  }

  if (!isModuleEnabled(moduleId)) {
    return <Navigate to="/module-not-found" />;
  }

  return children;
}
