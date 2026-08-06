"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";

type UserRole = "super_admin" | "admin" | "student" | "parent" | null;

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  dbUser: Record<string, unknown> | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  dbUser: null,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [dbUser, setDbUser] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        try {
          // Check if user is an admin
          let userDoc = await getDoc(doc(db, "admins", firebaseUser.uid));
          if (userDoc.exists()) {
            setRole(userDoc.data().role as UserRole);
            setDbUser(userDoc.data());
          } else {
            // Check if student
            userDoc = await getDoc(doc(db, "students", firebaseUser.uid));
            if (userDoc.exists()) {
              setRole("student");
              setDbUser(userDoc.data());
            } else {
              // Check if parent
              userDoc = await getDoc(doc(db, "parents", firebaseUser.uid));
              if (userDoc.exists()) {
                setRole("parent");
                setDbUser(userDoc.data());
              } else {
                setRole(null);
                setDbUser(null);
              }
            }
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setRole(null);
          setDbUser(null);
        }
      } else {
        setUser(null);
        setRole(null);
        setDbUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading, dbUser }}>
      {children}
    </AuthContext.Provider>
  );
}
