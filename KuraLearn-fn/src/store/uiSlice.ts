import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type DrawerState = {
  kind: string | null;
  mode?: "create" | "view" | "edit" | "filter" | "ai";
  title?: string;
  record?: unknown;
  isUploading?: boolean;
};

type ModalState = {
  kind: string | null;
  title?: string;
  description?: string;
  danger?: boolean;
  confirmLabel?: string;
  record?: unknown;
};

type ToastState = {
  id: string;
  tone: "success" | "error" | "info" | "warning";

  message: string;
};

type UiState = {
  drawer: DrawerState;
  modal: ModalState;
  toasts: ToastState[];
};

const initialState: UiState = {
  drawer: { kind: null },
  modal: { kind: null },
  toasts: [],
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openDrawer: (state, action: PayloadAction<DrawerState>) => {
      state.drawer = action.payload;
    },
    closeDrawer: (state) => {
      state.drawer = { kind: null };
    },
    setDrawerUploading: (state, action: PayloadAction<boolean>) => {
      state.drawer.isUploading = action.payload;
    },
    navigateToAi: (state) => {
      state.drawer = { kind: null };
    },
    openModal: (state, action: PayloadAction<ModalState>) => {
      state.modal = action.payload;
    },
    closeModal: (state) => {
      state.modal = { kind: null };
    },
    pushToast: (state, action: PayloadAction<Omit<ToastState, "id">>) => {
      state.toasts.push({ id: `${Date.now()}-${state.toasts.length}`, ...action.payload });
    },
    dismissToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
  },
});

export const {
  closeDrawer,
  closeModal,
  dismissToast,
  openDrawer,
  openModal,
  pushToast,
  setDrawerUploading,
} = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
