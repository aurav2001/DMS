// Cached MongoDB connection for serverless (Vercel).
// Each cold-start invocation reuses the same Mongoose connection across
// warm requests. Without this, mongoose.connect() returns a promise that
// isn't awaited before the first request — queries get queued and time
// out after 10s ("buffering timed out").
const mongoose = require('mongoose');

let cached = global.__mongoose;
if (!cached) {
    cached = global.__mongoose = { conn: null, promise: null };
}

async function connectDB() {
    if (cached.conn) return cached.conn;

    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is not defined in environment variables');
    }

    if (!cached.promise) {
        cached.promise = mongoose
            .connect(process.env.MONGO_URI, {
                bufferCommands: false,
                serverSelectionTimeoutMS: 10000,
                socketTimeoutMS: 45000,
            })
            .then((m) => {
                console.log('MongoDB connected');
                return m;
            })
            .catch((err) => {
                cached.promise = null; // allow retry on next request
                console.error('MongoDB connection error:', err.message);
                throw err;
            });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}

module.exports = connectDB;
