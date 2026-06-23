/* eslint-disable react-hooks/immutability */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const pendingResetRef = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id, session.user);
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'PASSWORD_RECOVERY') {
        setUser(session?.user ?? null);
        setRecoveryMode(true);
        setLoading(false);
        return;
      }
      // Block normal sign-in processing during OTP reset flow
      if (_event === 'SIGNED_IN' && pendingResetRef.current) return;

      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id, session.user);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId, userObj) {
    let { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!data) {
      const username =
        userObj?.user_metadata?.username ||
        userObj?.email?.split("@")[0] ||
        "usuario";
      const { data: created } = await supabase
        .from("profiles")
        .insert({ id: userId, username })
        .select()
        .maybeSingle();
      data = created;
    }

    setProfile(data);
    setLoading(false);
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }

  async function signUp(email, password, username) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    return { error };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) setRecoveryMode(false);
    return { error };
  }

  const startOtpReset = () => { pendingResetRef.current = true; };
  const endOtpReset   = () => { pendingResetRef.current = false; };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, recoveryMode, signIn, signUp, signOut, updatePassword, startOtpReset, endOtpReset }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
