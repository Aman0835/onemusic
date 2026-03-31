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

export const deleteRoomAPI = async (name) =>
  (await axios.delete(`${API}/${encodeURIComponent(name)}`, authConfig())).data;

export const getRoomDetailsAPI = async (name) =>
  (await axios.get(`${API}/${encodeURIComponent(name)}`, authConfig())).data;

export const addMusicToQueueAPI = async (name, song) =>
  (await axios.post(`${API}/${encodeURIComponent(name)}/queue`, { song }, authConfig())).data;

export const deleteMusicFromQueueAPI = async (name, songId) =>
  (await axios.delete(`${API}/${encodeURIComponent(name)}/queue/${songId}`, authConfig())).data;

export const castVoteAPI = async (name, trackId, value) =>
  (await axios.post(`${API}/${encodeURIComponent(name)}/vote`, { trackId, value }, authConfig())).data;
