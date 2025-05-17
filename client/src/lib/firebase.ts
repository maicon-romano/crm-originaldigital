import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  User as FirebaseUser,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAIuDf7b1JyqprPZNCbiDwjRnixH3foQho",
  authDomain: "crm-originaldigital.firebaseapp.com",
  projectId: "crm-originaldigital",
  storageBucket: "crm-originaldigital.firebasestorage.app",
  messagingSenderId: "479915127960",
  appId: "1:479915127960:web:f5ac249194cbb829ae8ced",
  measurementId: "G-FYFRK0WG02"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// O ID definido para o usuário admin
export const ADMIN_UID = 'riwAaqRuxpXBP0uT1rMO1KGBsIW2';

// Observador de estado de autenticação para depuração
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Auth state changed: User is signed in", user.uid);
  } else {
    console.log("Auth state changed: User is signed out");
  }
});

// Para criar um usuário admin para teste
export const createAdminUser = async (email: string, password: string, displayName: string): Promise<FirebaseUser> => {
  try {
    console.log("Attempting to create admin user:", email);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Atualizar o perfil com o nome fornecido
    await updateProfile(userCredential.user, {
      displayName: displayName
    });
    
    console.log("Admin user created:", userCredential.user.uid);
    console.log("IMPORTANT: You need to manually set this user as admin in Firebase console");
    
    return userCredential.user;
  } catch (error: any) {
    console.error("Error creating admin user:", error);
    throw error;
  }
};

// Firebase authentication functions
export const loginWithEmailAndPassword = async (email: string, password: string): Promise<FirebaseUser> => {
  try {
    console.log("Attempting to sign in with email:", email);
    
    // Para desenvolvimento, implementaremos um login de teste
    if (email === 'admin@example.com' && password === 'senha123') {
      console.log('Usando credenciais de teste - Em produção, remova este código!');
      // Forçar login diretamente com o usuário real
      try {
        return (await signInWithEmailAndPassword(auth, 'originaldigitaloficial@gmail.com', 'senha098')).user;
      } catch (innerError) {
        console.error("Erro no login de teste:", innerError);
        throw innerError;
      }
    }
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Login successful for user:", userCredential.user.uid);
    return userCredential.user;
  } catch (error: any) {
    console.error("Error signing in with email and password", error);
    throw error;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
    console.log("User signed out successfully");
    
    // Forçar redirecionamento para a página de login
    window.location.href = '/login';
  } catch (error: any) {
    console.error("Error signing out", error);
    throw error;
  }
};