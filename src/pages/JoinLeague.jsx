import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Users, ArrowRight, Trophy } from "lucide-react";
import { useLeagues } from "../hooks/useLeagues";
import { useAuth } from "../contexts/AuthContext";

export default function JoinLeague() {
  const { code } = useParams();
  const { user } = useAuth();
  const { joinLeague } = useLeagues();
  const navigate = useNavigate();
  const [state, setState] = useState("joining"); // joining | success | error | noauth
  const [league, setLeague] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!user) { setState("noauth"); return; }

    joinLeague(code).then(({ league, error }) => {
      if (error) {
        setErrorMsg(error.message);
        setState("error");
      } else {
        setLeague(league);
        setState("success");
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="min-h-screen bg-ios-bg flex items-center justify-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="w-full max-w-sm text-center"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-2xl" style={{ background: "linear-gradient(135deg, #ff6b35, #ff453a)" }}>
            <Trophy size={26} className="text-white" />
          </div>
          <h1 className="text-xl font-black tracking-tight">Quiniela Mundial 2026</h1>
        </div>

        <div className="rounded-3xl p-6" style={{ background: "#1c1c1e", border: "1px solid #2c2c2e" }}>
          {state === "joining" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-10 h-10 rounded-full border-2 border-ios-blue border-t-transparent animate-spin" />
              <p className="text-sm font-black text-white">Uniéndote a la liga...</p>
              <p className="text-xs text-ios-label3">código #{code?.toUpperCase()}</p>
            </div>
          )}

          {state === "success" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(48,209,88,0.12)" }}>
                <CheckCircle2 size={28} style={{ color: "#30d158" }} />
              </div>
              <div>
                <p className="text-lg font-black text-white">¡Bienvenido!</p>
                <p className="text-sm text-ios-label2 mt-1">Te uniste a <span className="text-white font-bold">{league?.name}</span></p>
              </div>
              <div className="flex flex-col gap-2 w-full mt-2">
                <button
                  onClick={() => navigate(`/ranking?liga=${league?.id}&nombre=${encodeURIComponent(league?.name ?? "")}`)}
                  className="w-full py-3 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2"
                  style={{ background: "#0a84ff" }}
                >
                  <Users size={15} /> Ver ranking de la liga <ArrowRight size={14} />
                </button>
                <button onClick={() => navigate("/")} className="w-full py-2.5 rounded-2xl text-sm font-semibold text-ios-label2" style={{ background: "#2c2c2e" }}>
                  Ir a partidos
                </button>
              </div>
            </div>
          )}

          {state === "error" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(255,69,58,0.12)" }}>
                <span className="text-2xl font-black text-ios-red">!</span>
              </div>
              <div>
                <p className="text-base font-black text-white">Ups</p>
                <p className="text-sm text-ios-label3 mt-1">{errorMsg}</p>
              </div>
              <div className="flex flex-col gap-2 w-full mt-2">
                <button onClick={() => navigate("/ligas")} className="w-full py-3 rounded-2xl text-sm font-black text-white" style={{ background: "#0a84ff" }}>
                  Mis ligas
                </button>
                <button onClick={() => navigate("/")} className="w-full py-2.5 rounded-2xl text-sm font-semibold text-ios-label2" style={{ background: "#2c2c2e" }}>
                  Ir a inicio
                </button>
              </div>
            </div>
          )}

          {state === "noauth" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(10,132,255,0.12)" }}>
                <Users size={26} className="text-ios-blue" />
              </div>
              <div>
                <p className="text-base font-black text-white">Inicia sesión primero</p>
                <p className="text-sm text-ios-label3 mt-1">Necesitas cuenta para unirte a la liga</p>
              </div>
              <button
                onClick={() => navigate(`/?join=${code}`)}
                className="w-full py-3 rounded-2xl text-sm font-black text-white"
                style={{ background: "#0a84ff" }}
              >
                Crear cuenta / Iniciar sesión
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
