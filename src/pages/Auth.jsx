import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

function Input({ label, type = "text", value, onChange, placeholder, rightEl, disabled }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-ios-label3 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={
            type === "password" ? "new-password"
            : type === "email" ? "email"
            : "off"
          }
          className="w-full rounded-xl px-4 py-3.5 text-base text-white placeholder:text-ios-label3 outline-none transition-all disabled:opacity-50"
          style={{ background: "#2c2c2e", border: "1px solid #3a3a3c", fontSize: "16px" }}
          onFocus={(e) => (e.target.style.borderColor = "#0a84ff")}
          onBlur={(e) => (e.target.style.borderColor = "#3a3a3c")}
        />
        {rightEl && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightEl}</div>
        )}
      </div>
    </div>
  );
}

function PasswordInput({ label, value, onChange, placeholder, disabled }) {
  const [show, setShow] = useState(false);
  return (
    <Input
      label={label}
      type={show ? "text" : "password"}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      rightEl={
        <button type="button" onClick={() => setShow((v) => !v)} className="text-ios-label3 hover:text-white transition-colors">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      }
    />
  );
}

// ── Forgot password — email + nueva pass, sin verificacion ───────────────────
function ForgotView({ onBack }) {
  const [email, setEmail]     = useState("");
  const [newPass, setNewPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [done, setDone]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPass.length < 6) { setError("Mínimo 6 caracteres"); return; }
    setLoading(true);
    const res = await fetch("/.netlify/functions/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: newPass }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Error al actualizar"); return; }
    setDone(true);
  };

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4 py-6">
        <CheckCircle2 size={52} style={{ color: "#30d158" }} />
        <div className="text-center">
          <p className="text-base font-black text-white">Contraseña actualizada</p>
          <p className="text-sm text-ios-label2 mt-1">Ya puedes iniciar sesión.</p>
        </div>
        <button onClick={onBack} className="text-sm font-semibold text-ios-blue mt-2">
          Iniciar sesión
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <button onClick={onBack} className="flex items-center gap-1.5 text-ios-blue text-sm font-semibold mb-5">
        <ArrowLeft size={15} /> Volver
      </button>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com" disabled={loading} />
        <PasswordInput label="Nueva contraseña" value={newPass} onChange={(e) => setNewPass(e.target.value)}
          placeholder="Mín. 6 caracteres" disabled={loading} />
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-semibold text-ios-red">{error}</motion.p>
        )}
        <button type="submit" disabled={loading || !email || !newPass}
          className="w-full py-3.5 rounded-2xl text-white text-sm font-black transition-all active:scale-[0.98] disabled:opacity-50 mt-1"
          style={{ background: "linear-gradient(135deg, #0a84ff, #0066cc)" }}>
          {loading ? "Actualizando..." : "Cambiar contraseña"}
        </button>
      </form>
    </motion.div>
  );
}

// ── Main Auth ─────────────────────────────────────────────────────────────────
export default function Auth() {
  const [mode, setMode]         = useState("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState("");
  const { signIn, signUp } = useAuth();

  const switchMode = (m) => { setMode(m); setError(""); setSuccess(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (mode === "signup") {
      if (!username.trim()) { setError("Necesitas un nombre de usuario"); setLoading(false); return; }
      if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); setLoading(false); return; }
      const { error } = await signUp(email, password, username.trim());
      if (error) setError(error.message);
      else setSuccess("Cuenta creada. Revisa tu email para confirmar.");
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message.includes("Invalid login") ? "Email o contraseña incorrectos" : error.message);
      }
    }

    setLoading(false);
  };

  return (
    <div className="bg-ios-bg flex flex-col overflow-hidden" style={{ height: "100dvh" }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-100 h-100 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,107,53,0.07) 0%, transparent 70%)" }} />

      <div className="flex-1 overflow-y-auto flex items-center justify-center px-5 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }} className="relative w-full max-w-sm">

          {/* Logo */}
          <div className="flex flex-col items-center mb-5 sm:mb-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-[20px] flex items-center justify-center mb-3 shadow-2xl"
              style={{ background: "linear-gradient(135deg, #ff6b35, #ff453a)" }}>
              <Trophy size={22} className="text-white sm:hidden" />
              <Trophy size={30} className="text-white hidden sm:block" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Quiniela</h1>
            <p className="text-xs sm:text-sm text-ios-label2 mt-1">Mundial 2026</p>
          </div>

          {/* Card */}
          <div className="rounded-3xl p-5 sm:p-6" style={{ background: "#1c1c1e", border: "1px solid #3a3a3c" }}>
            <AnimatePresence mode="wait">
              {mode === "forgot" ? (
                <motion.div key="forgot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <ForgotView onBack={() => switchMode("login")} />
                </motion.div>
              ) : (
                <motion.div key="auth" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  {/* Tabs */}
                  <div className="flex rounded-xl p-1 mb-5 sm:mb-6" style={{ background: "#2c2c2e" }}>
                    {["login", "signup"].map((m) => (
                      <button key={m} onClick={() => switchMode(m)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === m ? "bg-ios-card text-white shadow-md" : "text-ios-label2"}`}>
                        {m === "login" ? "Iniciar sesión" : "Crear cuenta"}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <AnimatePresence>
                      {mode === "signup" && (
                        <motion.div key="username" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                          <Input label="Nombre de usuario" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ej. CarlosM" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" />
                    <PasswordInput label="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === "signup" ? "Mín. 6 caracteres" : "••••••••"} />

                    {error && (
                      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-semibold text-ios-red">{error}</motion.p>
                    )}
                    {success && (
                      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-semibold text-ios-green">{success}</motion.p>
                    )}

                    <button type="submit" disabled={loading}
                      className="w-full py-3.5 rounded-2xl text-white text-sm font-black transition-all active:scale-[0.98] disabled:opacity-50 mt-1"
                      style={{ background: "linear-gradient(135deg, #0a84ff, #0066cc)" }}>
                      {loading ? "Cargando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
                    </button>

                    {mode === "login" && (
                      <button type="button" onClick={() => switchMode("forgot")}
                        className="text-center text-[12px] font-semibold text-ios-label2 hover:text-ios-blue transition-colors">
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {mode === "signup" && (
            <p className="text-center text-[11px] text-ios-label3 mt-4 px-4 leading-relaxed">
              Al crear cuenta aceptas participar en la quiniela y que tus puntos sean visibles en el ranking.
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
