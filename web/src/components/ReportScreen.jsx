import { useEffect, useState, useRef } from "react";
import { useApp } from "../context/AppContext";
import { generateNarrative } from "../services/llm";
import { Copy, Share2, Calendar, GitCommit, GitPullRequest, MessageSquare, Zap, Activity, Award, Terminal, Languages, Download, Loader2, Moon, Sun, Sunrise, Sunset, Target, Repeat, Users, Zap as ZapIcon, Globe, Gift } from "lucide-react";
import clsx from "clsx";
import { translations } from "../i18n/translations";
import { domToPng } from 'modern-screenshot';

const COLORS = {
    blue: { text: "text-blue-400", bg: "bg-blue-500" },
    green: { text: "text-green-400", bg: "bg-green-500" },
    yellow: { text: "text-yellow-400", bg: "bg-yellow-500" },
    orange: { text: "text-orange-400", bg: "bg-orange-500" },
    pink: { text: "text-pink-400", bg: "bg-pink-500" },
    indigo: { text: "text-indigo-400", bg: "bg-indigo-500" },
    purple: { text: "text-purple-400", bg: "bg-purple-500" },
    emerald: { text: "text-emerald-400", bg: "bg-emerald-500" },
};

const Card = ({ children, className }) => (
    <div className={clsx("bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-8 shadow-xl", className)}>
        {children}
    </div>
);

const Metric = ({ label, value, subtext, icon: Icon, color = "blue" }) => {
    const theme = COLORS[color] || COLORS.blue;
    return (
        <div className="flex flex-col h-full justify-between">
            <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</span>
                {Icon && <Icon className={clsx("w-5 h-5", theme.text)} />}
            </div>
            <div>
                <div className="text-3xl md:text-3xl font-bold text-white tracking-tight">{value}</div>
                {subtext && <div className="text-sm text-slate-500 mt-1">{subtext}</div>}
            </div>
        </div>
    );
};

const ScoreTile = ({ label, score, caption, icon: Icon, color }) => {
    const theme = COLORS[color] || COLORS.blue;
    return (
        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-2">
                <span className={clsx("text-xs font-medium uppercase tracking-wider", theme.text)}>{label}</span>
                <Icon className={clsx("w-4 h-4", theme.text)} />
            </div>
            <div>
                <div className="text-4xl font-mono text-white tracking-tighter mb-1">{score}</div>
                <div className="text-[10px] text-slate-500 font-medium leading-tight">{caption}</div>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full mt-3 overflow-hidden">
                <div className={clsx("h-full rounded-full", theme.bg)} style={{ width: `${Math.min(score * 100, 100)}%` }}></div>
            </div>
        </div>
    );
};

export default function ReportScreen() {
    const { pipelineState, llmConfig, language, viewer } = useApp();
    const t = translations[language] || translations['en'];
    const { profile } = pipelineState.data || {};
    const [narrative, setNarrative] = useState("");
    const [oneSentence, setOneSentence] = useState("");
    const [generating, setGenerating] = useState(false);
    const [sharing, setSharing] = useState(false);
    const reportRef = useRef(null);

    useEffect(() => {
        if (!profile || !llmConfig.apiKey) return;

        const gen = async () => {
            setGenerating(true);
            try {
                const [n, s] = await Promise.all([
                    generateNarrative(llmConfig, profile, 'MAIN_NARRATIVE'),
                    generateNarrative(llmConfig, profile, 'ONE_SENTENCE')
                ]);
                setNarrative(n);
                setOneSentence(s);
            } catch (e) {
                console.error(e);
                setNarrative("Failed to generate narrative. Please check your API Key.");
            } finally {
                setGenerating(false);
            }
        };
        gen();
    }, [profile, llmConfig]);

    const handleShare = async () => {
        if (!reportRef.current) return;

        const year = llmConfig.year || new Date().getFullYear();
        setSharing(true);

        try {
            const dataUrl = await domToPng(reportRef.current, {
                scale: 2,
                backgroundColor: '#020617',
                style: {
                    transform: 'scale(1)',
                },
                filter: (node) => {
                    return !node.hasAttribute?.('data-no-export');
                }
            });

            const link = document.createElement('a');
            link.download = `github-year-in-review-${year}-${viewer?.login || 'user'}.png`;
            link.href = dataUrl;
            link.click();

        } catch (error) {
            console.error('[Share] Export failed:', error);
            alert("Failed to generate image. Please try taking a screenshot manually.");
        } finally {
            setSharing(false);
        }
    };

    if (!profile) return <div>No Data</div>;

    const { metrics, behaviors, labels } = profile;
    const displayYear = llmConfig.year || new Date().getFullYear();

    const getTimeIcon = (label) => {
        switch (label) {
            case 'Morning': return Sunrise;
            case 'Afternoon': return Sun;
            case 'Evening': return Sunset;
            case 'Night': return Moon;
            default: return Sun;
        }
    };

    const PeakTimeIcon = getTimeIcon(metrics.activity.peak_time?.label);

    return (
        <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 lg:p-12 font-sans selection:bg-purple-500/30">
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
                <div className="absolute top-[10%] left-[10%] w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-5xl mx-auto space-y-12 relative z-10">
                <div className="flex justify-end mb-4">
                    <button
                        onClick={handleShare}
                        disabled={sharing}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        {sharing ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                <span>Generating...</span>
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                <span className="hidden md:inline">Save Image</span>
                                <span className="md:hidden">Save</span>
                            </>
                        )}
                    </button>
                </div>

                <div ref={reportRef} className="p-8 md:p-12 bg-slate-950/50 rounded-[3rem]">

                    <header className="space-y-6 text-center pb-12 relative">
                        {/* 1. Header with Version Tag */}
                        <div className="flex justify-center mb-4">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 text-xs font-mono text-slate-400 border border-white/10 backdrop-blur-sm">
                                <Activity className="w-3 h-3 text-emerald-400" />
                                {profile.profile_version}
                            </div>
                        </div>

                        {/* 2. Main Title */}
                        <div className="space-y-2">
                            <h1 className="text-6xl md:text-8xl font-black tracking-tighter">
                                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                    {displayYear}
                                </span>
                                <span className="block text-white mt-2">{t.yearOfCode}</span>
                            </h1>
                            {/* 3. Username below title */}
                            {viewer && (
                                <div className="text-xl md:text-2xl font-medium text-slate-400">
                                    @{viewer.login}
                                </div>
                            )}
                        </div>

                        {/* 4. One Sentence Summary */}
                        <div className="max-w-3xl mx-auto min-h-[4rem] flex flex-col items-center justify-center space-y-3 pt-4">
                            {generating ? (
                                <>
                                    <div className="flex items-center gap-3 text-slate-400 font-mono text-sm">
                                        <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                                        <span className="animate-pulse">{t.reportGenerating}</span>
                                    </div>
                                    <div className="flex space-x-1.5">
                                        <div className="h-1.5 w-1.5 bg-purple-500/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="h-1.5 w-1.5 bg-purple-500/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="h-1.5 w-1.5 bg-purple-500/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </>
                            ) : (
                                <p className="text-xl md:text-2xl text-slate-200 font-light leading-relaxed px-4">
                                    "{oneSentence || t.generatingSummary}"
                                </p>
                            )}
                        </div>

                        <div className="flex flex-wrap justify-center gap-3">
                            {labels.map(l => (
                                <span key={l} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-medium hover:bg-white/10 hover:border-white/20 transition-all cursor-default flex items-center gap-2">
                                    <Award className="w-4 h-4 text-yellow-500/80" />
                                    {l}
                                </span>
                            ))}
                        </div>
                    </header>

                    {/* Grid Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                        {/* ROW 1: Activity Stats */}
                        <Card>
                            <Metric
                                label={t.activeDays}
                                value={metrics.activity.active_days}
                                subtext={t.activeDaysSubtext}
                                icon={Calendar}
                                color="blue"
                            />
                            <div className="h-1.5 w-full bg-white/5 rounded-full mt-4 overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(metrics.activity.active_days / 365) * 100}%` }}></div>
                            </div>
                        </Card>

                        <Card>
                            <Metric
                                label={t.totalContributions}
                                value={metrics.activity.total_contributions.toLocaleString()}
                                subtext={`${t.peakDay}: ${metrics.activity.peak_day.contributionCount}`}
                                icon={GitCommit}
                                color="green"
                            />
                        </Card>

                        <Card>
                            <Metric
                                label={t.newProjects}
                                value={metrics.activity.created_project_count || 0}
                                subtext={t.newProjectsSubtext}
                                icon={Zap}
                                color="yellow"
                            />
                        </Card>

                        <Card>
                            <Metric
                                label={t.peakTime}
                                value={t[metrics.activity.peak_time?.label] || metrics.activity.peak_time?.label || 'Daytime'}
                                subtext={`${metrics.activity.peak_time?.hour || 0}:00 - ${(metrics.activity.peak_time?.hour || 0) + 1}:00`}
                                icon={PeakTimeIcon}
                                color="orange"
                            />
                        </Card>

                        {/* ROW 2: Languages & Collab */}

                        {/* Top Languages (2 cols) */}
                        <Card className="md:col-span-2">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{t.mostUsedLanguage}</span>
                                <Terminal className="w-5 h-5 text-purple-400" />
                            </div>

                            <div className="space-y-2">
                                {metrics.focus.top_languages && metrics.focus.top_languages.length > 0 ? (
                                    metrics.focus.top_languages.map((lang, idx) => (
                                        <div key={lang.name} className="relative">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <span className={clsx("font-bold text-white", idx === 0 ? "text-xl" : "text-sm text-slate-300")}>
                                                    {lang.name}
                                                </span>
                                                {idx === 0 && <span className="text-[10px] text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded">Primary</span>}
                                            </div>
                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className={clsx("h-full rounded-full", idx === 0 ? "bg-purple-500" : "bg-purple-500/50")}
                                                    style={{ width: `${(lang.size / metrics.focus.top_languages[0].size) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-2xl font-bold text-white">
                                        {metrics.focus.main_language}
                                    </div>
                                )}
                            </div>
                        </Card>

                        <Card>
                            <Metric
                                label={t.codeReviews}
                                value={metrics.collaboration.review_count}
                                subtext={t.reviewsSubtext}
                                icon={MessageSquare}
                                color="pink"
                            />
                        </Card>

                        <Card>
                            <Metric
                                label={t.prsCreated}
                                value={metrics.collaboration.total_prs}
                                subtext={`${(metrics.collaboration.merged_ratio * 100).toFixed(0)}% ${t.mergedRate}`}
                                icon={GitPullRequest}
                                color="indigo"
                            />
                        </Card>

                        {/* ROW 3: Behavior Scores (4 Tiles) */}
                        <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <ScoreTile
                                label={t.focusScore}
                                score={behaviors.focus_score}
                                caption={t.focusCaption}
                                icon={Target}
                                color="emerald"
                            />
                            <ScoreTile
                                label={t.consistency}
                                score={behaviors.consistency_score}
                                caption={t.consistencyCaption}
                                icon={Repeat}
                                color="blue"
                            />
                            <ScoreTile
                                label={t.collaboration}
                                score={behaviors.collaboration_score}
                                caption={t.collaborationCaption}
                                icon={Users}
                                color="pink"
                            />
                            <ScoreTile
                                label={t.burstiness}
                                score={behaviors.burstiness_score}
                                caption={t.burstinessCaption}
                                icon={ZapIcon}
                                color="orange"
                            />
                        </div>


                        {/* ROW 4: Narrative - Full Width */}
                        <Card className="md:col-span-4 bg-gradient-to-br from-white/10 to-white/5 border-white/20">
                            <div className="flex items-center gap-2 mb-6">
                                <Zap className="w-5 h-5 text-amber-400" />
                                <h3 className="text-slate-300 text-sm font-bold uppercase tracking-wider">{t.engineeringNarrative}</h3>
                            </div>
                            <div className="prose prose-invert prose-lg max-w-none">
                                {generating ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 text-slate-400 font-mono text-sm py-2">
                                            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                                            <span className="animate-pulse">{t.reportGenerating}</span>
                                        </div>
                                        <div className="space-y-4 opacity-30">
                                            <div className="h-4 bg-slate-700/50 rounded w-full animate-pulse"></div>
                                            <div className="h-4 bg-slate-700/50 rounded w-11/12 animate-pulse"></div>
                                            <div className="h-4 bg-slate-700/50 rounded w-10/12 animate-pulse"></div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-slate-200 leading-relaxed whitespace-pre-line font-light text-base">
                                        {narrative || t.generatingSummary}
                                    </p>
                                )}
                            </div>
                        </Card>

                    </div>

                    <footer className="flex flex-col items-center justify-center gap-4 py-8 mt-12 border-t border-white/5">
                        <p className="text-slate-500 font-medium text-sm">{t.generatedBy}</p>
                        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6 text-xs font-mono text-slate-600">
                            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                                <Globe className="w-3 h-3 text-blue-400" />
                                <span>{language === 'zh' ? 'yoc.huggingai.cn' : 'yoc-nine.vercel.app'}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                                <Gift className="w-3 h-3 text-purple-400" />
                                <span>yam.gift</span>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
}
