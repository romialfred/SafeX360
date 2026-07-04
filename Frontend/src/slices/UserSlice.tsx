import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
    name: 'user',
    initialState: {} as Record<string, unknown>,
    reducers: {
        setUser: (_state, action) => {
            return action.payload;
        }
    }
});
export const { setUser } = userSlice.actions;
export default userSlice.reducer;
