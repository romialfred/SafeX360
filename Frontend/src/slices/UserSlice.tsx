import {  createSlice } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";
const userSlice = createSlice({
    name: 'user',
    initialState:  localStorage.getItem("token")?jwtDecode(localStorage.getItem("token")??""):{},
    reducers: {
        setUser: (state, action) => {
            state=action.payload;
            return state;
        }
    }
});
export const {  setUser } = userSlice.actions;
export default userSlice.reducer;