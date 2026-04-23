import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL, ENABLE_SOCKETS } from '../utils/api';

const usePresence = (location, user) => {
    const [presence, setPresence] = useState([]);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (!location || !user || !ENABLE_SOCKETS) return;

        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        newSocket.emit('join_location', {
            userId: user._id,
            name: user.name,
            avatar: user.avatar,
            location
        });

        newSocket.on('presence_update', (users) => {
            setPresence(users);
        });

        return () => {
            newSocket.disconnect();
        };
    }, [location, user?._id]);

    return presence;
};

export default usePresence;
