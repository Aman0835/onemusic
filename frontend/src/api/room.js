import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE ;
const API = `${API_BASE}/api/rooms`;

export const getMyRooms = async () =>
  (await axios.get(`${API}/my-rooms`, { withCredentials: true })).data;

export const createRoomAPI = async (name) =>
  (await axios.post(`${API}/create`, { name }, { withCredentials: true })).data;

export const joinRoomAPI = async (name) =>
  (await axios.post(`${API}/join`, { name }, { withCredentials: true })).data;

export const deleteRoomAPI = async (name) =>
  (await axios.delete(`${API}/${name}`, { withCredentials: true })).data;

export const getRoomDetailsAPI = async (name) =>
  (await axios.get(`${API}/${name}`, { withCredentials: true })).data;

export const addMusicToQueueAPI = async (name, song) =>
  (await axios.post(`${API}/${name}/queue`, { song }, { withCredentials: true })).data;

export const deleteMusicFromQueueAPI = async (name, songId) =>
  (await axios.delete(`${API}/${name}/queue/${songId}`, { withCredentials: true })).data;

export const castVoteAPI = async (name, trackId, value) =>
  (await axios.post(`${API}/${name}/vote`, { trackId, value }, { withCredentials: true })).data;
