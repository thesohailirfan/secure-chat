import React, { useContext, useState, useEffect } from "react";
import { auth, createUser, saveLogin, updateUser } from "../firebase";

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState();
  const [loginstatus, setloginstatus] = useState({
    "success" : true,
    "message" : "",
  });
  const [signupstatus, setsignupstatus] = useState({
    "success" : true,
    "message" : "",
  });
  const [loading, setLoading] = useState(true);

  

  async function signup(email, password) {
    try{
      let e = await auth.createUserWithEmailAndPassword(email, password)
      createUser({
        "username" : email.slice(0, email.indexOf("@")),
        "uid": e.user.uid
      })
      saveLogin(email, password)
      return({
        "success" : true,
        "message" : "Success",
      })
    }
    catch(error){
      return({
        "success" : false,
        "message" : error.message,
      })
    }
  }

  async function login(email, password) {
    try{
      let e = await auth.signInWithEmailAndPassword(email, password)
      updateUser({
        "username" : email.slice(0, email.indexOf("@")),
        "uid": e.user.uid
      })
      saveLogin(email, password)
      return({
        "success" : true,
        "message" : "Success",
      })
    } catch (error) {
      return({
        "success" : false,
        "message" : error.message,
      })
    }
  }
  function logout() {
    return auth.signOut();
  }

  const value = { currentUser, signup, login, logout };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
