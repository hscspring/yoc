import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Github, Loader2, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';
import { translations } from '../i18n/translations';

export default function InputScreen() {
    const { login, setLlmConfig, language, setLanguage } = useApp();
    const t = translations[language] || translations['en'];
    const [inputToken, setInputToken] = useState('');
    const [baseUrl, setBaseUrl] = useState('https://api.qnaigc.com/v1');
    const [apiKey, setApiKey] = useState('sk-f8fe975324429d483fee979c961ce5455948cf10437b20f929ebd983badc97bb');
    const [model, setModel] = useState('gpt-oss-120b');
    const [year, setYear] = useState(2025);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!inputToken) return;

        setLoading(true);
        setError('');

        // Store LLM Config with current language
        setLlmConfig({ baseUrl, apiKey, model, language, year });

        const success = await login(inputToken);
        if (!success) {
            setError('Invalid Token or Network Error');
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full relative z-10"
            >
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-3 bg-white/5 rounded-2xl mb-6 backdrop-blur-xl border border-white/10 shadow-2xl">
                        <Github className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-br from-white via-white to-white/50 bg-clip-text text-transparent">
                        {t.annualReport}
                    </h1>
                    <p className="mt-3 text-lg text-slate-400 font-light">
                        {t.decodeEngineeringDNA}
                    </p>
                </div>

                <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 shadow-2xl">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-4">
                            <div className="group">
                                <label htmlFor="token" className="block text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">{t.githubToken}</label>
                                <input
                                    id="token"
                                    name="token"
                                    type="password"
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono text-sm"
                                    placeholder="ghp_xxxxxxxxxxxx"
                                    value={inputToken}
                                    onChange={(e) => setInputToken(e.target.value)}
                                />
                            </div>

                            <div className="group">
                                <label htmlFor="baseUrl" className="block text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">{t.llmBaseUrl}</label>
                                <input
                                    id="baseUrl"
                                    name="baseUrl"
                                    type="text"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-mono text-sm"
                                    placeholder="https://api.openai.com/v1"
                                    value={baseUrl}
                                    onChange={(e) => setBaseUrl(e.target.value)}
                                />
                            </div>

                            <div className="group">
                                <label htmlFor="apiKey" className="block text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">{t.llmApiKey}</label>
                                <input
                                    id="apiKey"
                                    name="apiKey"
                                    type="password"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-mono text-sm"
                                    placeholder="sk-..."
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                />
                            </div>

                            <div className="group">
                                <label htmlFor="model" className="block text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">{t.llmModel}</label>
                                <input
                                    id="model"
                                    name="model"
                                    type="text"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-mono text-sm"
                                    placeholder="gpt-4o"
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                />
                            </div>

                            <div className="group">
                                <label htmlFor="year" className="block text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">{t.year || 'Year'}</label>
                                <select
                                    id="year"
                                    name="year"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                                    value={year}
                                    onChange={(e) => setYear(parseInt(e.target.value))}
                                >
                                    <option value={2025}>2025</option>
                                    <option value={2024}>2024</option>
                                    <option value={2023}>2023</option>
                                </select>
                            </div>

                            <div className="group">
                                <label htmlFor="language" className="block text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">{t.language || 'Language'}</label>
                                <select
                                    id="language"
                                    name="language"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                >
                                    <option value="en">English</option>
                                    <option value="zh">中文</option>
                                </select>
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="text-red-400 text-sm flex items-center justify-center bg-red-500/10 p-2 rounded-lg border border-red-500/20"
                            >
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg font-medium tracking-wide"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                <>
                                    <span>{t.generateProfile}</span>
                                    <Terminal className="w-4 h-4 ml-1" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center text-xs text-slate-500">
                    <p>{t.requiresScopes} <code>read:user</code> {t.andScopes} <code>repo</code> {t.scopes}.</p>
                    <p className="mt-1">{t.tokensProcessedLocally}.</p>
                </div>
            </motion.div>
        </div>
    );
}
