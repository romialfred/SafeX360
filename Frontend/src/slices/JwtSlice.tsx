import { createSlice } from "@reduxjs/toolkit";

const initialToken = localStorage.getItem("token") || "";

const jwtSlice = createSlice({
    name: 'jwt',
    initialState: initialToken,
    reducers: {
        setJwt: (_state, action) => {
            localStorage.setItem("token", action.payload);
            return action.payload;
        },
        removeJwt: () => {
            localStorage.removeItem("token");
            return "";
        }
    }
});

export const { setJwt, removeJwt } = jwtSlice.actions;
export default jwtSlice.reducer;