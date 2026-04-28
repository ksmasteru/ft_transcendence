import dotenv  from 'dotenv' ;

dotenv.config('../.env') ;

export const { 
    PORT , 
    HOST ,
    ARCJET_ENV , 
    ARCJET_KEY ,
    DATABASE_URL,
    JWT_SECRET ,
    JWT_EXPIRATION ,
    EMAIL_PASSWORD,
    EMAIL_USER,
    COOKIE_SECRET,
    UID,
    SECRET,
    CALLBACK_URL,
    FRONTEND_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL
} = process.env; 
