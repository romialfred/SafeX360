import { createSlice } from '@reduxjs/toolkit';

/**
 * MobileSidebarSlice — État global du drawer sidebar mobile (LOT 48 P6.j).
 *
 * Sur mobile (< md = 768 px), la sidebar n'est plus toujours visible :
 * elle se transforme en drawer off-canvas, contrôlable depuis le hamburger
 * du Header. Ce slice expose l'état d'ouverture pour synchroniser Header
 * (qui déclenche l'ouverture) et Sidebar (qui s'anime en fonction).
 *
 * Sur desktop (≥ md), ce state est ignoré : la sidebar reste affichée
 * par défaut, contrôlée par CollapseSlice (collapsed mini vs étendue).
 */
const mobileSidebarSlice = createSlice({
    name: 'mobileSidebar',
    initialState: { open: false },
    reducers: {
        openMobileSidebar: (state) => {
            state.open = true;
        },
        closeMobileSidebar: (state) => {
            state.open = false;
        },
        toggleMobileSidebar: (state) => {
            state.open = !state.open;
        },
    },
});

export const { openMobileSidebar, closeMobileSidebar, toggleMobileSidebar } = mobileSidebarSlice.actions;
export default mobileSidebarSlice.reducer;
