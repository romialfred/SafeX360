import './App.css';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/nprogress/styles.css';
import '@mantine/tiptap/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/carousel/styles.css';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { MantineProvider } from '@mantine/core';
import { theme } from './theme';
import { Router } from './routes/Router';
import { Provider } from 'react-redux';
import store from './Store';
import { PrimeReactProvider } from "primereact/api";
import { NavigationProgress } from '@mantine/nprogress';
import { Notifications } from '@mantine/notifications';
import GlobalLoadingIndicator from './components/UtilityComp/GlobalLoadingIndicator';
import { Z } from './constants/zIndex';
import { installInvalidSubmitFeedback } from './utility/invalidSubmitFeedback';
import { errorNotification } from './utility/NotificationUtility';



//all three imports must be used in every file where we use any prime react component

// import 'primereact/resources/themes/lara-light-blue/theme.css';
// import 'primereact/resources/primereact.min.css';
// import 'primeicons/primeicons.css';



/**
 * Retour visuel quand une soumission est bloquée par la validation.
 *
 * 63 formulaires appellent `form.onSubmit(handler)` sans gestionnaire d'échec :
 * l'erreur s'affiche sous le champ fautif, souvent hors écran, et le bouton
 * paraît sans effet. On branche ici, en un seul endroit, un filet qui amène le
 * champ concerné sous les yeux de l'utilisateur et l'en informe.
 * Voir src/utility/invalidSubmitFeedback.ts.
 */
function InvalidSubmitFeedback() {
  useEffect(() => installInvalidSubmitFeedback(errorNotification), []);
  return null;
}

function App() {
  return (
    <Provider store={store}>
      <PrimeReactProvider>
        <MantineProvider theme={theme}>
          <NavigationProgress color="red" />
          <Notifications position="bottom-right" zIndex={Z.toast} />
          <GlobalLoadingIndicator />
          <InvalidSubmitFeedback />
          <Router />
        </MantineProvider>
      </PrimeReactProvider>
    </Provider>

  )
}

export default App
