import { motion } from "framer-motion";
import { Loader2, CheckCircle2, Terminal } from "lucide-react";
import { useApp } from "../context/AppContext";
import { translations } from "../i18n/translations";

export default function LoadingScreen({ status, step, logs }) {
    const { language } = useApp();
    const t = translations[language] || translations['en'];
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-8 relative overflow-hidden font-sans">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[128px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[128px] -translate-x-1/2 translate-y-1/2 pointer-events-none" />

            <div className="w-full max-w-2xl space-y-8 relative z-10">
                <div className="text-center space-y-4">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center justify-center p-4 rounded-full bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20 shadow-lg shadow-blue-500/10"
                    >
                        <Loader2 className="w-12 h-12 animate-spin" />
                    </motion.div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        {t.analyzingDNA}
                    </h2>
                    <p className="text-slate-400">{t.processingEvents}</p>
                </div>

                <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl overflow-hidden flex flex-col h-[400px]">
                    <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                        <Terminal className="w-4 h-4 text-slate-500" />
                        <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">{t.systemLogs}</span>
                    </div>

                    <div className="overflow-y-auto space-y-3 font-mono text-sm custom-scrollbar flex-1">
                        {logs.map((log, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.05 }}
                                className="flex items-start gap-3 group"
                            >
                                <CheckCircle2 className="w-4 h-4 text-emerald-500/80 shrink-0 mt-0.5 group-hover:text-emerald-400 transition-colors" />
                                <span className="text-slate-300 group-hover:text-white transition-colors leading-relaxed">{log}</span>
                            </motion.div>
                        ))}
                        {/* Dummy element for auto-scroll if needed, though simple flex works */}
                        <div className="h-0" />
                    </div>
                </div>
            </div>
        </div>
    );
}
