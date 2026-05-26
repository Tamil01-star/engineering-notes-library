const mongoose = require('mongoose');

let useFallback = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.warn('⚠️ No MONGODB_URI detected. Running in LOCAL FAILSAFE mode (using local JSON storage).');
    useFallback = true;
    return;
  }

  try {
    const conn = await mongoose.connect(mongoURI);
    console.log(`📡 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    console.warn('⚠️ Falling back to LOCAL FAILSAFE mode (using local JSON storage).');
    useFallback = true;
  }
};

module.exports = {
  connectDB,
  isFallback: () => useFallback
};
