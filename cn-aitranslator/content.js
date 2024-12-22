let translationDiv = null;

// 定义模型配置
const MODEL_CONFIGS = {
    moonshot: {
        name: '月之暗面',
        apiEndpoint: 'https://api.moonshot.cn/v1/chat/completions',
        formatRequest: (messages, modelVersion) => ({
            model: modelVersion,
            messages: messages,
            temperature: 0.3,
            stream: true
        })
    },
    dashscope: {
        name: '通义千问',
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

// 添加样式
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

// 监听来自background的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "translate") {
        const selectedText = request.text;
        showTranslationUI(selectedText);
    }
});

// 语言检测函数
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

    // 首先检查是否只包含基本的英文字符
    if (/^[a-zA-Z\s.,!?'"()-]+$/.test(text)) {
        return 'en';
    }

    // 然后检查其他语言特征
    for (const [lang, pattern] of Object.entries(langPatterns)) {
        if (pattern.test(text)) {
            return lang;
        }
    }

    return 'auto';
}

// 显示翻译UI
function showTranslationUI(text) {
    if (translationDiv) {
        translationDiv.remove();
    }

    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // 计算宽度
    const maxWidth = Math.min(window.innerWidth * 0.8, 800);
    const minWidth = 300;
    const width = Math.min(Math.max(rect.width, minWidth), maxWidth);

    translationDiv = document.createElement('div');
    translationDiv.className = 'ai-translation-popup';
    translationDiv.innerHTML = `
        <div class="translation-header">
            <span>AI翻译</span>
            <button class="close-btn">×</button>
        </div>
        <div class="translation-result">
            <div class="loading">正在翻译...</div>
        </div>
    `;

    translationDiv.style.width = `${width}px`;
    document.body.appendChild(translationDiv);

    // 计算位置
    let left = rect.left + window.scrollX;
    const maxLeft = window.innerWidth - width - 20;
    if (left > maxLeft) {
        left = maxLeft;
    }

    const top = rect.bottom + window.scrollY + 5;
    translationDiv.style.position = 'absolute';
    translationDiv.style.top = `${top}px`;
    translationDiv.style.left = `${left}px`;

    // 关闭按钮事件
    const closeBtn = translationDiv.querySelector('.close-btn');
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        translationDiv.remove();
        translationDiv = null;
    });

    // 点击外部关闭
    document.addEventListener('click', function closePopup(e) {
        if (translationDiv && !translationDiv.contains(e.target)) {
            translationDiv.remove();
            translationDiv = null;
            document.removeEventListener('click', closePopup);
        }
    });

    // 获取设置并执行翻译
    chrome.storage.sync.get(['apiKey', 'sourceLang', 'targetLang', 'modelProvider', 'modelVersion'], async (result) => {
        if (!result.apiKey) {
            updateTranslationUI('请先在扩展设置中配置API密钥');
            return;
        }

        try {
            await translateText(
                text,
                result.apiKey,
                result.sourceLang || 'auto',
                result.targetLang || 'zh',
                result.modelProvider || 'moonshot',
                result.modelVersion || 'moonshot-v1-8k'
            );
        } catch (error) {
            updateTranslationUI(`翻译失败: ${error.message}`);
        }
    });
}

// 翻译文本函数
async function translateText(text, apiKey, sourceLang = 'auto', targetLang = 'zh', modelProvider = 'moonshot', modelVersion) {
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
            content: `你是一个翻译助手。请将以下${sourceLang}文本翻译成${targetLang}：`
        },
        {
            role: "user",
            content: text
        }
    ];

    try {
        const config = MODEL_CONFIGS[modelProvider];
        if (!config) {
            throw new Error('不支持的模型提供商');
        }

        const headers = {
            'Content-Type': 'application/json'
        };

        // 根据不同提供商设置认证头
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
            throw new Error(`请求失败 (${response.status}): ${errorText}`);
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

                        // 根据不同的提供商解析响应内容
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
                        console.error('解析响应出错:', e);
                    }
                }
            }
        }
    } catch (error) {
        console.error('翻译请求失败:', error);
        updateTranslationUI(`翻译失败: ${error.message}`);
    }
}

// 更新翻译UI
function updateTranslationUI(translatedText, modelProvider = 'moonshot') {
    if (translationDiv) {
        const resultDiv = translationDiv.querySelector('.translation-result');

        // 如果已存在模型标签,先移除
        const existingTag = translationDiv.querySelector('.model-tag');
        if (existingTag) {
            existingTag.remove();
        }

        // 更新翻译内容
        resultDiv.innerHTML = translatedText;

        // 添加模型标签
        if (MODEL_CONFIGS[modelProvider]) {
            const modelTag = document.createElement('div');
            modelTag.className = 'model-tag';
            modelTag.innerHTML = `Powered by <span>${MODEL_CONFIGS[modelProvider].name}</span>`;
            translationDiv.appendChild(modelTag);
        }
    }
}

// 添加键盘快捷键
document.addEventListener('keydown', (e) => {
    // Alt + T 触发翻译
    if (e.altKey && e.key === 't') {
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
            showTranslationUI(selection.toString().trim());
        }
    }
    // Esc 关闭翻译窗口
    if (e.key === 'Escape' && translationDiv) {
        translationDiv.remove();
        translationDiv = null;
    }
});