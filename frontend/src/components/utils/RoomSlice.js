import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  rooms: [],
  activeRoom: null, // roomName
};

const roomSlice = createSlice({
  name: "room",
  initialState,
  reducers: {
    loadRooms: (state, action) => {
      state.rooms = action.payload;
    },

    createRoom: (state, action) => {
      state.rooms.push(action.payload);
    },

    deleteRoom: (state, action) => {
      state.rooms = state.rooms.filter(
        (room) => room.name !== action.payload
      );
    },

    setActiveRoom: (state, action) => {
      state.activeRoom = action.payload; // roomName
    },

    joinRoom: (state, action) => {
      const roomName = action.payload;
      const room = state.rooms.find((r) => r.name === roomName);
      if (room && !room.listeners.includes("Me")) {
        room.listeners.push("Me");
      }
    },

    updateRoomQueue: (state, action) => {
      const { roomName, queue } = action.payload;
      const room = state.rooms.find((r) => r.name === roomName);
      if (room) room.queue = queue;
    },

    updateCurrentSong: (state, action) => {
      const { roomName, song } = action.payload;
      const room = state.rooms.find((r) => r.name === roomName);
      if (room) room.currentSong = song;
    },
  },
});

export const {
  loadRooms,
  createRoom,
  deleteRoom,
  setActiveRoom,
  joinRoom,
  updateRoomQueue,
  updateCurrentSong,
} = roomSlice.actions;

export default roomSlice.reducer;