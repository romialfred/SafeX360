import { createSlice } from "@reduxjs/toolkit";

/**
 * Ouverture de la fenêtre de l'Assistant SafeX 360.
 *
 * <p>L'état était local à `FloatingAiAssistant`, ce qui rendait l'assistant
 * impossible à ouvrir depuis ailleurs. Il est remonté ici pour que le bouton
 * « Assistant SafeX 360 » du pied de page (`AppFooter`) puisse le déclencher.</p>
 */
const aiAssistantSlice = createSlice({
    name: 'aiAssistant',
    initialState: { open: false },
    reducers: {
        openAiAssistant: (state) => {
            state.open = true;
        },
        closeAiAssistant: (state) => {
            state.open = false;
        },
        toggleAiAssistant: (state) => {
            state.open = !state.open;
        },
    },
});

export const { openAiAssistant, closeAiAssistant, toggleAiAssistant } =
    aiAssistantSlice.actions;
export default aiAssistantSlice.reducer;
