import { nprogress } from "@mantine/nprogress";
import { createSlice } from "@reduxjs/toolkit";

const overlaySlice = createSlice({
    name: 'overlay',
    initialState: false,
    reducers: {
        showOverlay: (state) => {
            state = true;
            nprogress.start();
            return state;
        },
        hideOverlay: (state) => {
            state = false;
            nprogress.complete();
            return state;
        }
    }
});
export const { showOverlay, hideOverlay } = overlaySlice.actions;
export default overlaySlice.reducer;