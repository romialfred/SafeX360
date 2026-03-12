import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const COMPANY_SELECTION_STORAGE_KEY = "selectedCompanyId";

export type CompanySelectionState = {
    selectedCompanyId: number | null;
};

const initialState: CompanySelectionState = {
    selectedCompanyId: null,
};

const companySelectionSlice = createSlice({
    name: "companySelection",
    initialState,
    reducers: {
        setCompanySelection: (state, action: PayloadAction<number | null>) => {
            state.selectedCompanyId = action.payload ?? null;
        },
        resetCompanySelection: (state) => {
            state.selectedCompanyId = null;
        },
    },
});

export const { setCompanySelection, resetCompanySelection } = companySelectionSlice.actions;
export default companySelectionSlice.reducer;
