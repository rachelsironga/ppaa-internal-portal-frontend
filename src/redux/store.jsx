import { configureStore } from "@reduxjs/toolkit";
import { thunk } from "redux-thunk";
import storage from "redux-persist/lib/storage"; // Use localStorage
import { persistReducer, persistStore } from "redux-persist";
import { rootReducer } from "./reducer"; // Import your root reducer

// Redux Persist Configuration
const persistConfig = {
    key: "root",
    storage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
    reducer: persistedReducer, // Use persisted reducer
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(thunk),
    devTools: process.env.NODE_ENV !== "production",
});

export const persistor = persistStore(store); // Create persistor

export default store;