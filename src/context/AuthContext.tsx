"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";

type UserRole = "super_admin" | "admin" | "student" | "parent" | "faculty" | null;

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
    let unsubscribeSnapshot: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = undefined;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        
        try {
          let roleFound: UserRole = null;
          let collectionName = "";

          // Check if user is an admin
          let userDoc = await getDoc(doc(db, "admins", firebaseUser.uid));
          if (userDoc.exists()) {
            roleFound = userDoc.data().role as UserRole;
            collectionName = "admins";
          } else {
            // Check if student
            userDoc = await getDoc(doc(db, "students", firebaseUser.uid));
            if (userDoc.exists()) {
              roleFound = "student";
              collectionName = "students";
            } else {
              // Check if parent
              userDoc = await getDoc(doc(db, "parents", firebaseUser.uid));
              if (userDoc.exists()) {
                roleFound = "parent";
                collectionName = "parents";
              } else {
                // Check if faculty
                userDoc = await getDoc(doc(db, "faculty", firebaseUser.uid));
                if (userDoc.exists()) {
                  roleFound = "faculty";
                  collectionName = "faculty";
                }
              }
            }
          }

          if (roleFound && collectionName) {
            setRole(roleFound);
            unsubscribeSnapshot = onSnapshot(doc(db, collectionName, firebaseUser.uid), (docSnap) => {
              if (docSnap.exists()) {
                setDbUser(docSnap.data());
              } else {
                setDbUser(null);
              }
              setLoading(false);
            });
          } else {
            setRole(null);
            setDbUser(null);
            setLoading(false);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setRole(null);
          setDbUser(null);
          setLoading(false);
        }
      } else {
        setUser(null);
        setRole(null);
        setDbUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading, dbUser }}>
      {children}
    </AuthContext.Provider>
  );
}
