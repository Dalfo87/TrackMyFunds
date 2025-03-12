// src/shared/config/index.ts

export const config = {
    database: {
      uri: process.env.MONGO_URI || 'mongodb://localhost:27017/trackmyfunds',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    },
    server: {
      port: parseInt(process.env.PORT || '2025', 10),
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
      }
    },
    api: {
      coingecko: {
        baseUrl: 'https://api.coingecko.com/api/v3',
        apiKey: process.env.COINGECKO_API_KEY
      }
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      directory: process.env.LOG_DIR || 'logs'
    }
  };