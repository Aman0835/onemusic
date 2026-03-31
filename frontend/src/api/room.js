import axios from "axios";

import { API_BASE } from "./config";
const API = `${API_BASE}/api/rooms`;

export const getMyRooms = async () =>
  (await axios.get(`${API}/my-rooms`, { withCredentials: true })).data;

export const createRoomAPI = async (name) =>
  (await axios.post(`${API}/create`, { name }, { withCredentials: true })).data;

export const joinRoomAPI = async (name) =>
  (await axios.post(`${API}/join`, { name }, { withCredentials: true })).data;

export const deleteRoomAPI = async (name) =>
  (await axios.delete(`${API}/${encodeURIComponent(name)}`, { withCredentials: true })).data;

export const getRoomDetailsAPI = async (name) =>
  (await axios.get(`${API}/${encodeURIComponent(name)}`, { withCredentials: true })).data;

export const addMusicToQueueAPI = async (name, song) =>
  (await axios.post(`${API}/${encodeURIComponent(name)}/queue`, { song }, { withCredentials: true })).data;

export const deleteMusicFromQueueAPI = async (name, songId) =>
  (await axios.delete(`${API}/${encodeURIComponent(name)}/queue/${songId}`, { withCredentials: true })).data;

export const castVoteAPI = async (name, trackId, value) =>
  (await axios.post(`${API}/${encodeURIComponent(name)}/vote`, { trackId, value }, { withCredentials: true })).data;
