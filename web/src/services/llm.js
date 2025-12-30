
export const SYSTEM_PROMPT = `
You are a professional technical analyst and writer.

Your task is to explain a developer’s yearly GitHub activity
based strictly on a provided structured profile JSON.

Rules:
- Do NOT invent facts, metrics, or labels.
- Do NOT challenge or reinterpret the provided labels.
- Do NOT infer motivations, personality traits, or skills beyond the data.
- Use only the information explicitly present in the JSON.
- If information is missing, remain silent about it.

Your writing must be:
- Factual
- Neutral to mildly reflective
- Professional, not promotional
`;

export const PROMPTS = {
    MAIN_NARRATIVE: `
Based on the following developer profile JSON, write a concise
annual narrative (around 120 words) describing the developer’s
working style and activity patterns during the year.

Focus on:
- Activity rhythm
- Project focus
- Collaboration behavior
- Notable shifts or emphases

Do not summarize metrics mechanically.
Do not provide advice.
Do not speculate beyond the data.

Profile JSON:
{{PROFILE_JSON}}
`,
    ONE_SENTENCE: `
Based on the provided profile JSON, generate ONE concise sentence
(20 words or fewer) that captures the defining characteristic of
the developer’s year.

Constraints:
- Must align exactly with the provided labels.
- Neutral tone.
- No emojis, no hype language.

Profile JSON:
{{PROFILE_JSON}}
`
};

export const generateNarrative = async (config, profile, promptType) => {
    const { baseUrl, apiKey, model = "gpt-4o", language = "en" } = config;

    if (!baseUrl || !apiKey) {
        throw new Error("Missing LLM Configuration");
    }

    let userPrompt = PROMPTS[promptType].replace('{{PROFILE_JSON}}', JSON.stringify(profile, null, 2));

    // Add language instruction for Chinese
    if (language === 'zh') {
        userPrompt += '\n\n请用中文输出。';
    }

    try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`LLM Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();

    } catch (error) {
        console.error("LLM Generation Failed:", error);
        throw error;
    }
};
