import { createSlice } from "@reduxjs/toolkit";

const collapseSlice = createSlice({
    name: 'collapse',
    initialState: localStorage.getItem('collapse') == 'true' ? true : false,
    reducers: {
        collapse: (state) => {
            localStorage.setItem('collapse', 'true');
            state = true;
            return state;
        },
        expand: (state) => {
            state = false;
            localStorage.setItem('collapse', 'false');
            return state;
        }
    }
});
export const { collapse, expand } = collapseSlice.actions;
export default collapseSlice.reducer;