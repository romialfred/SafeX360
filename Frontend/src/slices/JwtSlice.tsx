import { createSlice } from "@reduxjs/toolkit";

const jwtSlice = createSlice({
    name: 'jwt',
    initialState: "",
    reducers: {
        setJwt: (_state, action) => {
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
