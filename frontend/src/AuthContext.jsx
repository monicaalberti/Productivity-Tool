import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "./firebase"; // This is the auth instance from your config
import { onAuthStateChanged } from "firebase/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listens for changes in the user's sign-in state
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    
    // Clean up subscription on unmount
    return () => unsub();
  }, []);

  return (
    /* FIX: We added 'auth' to the provider value so that 
       signInWithEmailAndPassword(auth, ...) has the instance it needs.
    */
    <AuthContext.Provider value={{ user, auth }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;