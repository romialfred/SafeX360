import { createSlice } from "@reduxjs/toolkit";

const initialToken = JSON.parse(localStorage.getItem("menu") ?? '{ "id": "dashboard", "pos": "true" }')

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
            return "";
        }
    }
});

export const { setMenu, removeMenu } = MenuSlice.actions;
export default MenuSlice.reducer;