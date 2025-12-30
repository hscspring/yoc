import { useEffect } from 'react';
import { useApp } from './context/AppContext';
import { usePipeline } from './hooks/usePipeline';
import InputScreen from './components/InputScreen';
import LoadingScreen from './components/LoadingScreen';
import ReportScreen from './components/ReportScreen';
import { translations } from './i18n/translations';

function App() {
  const { viewer, pipelineState, language } = useApp();
  const { run } = usePipeline();
  const t = translations[language] || translations['en'];

  // Auto-start pipeline when user is logged in
  useEffect(() => {
    if (viewer && pipelineState.status === 'idle') {
      run();
    }
  }, [viewer, pipelineState.status, run]);

  if (!viewer) {
    return <InputScreen />;
  }

  if (pipelineState.status === 'running' || pipelineState.status === 'idle') {
    return <LoadingScreen status={pipelineState.status} step={pipelineState.step} logs={pipelineState.logs} />;
  }

  if (pipelineState.status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-red-500 p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">{t.pipelineError}</h2>
        <div className="bg-neutral-900 p-4 rounded border border-red-900/50 max-w-2xl font-mono text-sm overflow-auto">
          {pipelineState.logs.map((l, i) => <div key={i}>{l}</div>)}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-8 px-4 py-2 bg-neutral-800 text-white rounded hover:bg-neutral-700"
        >
          {t.retry}
        </button>
      </div>
    );
  }

  return <ReportScreen />;
}

export default App;
