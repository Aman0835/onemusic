import axios from "axios";
import { API_BASE } from "./config";
import { authHeaders } from "./auth";

const API = `${API_BASE}/api/rooms`;

const authConfig = () => ({ headers: authHeaders() });

export const getMyRooms = async () =>
  (await axios.get(`${API}/my-rooms`, authConfig())).data;

export const createRoomAPI = async (name) =>
  (await axios.post(`${API}/create`, { name }, authConfig())).data;

export const joinRoomAPI = async (name) =>
  (await axios.post(`${API}/join`, { name }, authConfig())).data;

export const deleteRoomAPI = async (roomId) =>
  (await axios.delete(`${API}/${roomId}`, authConfig())).data;

export const getRoomDetailsAPI = async (roomId) =>
  (await axios.get(`${API}/${roomId}`, authConfig())).data;

export const addMusicToQueueAPI = async (roomId, song) =>
  (await axios.post(`${API}/${roomId}/queue`, { song }, authConfig())).data;

export const deleteMusicFromQueueAPI = async (roomId, songId) =>
  (await axios.delete(`${API}/${roomId}/queue/${songId}`, authConfig())).data;

export const castVoteAPI = async (roomId, trackId, value) =>
  (await axios.post(`${API}/${roomId}/vote`, { trackId, value }, authConfig())).data;
