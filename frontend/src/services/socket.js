import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://192.168.35.239:5000';

export const socket = io(SERVER_URL, { autoConnect: true });

export default socket;