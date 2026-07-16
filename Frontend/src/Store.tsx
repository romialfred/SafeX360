import { configureStore } from "@reduxjs/toolkit";
import jwtReducer from "./slices/JwtSlice";
import userReducer from "./slices/UserSlice";
import profileReducer from "./slices/ProfileSlice";
import overlayReducer from "./slices/OverlaySlice";
import collapseReducer from "./slices/CollapseSlice";
import menuReducer from "./slices/MenuSlice";
import companySelectionReducer from "./slices/CompanySelectionSlice";
import mobileSidebarReducer from "./slices/MobileSidebarSlice";
import aiAssistantReducer from "./slices/AiAssistantSlice";


const store = configureStore({
    reducer: {
        aiAssistant: aiAssistantReducer,
        jwt: jwtReducer,
        user: userReducer,
        profile: profileReducer,
        overlay: overlayReducer,
        collapse: collapseReducer,
        menu: menuReducer,
        companySelection: companySelectionReducer,
        mobileSidebar: mobileSidebarReducer,
    },
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;