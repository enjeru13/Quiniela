import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Users, ChevronRight, LogOut, Trophy, Link2, Trash2 } from "lucide-react";
import { useLeagues } from "../hooks/useLeagues";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

function LeagueCard({ league, isOwner, onLeave, onDelete }) {
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const navigate = useNavigate();
  const inviteUrl = `${window.location.origin}/unirse/${league.code}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: "#1c1c1e", border: "1px solid #2c2c2e" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(10,132,255,0.15)", border: "1px solid rgba(10,132,255,0.2)" }}
        >
          <Trophy size={16} className="text-ios-blue" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-white truncate leading-none">{league.name}</p>
          <div className="flex items-center gap-1.5 mt-1">
            {isOwner && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,159,10,0.15)", color: "#ff9f0a" }}>ADMIN</span>
            )}
            <span className="text-[10px] font-bold tracking-[0.12em] text-ios-label3">#{league.code}</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px mx-4" style={{ background: "#2c2c2e" }} />

      {/* Actions */}
      <div className="flex gap-2 p-3">
        <button
          onClick={copyLink}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all active:scale-[0.97]"
          style={{ background: copied ? "rgba(48,209,88,0.12)" : "rgba(10,132,255,0.1)", border: `1px solid ${copied ? "rgba(48,209,88,0.25)" : "rgba(10,132,255,0.2)"}` }}
        >
          {copied ? <Check size={13} style={{ color: "#30d158" }} /> : <Link2 size={13} className="text-ios-blue" />}
          <span className="text-xs font-black" style={{ color: copied ? "#30d158" : "#0a84ff" }}>
            {copied ? "¡Copiado!" : "Copiar invitación"}
          </span>
        </button>

        <button
          onClick={() => navigate(`/ranking?liga=${league.id}&nombre=${encodeURIComponent(league.name)}`)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all active:scale-[0.97]"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #3a3a3c" }}
        >
          <Users size={13} className="text-ios-label2" />
          <span className="text-xs font-black text-ios-label2">Ver ranking</span>
          <ChevronRight size={11} className="text-ios-label3" />
        </button>
      </div>

      {/* Leave / Delete */}
      <div className="px-3 pb-3 pt-0">
        {isOwner ? (
          confirmDelete ? (
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2 rounded-xl text-[11px] font-black text-ios-label2"
                style={{ background: "#2c2c2e" }}>
                Cancelar
              </button>
              <button onClick={() => onDelete(league.id)}
                className="flex-1 py-2 rounded-xl text-[11px] font-black text-white"
                style={{ background: "#ff453a" }}>
                Sí, eliminar
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold transition-all active:scale-[0.97]"
              style={{ background: "rgba(255,69,58,0.06)", color: "#ff453a" }}>
              <Trash2 size={11} /> Eliminar liga
            </button>
          )
        ) : (
          <button onClick={() => onLeave(league.id)}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold text-ios-label3 transition-all active:scale-[0.97]"
            style={{ background: "rgba(255,69,58,0.06)" }}>
            <LogOut size={11} /> Salir de la liga
          </button>
        )}
      </div>
    </motion.div>
  );
}

function CreateForm({ onCreate, onCancel }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const { error } = await onCreate(name);
    if (error) { setError(error.message); setLoading(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <form onSubmit={handleSubmit} className="rounded-2xl p-4 mb-4" style={{ background: "#1c1c1e", border: "1px solid rgba(10,132,255,0.25)" }}>
        <p className="text-xs font-black text-white mb-3">Nueva liga</p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Familia García, Trabajo..."
          maxLength={40}
          className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-ios-label3 outline-none mb-3"
          style={{ background: "#2c2c2e", border: "1px solid #3a3a3c", fontSize: 16 }}
          onFocus={(e) => (e.target.style.borderColor = "#0a84ff")}
          onBlur={(e) => (e.target.style.borderColor = "#3a3a3c")}
        />
        {error && <p className="text-xs text-ios-red mb-2">{error}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-xs font-black text-ios-label2 transition-all"
            style={{ background: "#2c2c2e" }}>
            Cancelar
          </button>
          <button type="submit" disabled={loading || !name.trim()}
            className="flex-1 py-2.5 rounded-xl text-xs font-black text-white transition-all disabled:opacity-40"
            style={{ background: "#0a84ff" }}>
            {loading ? "Creando..." : "Crear"}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function JoinForm({ onJoin, onCancel }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    const { error } = await onJoin(code);
    if (error) { setError(error.message); setLoading(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <form onSubmit={handleSubmit} className="rounded-2xl p-4 mb-4" style={{ background: "#1c1c1e", border: "1px solid rgba(48,209,88,0.2)" }}>
        <p className="text-xs font-black text-white mb-3">Unirse con código</p>
        <input
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Ej. XK9M2P"
          maxLength={6}
          className="w-full rounded-xl px-4 py-3 text-sm font-black tracking-[0.2em] text-white placeholder:text-ios-label3 placeholder:tracking-normal outline-none mb-3 uppercase"
          style={{ background: "#2c2c2e", border: "1px solid #3a3a3c", fontSize: 16 }}
          onFocus={(e) => (e.target.style.borderColor = "#30d158")}
          onBlur={(e) => (e.target.style.borderColor = "#3a3a3c")}
        />
        {error && <p className="text-xs text-ios-red mb-2">{error}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-xs font-black text-ios-label2"
            style={{ background: "#2c2c2e" }}>
            Cancelar
          </button>
          <button type="submit" disabled={loading || code.length < 4}
            className="flex-1 py-2.5 rounded-xl text-xs font-black text-white disabled:opacity-40"
            style={{ background: "#30d158" }}>
            {loading ? "Buscando..." : "Unirme"}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

export default function Leagues() {
  const { user } = useAuth();
  const { leagues, loading, createLeague, joinLeague, leaveLeague, deleteLeague } = useLeagues();
  const [mode, setMode] = useState(null); // null | 'create' | 'join'

  const handleCreate = async (name) => {
    const result = await createLeague(name);
    if (!result.error) setMode(null);
    return result;
  };

  const handleJoin = async (code) => {
    const result = await joinLeague(code);
    if (!result.error) setMode(null);
    return result;
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Ligas</h1>
          <p className="text-sm text-ios-label2 mt-1">Compite con amigos</p>
        </div>
        {mode === null && (
          <div className="flex gap-2">
            <button
              onClick={() => setMode("join")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all focus:outline-none"
              style={{ background: "rgba(48,209,88,0.12)", color: "#30d158" }}
            >
              <Link2 size={12} /> Unirme
            </button>
            <button
              onClick={() => setMode("create")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all focus:outline-none"
              style={{ background: "#0a84ff", color: "#fff" }}
            >
              <Plus size={12} /> Nueva
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {mode === "create" && <CreateForm key="create" onCreate={handleCreate} onCancel={() => setMode(null)} />}
        {mode === "join" && <JoinForm key="join" onJoin={handleJoin} onCancel={() => setMode(null)} />}
      </AnimatePresence>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: "#1c1c1e" }} />)}
        </div>
      ) : leagues.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-16 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(10,132,255,0.1)", border: "1px solid rgba(10,132,255,0.15)" }}>
            <Users size={26} className="text-ios-blue" />
          </div>
          <div>
            <p className="text-base font-black text-white">Sin ligas aún</p>
            <p className="text-sm text-ios-label3 mt-1 max-w-xs leading-relaxed">Crea una liga privada y comparte el código con tus amigos</p>
          </div>
          <div className="flex gap-3 mt-2">
            <button onClick={() => setMode("join")}
              className="px-4 py-2.5 rounded-2xl text-sm font-black focus:outline-none"
              style={{ background: "rgba(48,209,88,0.12)", color: "#30d158" }}>
              Tengo un código
            </button>
            <button onClick={() => setMode("create")}
              className="px-4 py-2.5 rounded-2xl text-sm font-black text-white focus:outline-none"
              style={{ background: "#0a84ff" }}>
              Crear liga
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-3">
          {leagues.map((l) => (
            <LeagueCard
              key={l.id}
              league={l}
              isOwner={l.created_by === user?.id}
              onLeave={leaveLeague}
              onDelete={deleteLeague}
            />
          ))}
        </div>
      )}
    </>
  );
}
