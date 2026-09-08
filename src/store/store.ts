import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./api/baseApi";
import themeReducer from "./slices/themeSlice";

/**
 * Single Redux store.
 * - RTK Query (baseApi) handles ALL server state (articles, comments, etc.)
 * - Slices handle ONLY client UI state (theme, menus, drafts-in-progress)
 */
export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    theme: themeReducer,
  },
  middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
