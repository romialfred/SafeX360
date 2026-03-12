import { configureStore } from "@reduxjs/toolkit";
import jwtReducer from "./slices/JwtSlice";
import userReducer from "./slices/UserSlice";
import profileReducer from "./slices/ProfileSlice";
import overlayReducer from "./slices/OverlaySlice";
import collapseReducer from "./slices/CollapseSlice";
import menuReducer from "./slices/MenuSlice";
import companySelectionReducer from "./slices/CompanySelectionSlice";


const store = configureStore({
    reducer: {
        jwt: jwtReducer,
        user: userReducer,
        profile: profileReducer,
        overlay: overlayReducer,
        collapse: collapseReducer,
        menu: menuReducer,
        companySelection: companySelectionReducer
    },
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;