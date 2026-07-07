import { createSlice } from "@reduxjs/toolkit";

const DEFAULT_MENU = { id: "dashboard", pos: "true" };

// Un JSON corrompu dans localStorage ne doit jamais empêcher le store de se
// créer (écran blanc sans recours) — repli silencieux sur le menu par défaut.
let initialToken: { id: string; pos: string };
try {
    const parsed = JSON.parse(localStorage.getItem("menu") ?? "null");
    initialToken = parsed && typeof parsed === "object" && parsed.id ? parsed : DEFAULT_MENU;
} catch {
    initialToken = DEFAULT_MENU;
}

const MenuSlice = createSlice({
    name: 'menu',
    initialState: initialToken,
    reducers: {
        setMenu: (_state, action) => {
            localStorage.setItem("menu", JSON.stringify(action.payload));
            return action.payload;
        },
        removeMenu: () => {
            localStorage.removeItem("menu");
            return DEFAULT_MENU;
        }
    }
});

export const { setMenu, removeMenu } = MenuSlice.actions;
export default MenuSlice.reducer;