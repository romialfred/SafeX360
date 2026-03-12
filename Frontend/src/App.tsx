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
import { MantineProvider } from '@mantine/core';
import { theme } from './theme';
import { Router } from './routes/Router';
import { Provider } from 'react-redux';
import store from './Store';
import { PrimeReactProvider } from "primereact/api";
import { NavigationProgress } from '@mantine/nprogress';
import { Notifications } from '@mantine/notifications';



//all three imports must be used in every file where we use any prime react component

// import 'primereact/resources/themes/lara-light-blue/theme.css';
// import 'primereact/resources/primereact.min.css';
// import 'primeicons/primeicons.css';



function App() {
  return (
    <Provider store={store}>
      <PrimeReactProvider>
        <MantineProvider theme={theme}>
          <NavigationProgress color="red" />
          <Notifications position="bottom-right" zIndex={2000} />
          <Router />
        </MantineProvider>
      </PrimeReactProvider>
    </Provider>

  )
}

export default App
