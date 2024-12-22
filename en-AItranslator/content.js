let translationDiv = null;

// Define model configurations
const MODEL_CONFIGS = {
    moonshot: {
        name: 'Moonshot',
        apiEndpoint: 'https://api.moonshot.cn/v1/chat/completions',
        formatRequest: (messages, modelVersion) => ({
            model: modelVersion,
            messages: messages,
            temperature: 0.3,
            stream: true
        })
    },
    dashscope: {
        name: 'Qwen',
        apiEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        formatRequest: (messages, modelVersion) => ({
            model: modelVersion,
            messages: messages,
            temperature: 0.3,
            stream: true
        })
    },
    openai: {
        name: 'ChatGPT',
        apiEndpoint: 'https://api.openai.com/v1/chat/completions',
        formatRequest: (messages, modelVersion) => ({
            model: modelVersion,
            messages: messages,
            temperature: 0.3,
            stream: true
        })
    },
    anthropic: {
        name: 'Claude',
        apiEndpoint: 'https://api.anthropic.com/v1/messages',
        formatRequest: (messages, modelVersion) => ({
            model: modelVersion,
            messages: messages.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
            })),
            stream: true
        })
    }
};

// Add styles
const style = document.createElement('style');
style.textContent = `
.ai-translation-popup {
    position: absolute;
    z-index: 10000;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.translation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 8px;
    border-bottom: 1px solid #eee;
    background: #f8f9fa;
    border-radius: 4px 4px 0 0;
}

.translation-header span {
    font-size: 12px;
    color: #666;
}

.close-btn {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    font-size: 14px;
    padding: 2px 6px;
    border-radius: 3px;
}

.close-btn:hover {
    background: #eee;
    color: #333;
}

.translation-result {
    padding: 8px 12px;
    color: #333;
    font-size: 14px;
    line-height: 1.6;
    word-break: break-word;
    min-height: 50px;
    max-height: 400px;
    overflow-y: auto;
}

.loading {
    color: #666;
    font-style: italic;
    padding: 4px;
    font-size: 13px;
}

.error-message {
    color: #dc3545;
    padding: 8px;
    font-size: 13px;
}

.model-tag {
    font-size: 12px;
    color: #888;
    text-align: right;
    padding: 4px 12px 8px;
    border-top: 1px solid #eee;
    font-style: italic;
}

.model-tag span {
    color: #666;
    font-weight: 500;
}

.ai-translation-popup::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

.ai-translation-popup::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
}

.ai-translation-popup::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
}

.ai-translation-popup::-webkit-scrollbar-thumb:hover {
    background: #555;
}
`;

document.head.appendChild(style);

// Listen for messages from background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "translate") {
        const selectedText = request.text;
        showTranslationUI(selectedText);
    }
});

// Language detection function
async function detectLanguage(text) {
    const langPatterns = {
        zh: /[\u4e00-\u9fa5]/,
        ja: /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/,
        ko: /[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f\ua960-\ua97f\ud7b0-\ud7ff]/,
        en: /^[a-zA-Z\s.,!?'"()-]+$/,
        ru: /[\u0400-\u04FF]/,
        de: /[äöüßÄÖÜ]/,
        fr: /[àâçéèêëîïôûùüÿÀÂÇÉÈÊËÎÏÔÛÙÜŸ]/,
        es: /[áéíóúüñÁÉÍÓÚÜÑ]/,
        it: /[àèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ]/,
        pt: /[áâãàçéêíóôõúüÁÂÃÀÇÉÊÍÓÔÕÚÜ]/,
        vi: /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/,
        th: /[\u0E00-\u0E7F]/,
        ar: /[\u0600-\u06FF]/
    };

    // First check for basic English characters
    if (/^[a-zA-Z\s.,!?'"()-]+$/.test(text)) {
        return 'en';
    }

    // Then check other language patterns
    for (const [lang, pattern] of Object.entries(langPatterns)) {
        if (pattern.test(text)) {
            return lang;
        }
    }

    return 'auto';
}

// Show translation UI
function showTranslationUI(text) {
    if (translationDiv) {
        translationDiv.remove();
    }

    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Calculate width
    const maxWidth = Math.min(window.innerWidth * 0.8, 800);
    const minWidth = 300;
    const width = Math.min(Math.max(rect.width, minWidth), maxWidth);

    translationDiv = document.createElement('div');
    translationDiv.className = 'ai-translation-popup';
    translationDiv.innerHTML = `
        <div class="translation-header">
            <span>AI Translation</span>
            <button class="close-btn">×</button>
        </div>
        <div class="translation-result">
            <div class="loading">Translating...</div>
        </div>
    `;

    translationDiv.style.width = `${width}px`;
    document.body.appendChild(translationDiv);

    // Calculate position
    let left = rect.left + window.scrollX;
    const maxLeft = window.innerWidth - width - 20;
    if (left > maxLeft) {
        left = maxLeft;
    }

    const top = rect.bottom + window.scrollY + 5;
    translationDiv.style.position = 'absolute';
    translationDiv.style.top = `${top}px`;
    translationDiv.style.left = `${left}px`;

    // Close button event
    const closeBtn = translationDiv.querySelector('.close-btn');
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        translationDiv.remove();
        translationDiv = null;
    });

    // Click outside to close
    document.addEventListener('click', function closePopup(e) {
        if (translationDiv && !translationDiv.contains(e.target)) {
            translationDiv.remove();
            translationDiv = null;
            document.removeEventListener('click', closePopup);
        }
    });

    // Get settings and perform translation
    chrome.storage.sync.get(['apiKey', 'sourceLang', 'targetLang', 'modelProvider', 'modelVersion'], async (result) => {
        if (!result.apiKey) {
            updateTranslationUI('Please configure your API key in the extension settings');
            return;
        }

        try {
            await translateText(
                text,
                result.apiKey,
                result.sourceLang || 'auto',
                result.targetLang || 'en',
                result.modelProvider || 'openai',
                result.modelVersion || 'gpt-3.5-turbo'
            );
        } catch (error) {
            updateTranslationUI(`Translation failed: ${error.message}`);
        }
    });
}
// Translate text function
async function translateText(text, apiKey, sourceLang = 'auto', targetLang = 'en', modelProvider = 'openai', modelVersion) {
    if (sourceLang === 'auto') {
        sourceLang = await detectLanguage(text);
    }

    if (sourceLang === targetLang) {
        updateTranslationUI(text);
        return;
    }

    const messages = [
        {
            role: "system",
            content: `You are a translation assistant. Please translate the following ${sourceLang} text to ${targetLang}:`
        },
        {
            role: "user",
            content: text
        }
    ];

    try {
        const config = MODEL_CONFIGS[modelProvider];
        if (!config) {
            throw new Error('Unsupported model provider');
        }

        const headers = {
            'Content-Type': 'application/json'
        };

        // Set provider-specific authentication headers
        switch (modelProvider) {
            case 'openai':
                headers['Authorization'] = `Bearer ${apiKey}`;
                break;
            case 'anthropic':
                headers['x-api-key'] = apiKey;
                headers['anthropic-version'] = '2023-06-01';
                break;
            default:
                headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const requestBody = config.formatRequest(messages, modelVersion);
        const response = await fetch(config.apiEndpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Request failed (${response.status}): ${errorText}`);
        }

        const reader = response.body.getReader();
        let translation = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonData = line.slice(6);
                    if (jsonData === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(jsonData);
                        let content;

                        // Parse response based on provider
                        if (modelProvider === 'anthropic') {
                            content = parsed.delta?.text || '';
                        } else {
                            content = parsed.choices[0].delta.content || '';
                        }

                        if (content) {
                            translation += content;
                            updateTranslationUI(translation, modelProvider);
                        }
                    } catch (e) {
                        console.error('Error parsing response:', e);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Translation request failed:', error);
        updateTranslationUI(`Translation failed: ${error.message}`);
    }
}

// Update translation UI
function updateTranslationUI(translatedText, modelProvider = 'openai') {
    if (translationDiv) {
        const resultDiv = translationDiv.querySelector('.translation-result');

        // Remove existing model tag if present
        const existingTag = translationDiv.querySelector('.model-tag');
        if (existingTag) {
            existingTag.remove();
        }

        // Update translation content
        resultDiv.innerHTML = translatedText;

        // Add model tag
        if (MODEL_CONFIGS[modelProvider]) {
            const modelTag = document.createElement('div');
            modelTag.className = 'model-tag';
            modelTag.innerHTML = `Powered by <span>${MODEL_CONFIGS[modelProvider].name}</span>`;
            translationDiv.appendChild(modelTag);
        }
    }
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Alt + T to trigger translation
    if (e.altKey && e.key === 't') {
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
            showTranslationUI(selection.toString().trim());
        }
    }

    // Esc to close translation window
    if (e.key === 'Escape' && translationDiv) {
        translationDiv.remove();
        translationDiv = null;
    }
});