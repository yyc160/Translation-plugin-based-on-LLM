// 定义模型配置
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
    // 初始化函数
    function initializeForm() {
        const modelProvider = document.getElementById('modelProvider').value || 'moonshot';
        updateModelVersions(modelProvider);
        updateApiKeyLabel(modelProvider);
        checkFormValidity();
    }

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
        }

        // 初始化表单
        initializeForm();

        // 设置模型版本（在更新模型列表之后）
        if (result.modelVersion) {
            const modelVersionSelect = document.getElementById('modelVersion');
            setTimeout(() => {
                if (document.querySelector(`option[value="${result.modelVersion}"]`)) {
                    modelVersionSelect.value = result.modelVersion;
                }
            }, 0);
        }
    });

    // 监听模型提供商变化
    document.getElementById('modelProvider').addEventListener('change', (e) => {
        const provider = e.target.value;
        updateModelVersions(provider);
        updateApiKeyLabel(provider);
        checkFormValidity();
    });

    // 监听所有输入变化
    const inputs = ['apiKey', 'sourceLang', 'targetLang', 'modelVersion'];
    inputs.forEach(id => {
        document.getElementById(id).addEventListener('change', checkFormValidity);
        document.getElementById(id).addEventListener('input', checkFormValidity);
    });

    // 更新模型版本列表
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

    // 验证表单
    function checkFormValidity() {
        const apiKey = document.getElementById('apiKey').value.trim();
        const sourceLang = document.getElementById('sourceLang').value;
        const targetLang = document.getElementById('targetLang').value;
        const saveBtn = document.getElementById('saveBtn');

        const isValid = apiKey !== '' &&
            (sourceLang === 'auto' || sourceLang !== targetLang);

        saveBtn.disabled = !isValid;
        saveBtn.style.opacity = isValid ? '1' : '0.5';

        return isValid;
    }

    // API密钥可见性切换
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const apiKeyInput = document.getElementById('apiKey');
            const type = apiKeyInput.getAttribute('type') === 'password' ? 'text' : 'password';
            apiKeyInput.setAttribute('type', type);
            togglePassword.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
        });
    }

    // 保存设置
    document.getElementById('saveBtn').addEventListener('click', () => {
        if (!checkFormValidity()) {
            return;
        }

        const settings = {
            apiKey: document.getElementById('apiKey').value.trim(),
            sourceLang: document.getElementById('sourceLang').value,
            targetLang: document.getElementById('targetLang').value,
            modelProvider: document.getElementById('modelProvider').value,
            modelVersion: document.getElementById('modelVersion').value
        };

        chrome.storage.sync.set(settings, () => {
            const saveBtn = document.getElementById('saveBtn');
            const originalText = saveBtn.textContent;
            saveBtn.textContent = '设置已保存！';
            saveBtn.style.backgroundColor = '#45a049';
            saveBtn.disabled = true;

            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.style.backgroundColor = '#4CAF50';
                saveBtn.disabled = false;
                checkFormValidity();
            }, 2000);
        });
    });

    // 键盘快捷键
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
});