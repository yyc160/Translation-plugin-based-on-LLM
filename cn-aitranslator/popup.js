// popup.js
const MODEL_CONFIGS = {
    moonshot: {
        name: '月之暗面',
        models: {
            'moonshot-v1-8k': 'Moonshot 8K',
            'moonshot-v1-32k': 'Moonshot 32K',
            'moonshot-v1-128k': 'Moonshot 128K'
        },
        apiEndpoint: 'https://api.moonshot.cn/v1/chat/completions'
    },
    dashscope: {
        name: '通义千问',
        models: {
            'qwen-plus': 'Qwen Plus',
            'qwen-max': 'Qwen Max',
            'qwen-turbo': 'Qwen Turbo',
            'qwen2.5-72b-instruct': 'Qwen 2.5 72B',
            'qwen2.5-32b-instruct': 'Qwen 2.5 32B',
            'qwen2.5-14b-instruct': 'Qwen 2.5 14B',
            'qwen2.5-7b-instruct': 'Qwen 2.5 7B'
        },
        apiEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
    },
    openai: {
        name: 'ChatGPT',
        models: {
            'gpt-4': 'GPT-4',
            'gpt-4-turbo-preview': 'GPT-4 Turbo',
            'gpt-3.5-turbo': 'GPT-3.5 Turbo'
        },
        apiEndpoint: 'https://api.openai.com/v1/chat/completions'
    },
    anthropic: {
        name: 'Claude',
        models: {
            'claude-3-opus-20240229': 'Claude 3 Opus',
            'claude-3-sonnet-20240229': 'Claude 3 Sonnet',
            'claude-3-haiku-20240307': 'Claude 3 Haiku',
            'claude-2.1': 'Claude 2.1'
        },
        apiEndpoint: 'https://api.anthropic.com/v1/messages'
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // 加载保存的设置
    chrome.storage.sync.get(['apiKey', 'sourceLang', 'targetLang', 'modelProvider', 'modelVersion'], (result) => {
        if (result.apiKey) {
            document.getElementById('apiKey').value = result.apiKey;
        }
        if (result.sourceLang) {
            document.getElementById('sourceLang').value = result.sourceLang;
        }
        if (result.targetLang) {
            document.getElementById('targetLang').value = result.targetLang;
        }
        if (result.modelProvider) {
            document.getElementById('modelProvider').value = result.modelProvider;
            updateModelVersions(result.modelProvider);
        }
        if (result.modelVersion && document.querySelector(`option[value="${result.modelVersion}"]`)) {
            document.getElementById('modelVersion').value = result.modelVersion;
        }

        // 初始化时更新API密钥标签
        updateApiKeyLabel(result.modelProvider);
    });

    // 监听模型提供商选择变化
    document.getElementById('modelProvider').addEventListener('change', (e) => {
        const provider = e.target.value;
        updateModelVersions(provider);
        updateApiKeyLabel(provider);
    });

    // 监听源语言和目标语言的变化
    document.getElementById('sourceLang').addEventListener('change', validateLanguageSelection);
    document.getElementById('targetLang').addEventListener('change', validateLanguageSelection);

    // 更新模型版本选项
    function updateModelVersions(provider) {
        const modelVersionSelect = document.getElementById('modelVersion');
        modelVersionSelect.innerHTML = '';

        const models = MODEL_CONFIGS[provider].models;
        Object.entries(models).forEach(([value, label]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            modelVersionSelect.appendChild(option);
        });
    }

    // 更新API密钥标签
    function updateApiKeyLabel(provider) {
        const apiKeyInput = document.getElementById('apiKey');
        const apiKeyLabel = document.querySelector('label[for="apiKey"]');

        if (provider && MODEL_CONFIGS[provider]) {
            const providerName = MODEL_CONFIGS[provider].name;
            apiKeyLabel.textContent = `${providerName} API密钥:`;
            apiKeyInput.placeholder = `请输入${providerName} API密钥`;
        }
    }

    // 验证语言选择
    function validateLanguageSelection() {
        const sourceLang = document.getElementById('sourceLang').value;
        const targetLang = document.getElementById('targetLang').value;
        const saveBtn = document.getElementById('saveBtn');

        if (sourceLang !== 'auto' && sourceLang === targetLang) {
            alert('源语言和目标语言不能相同');
            saveBtn.disabled = true;
            saveBtn.style.opacity = '0.5';
        } else {
            saveBtn.disabled = false;
            saveBtn.style.opacity = '1';
        }
    }

    // 添加语言交换按钮事件
    const swapButton = document.getElementById('swapLang');
    if (swapButton) {
        swapButton.addEventListener('click', () => {
            const sourceLang = document.getElementById('sourceLang');
            const targetLang = document.getElementById('targetLang');

            // 只在源语言不是auto时才交换
            if (sourceLang.value !== 'auto') {
                const temp = sourceLang.value;
                sourceLang.value = targetLang.value;
                targetLang.value = temp;
            }
        });
    }

    // 显示/隐藏API密钥
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const apiKeyInput = document.getElementById('apiKey');
            const type = apiKeyInput.getAttribute('type') === 'password' ? 'text' : 'password';
            apiKeyInput.setAttribute('type', type);
            togglePassword.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
        });
    }

    // API密钥输入验证
    document.getElementById('apiKey').addEventListener('input', (e) => {
        const apiKey = e.target.value.trim();
        const saveBtn = document.getElementById('saveBtn');

        if (apiKey === '') {
            saveBtn.disabled = true;
            saveBtn.style.opacity = '0.5';
        } else {
            saveBtn.disabled = false;
            saveBtn.style.opacity = '1';
        }
    });

    // 保存设置
    document.getElementById('saveBtn').addEventListener('click', () => {
        const apiKey = document.getElementById('apiKey').value.trim();
        const sourceLang = document.getElementById('sourceLang').value;
        const targetLang = document.getElementById('targetLang').value;
        const modelProvider = document.getElementById('modelProvider').value;
        const modelVersion = document.getElementById('modelVersion').value;

        // 验证API密钥
        if (!apiKey) {
            alert('请输入API密钥');
            return;
        }

        // 验证语言选择
        if (sourceLang !== 'auto' && sourceLang === targetLang) {
            alert('源语言和目标语言不能相同');
            return;
        }

        // 保存设置到storage
        chrome.storage.sync.set({
            apiKey: apiKey,
            sourceLang: sourceLang,
            targetLang: targetLang,
            modelProvider: modelProvider,
            modelVersion: modelVersion
        }, () => {
            // 显示保存成功提示
            const saveBtn = document.getElementById('saveBtn');
            const originalText = saveBtn.textContent;
            saveBtn.textContent = '保存成功！';
            saveBtn.style.backgroundColor = '#45a049';
            saveBtn.disabled = true;

            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.style.backgroundColor = '#4CAF50';
                saveBtn.disabled = false;
            }, 2000);
        });
    });

    // 添加键盘快捷键
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + S 保存设置
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            const saveBtn = document.getElementById('saveBtn');
            if (!saveBtn.disabled) {
                saveBtn.click();
            }
        }

        // Esc 关闭弹窗
        if (e.key === 'Escape') {
            window.close();
        }
    });

    // 初始状态检查
    function checkInitialState() {
        const apiKey = document.getElementById('apiKey').value.trim();
        const saveBtn = document.getElementById('saveBtn');

        if (!apiKey) {
            saveBtn.disabled = true;
            saveBtn.style.opacity = '0.5';
        }
    }

    // 执行初始状态检查
    checkInitialState();

    // 错误处理函数
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }
});