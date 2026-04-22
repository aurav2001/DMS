const { Server } = require('socket.io');

const initSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    const activeUsers = new Map(); // socketId -> { userId, name, location }

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('join_location', ({ userId, name, avatar, location }) => {
            activeUsers.set(socket.id, { userId, name, avatar, location });
            socket.join(location);
            
            // Broadcast updated presence for this location
            const usersInLocation = Array.from(activeUsers.values())
                .filter(u => u.location === location);
            
            io.to(location).emit('presence_update', usersInLocation);
            console.log(`${name} joined ${location}`);
        });

        socket.on('disconnect', () => {
            const user = activeUsers.get(socket.id);
            if (user) {
                const { name, location } = user;
                activeUsers.delete(socket.id);
                
                const usersInLocation = Array.from(activeUsers.values())
                    .filter(u => u.location === location);
                
                io.to(location).emit('presence_update', usersInLocation);
                console.log(`${name} left ${location}`);
            }
        });
    });

    return io;
};

module.exports = initSocket;
