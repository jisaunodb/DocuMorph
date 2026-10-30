import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'documorph_jwt_secret_dev_key_2026_super_secure',
  jwtExpire: '7d',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'uiipxgas',
    apiKey: process.env.CLOUDINARY_API_KEY || '438866686516662',
    apiSecret:
      process.env.CLOUDINARY_API_SECRET && process.env.CLOUDINARY_API_SECRET.length >= 20
        ? process.env.CLOUDINARY_API_SECRET
        : 'r1Usquijzaqe5Idu2vhcI-mpfOQ',
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  serverUrl: process.env.SERVER_URL || 'http://localhost:3000',
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10),
  sslcommerz: {
    storeId: process.env.SSLCOMMERZ_STORE_ID || 'testbox',
    storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD || 'qwerty',
    isSandbox: process.env.SSLCOMMERZ_IS_SANDBOX !== 'false',
  },
};
