import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface UiState {
  activeView: string
  showExportModal: boolean
}

const initialState: UiState = {
  activeView: "dashboard", // Set default view to 'dashboard'
  showExportModal: false,
}

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setActiveView(state, action: PayloadAction<string>) {
      state.activeView = action.payload
    },
    setShowExportModal(state, action: PayloadAction<boolean>) {
      state.showExportModal = action.payload
    },
  },
})

export const { setActiveView, setShowExportModal } = uiSlice.actions
export default uiSlice.reducer
