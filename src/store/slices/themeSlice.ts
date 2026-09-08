import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  mode: ThemeMode;
}

const initialState: ThemeState = { mode: "system" };

/**
 * Client-only UI state example.
 * The actual `dark` class is applied in app-providers via `next-themes`
 * behavior implemented natively (no extra dep): resolved on mount to
 * avoid hydration mismatch.
 */
const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.mode = action.payload;
    },
  },
});

export const { setThemeMode } = themeSlice.actions;
export default themeSlice.reducer;
