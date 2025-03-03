import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Carica le variabili d'ambiente
dotenv.config();

// Funzione per connettersi al database
const connectDB = async (): Promise<void> => {
  try {
    const mongoURI: string = process.env.MONGO_URI || 'mongodb://localhost:27017/trackmyfunds';
    
    await mongoose.connect(mongoURI);
    
    console.log('MongoDB connesso con successo');
  } catch (error) {
    console.error('Errore durante la connessione a MongoDB:', error);
    // Termina il processo con un errore
    process.exit(1);
  }
};

export default connectDB;