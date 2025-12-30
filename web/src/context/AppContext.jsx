import { createContext, useContext, useState, useCallback } from "react";
import { createClient, fetchViewer } from "../services/github";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [llmConfig, setLlmConfig] = useState({ baseUrl: "", apiKey: "", model: "", language: "en", year: 2025 });
    const [viewer, setViewer] = useState(null);
    const [pipelineState, setPipelineState] = useState({
        status: "idle", // idle, running, completed, error
        step: 0,
        logs: [],
        data: {},
    });
    const [language, setLanguage] = useState('en'); // Default to English

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'zh' ? 'en' : 'zh');
    };

    const login = useCallback(async (userToken) => {
        try {
            const client = createClient(userToken);
            const viewerData = await fetchViewer(client);
            setToken(userToken);
            setViewer(viewerData);
            return true;
        } catch (error) {
            console.error("Login failed:", error);
            return false;
        }
    }, []);

    const value = {
        token,
        llmConfig,
        setLlmConfig,
        viewer,
        pipelineState,
        setPipelineState,
        login,
        language,
        setLanguage,
        toggleLanguage,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);
