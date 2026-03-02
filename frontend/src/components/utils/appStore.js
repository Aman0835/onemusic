import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./UserSlice";
import roomReducer from "./RoomSlice";


const appStore = configureStore({
  reducer: {
    user: userReducer,
    room: roomReducer,
  },
});

export default appStore;
