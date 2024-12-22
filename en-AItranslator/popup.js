// Model configurations
const MODEL_CONFIGS = {
    moonshot: {
        name: 'Moonshot',
        models: {
            'moonshot-v1-8k': 'Moonshot 8K',
            'moonshot-v1-32k': 'Moonshot 32K',
            'moonshot-v1-128k': 'Moonshot 128K'
        },
        apiEndpoint: 'https://api.moonshot.cn/v1/chat/completions'
    },
    dashscope: {
        name: 'Qwen',
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
    // Initialize form function
    function initializeForm() {
        const modelProvider = document.getElementById('modelProvider').value || 'moonshot';
        updateModelVersions(modelProvider);
        updateApiKeyLabel(modelProvider);
        checkFormValidity();
    }

    // Load saved settings
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

        // Initialize form
        initializeForm();

        // Set model version (after updating model list)
        if (result.modelVersion) {
            const modelVersionSelect = document.getElementById('modelVersion');
            setTimeout(() => {
                if (document.querySelector(`option[value="${result.modelVersion}"]`)) {
                    modelVersionSelect.value = result.modelVersion;
                }
            }, 0);
        }
    });

    // Listen for model provider changes
    document.getElementById('modelProvider').addEventListener('change', (e) => {
        const provider = e.target.value;
        updateModelVersions(provider);
        updateApiKeyLabel(provider);
        checkFormValidity();
    });

    // Listen for all input changes
    const inputs = ['apiKey', 'sourceLang', 'targetLang', 'modelVersion'];
    inputs.forEach(id => {
        document.getElementById(id).addEventListener('change', checkFormValidity);
        document.getElementById(id).addEventListener('input', checkFormValidity);
    });

    // Update model versions function
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

    // Update API key label function
    function updateApiKeyLabel(provider) {
        const apiKeyInput = document.getElementById('apiKey');
        const apiKeyLabel = document.querySelector('label[for="apiKey"]');

        if (provider && MODEL_CONFIGS[provider]) {
            const providerName = MODEL_CONFIGS[provider].name;
            apiKeyLabel.textContent = `${providerName} API Key:`;
            apiKeyInput.placeholder = `Enter your ${providerName} API key`;
        }
    }

    // Form validation function
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

    // Toggle password visibility
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const apiKeyInput = document.getElementById('apiKey');
            const type = apiKeyInput.getAttribute('type') === 'password' ? 'text' : 'password';
            apiKeyInput.setAttribute('type', type);
            togglePassword.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
        });
    }

    // Save settings
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
            saveBtn.textContent = 'Settings Saved!';
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

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + S to save settings
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            const saveBtn = document.getElementById('saveBtn');
            if (!saveBtn.disabled) {
                saveBtn.click();
            }
        }

        // Esc to close popup
        if (e.key === 'Escape') {
            window.close();
        }
    });
});