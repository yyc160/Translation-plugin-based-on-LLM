const MODEL_CONFIGS = {
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
    },
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
    }
};

document.addEventListener('DOMContentLoaded', () => {
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
            updateModelVersions(result.modelProvider);
        }
        if (result.modelVersion && document.querySelector(`option[value="${result.modelVersion}"]`)) {
            document.getElementById('modelVersion').value = result.modelVersion;
        }

        // Initialize API key label
        updateApiKeyLabel(result.modelProvider);
    });

    // Listen for model provider changes
    document.getElementById('modelProvider').addEventListener('change', (e) => {
        const provider = e.target.value;
        updateModelVersions(provider);
        updateApiKeyLabel(provider);
    });

    // Listen for language selection changes
    document.getElementById('sourceLang').addEventListener('change', validateLanguageSelection);
    document.getElementById('targetLang').addEventListener('change', validateLanguageSelection);

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

    // Language selection validation
    function validateLanguageSelection() {
        const sourceLang = document.getElementById('sourceLang').value;
        const targetLang = document.getElementById('targetLang').value;
        const saveBtn = document.getElementById('saveBtn');

        if (sourceLang !== 'auto' && sourceLang === targetLang) {
            alert('Source and target languages cannot be the same');
            saveBtn.disabled = true;
            saveBtn.style.opacity = '0.5';
        } else {
            saveBtn.disabled = false;
            saveBtn.style.opacity = '1';
        }
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

    // API key input validation
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

    // Save settings
    document.getElementById('saveBtn').addEventListener('click', () => {
        const apiKey = document.getElementById('apiKey').value.trim();
        const sourceLang = document.getElementById('sourceLang').value;
        const targetLang = document.getElementById('targetLang').value;
        const modelProvider = document.getElementById('modelProvider').value;
        const modelVersion = document.getElementById('modelVersion').value;

        // Validate API key
        if (!apiKey) {
            alert('Please enter an API key');
            return;
        }

        // Validate language selection
        if (sourceLang !== 'auto' && sourceLang === targetLang) {
            alert('Source and target languages cannot be the same');
            return;
        }

        // Save settings to storage
        chrome.storage.sync.set({
            apiKey: apiKey,
            sourceLang: sourceLang,
            targetLang: targetLang,
            modelProvider: modelProvider,
            modelVersion: modelVersion
        }, () => {
            // Show success message
            const saveBtn = document.getElementById('saveBtn');
            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'Settings Saved!';
            saveBtn.style.backgroundColor = '#45a049';
            saveBtn.disabled = true;

            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.style.backgroundColor = '#4CAF50';
                saveBtn.disabled = false;
            }, 2000);
        });
    });

    // Add keyboard shortcuts
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

    // Initial state check
    function checkInitialState() {
        const apiKey = document.getElementById('apiKey').value.trim();
        const saveBtn = document.getElementById('saveBtn');

        if (!apiKey) {
            saveBtn.disabled = true;
            saveBtn.style.opacity = '0.5';
        }
    }

    // Error handling function
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }

    // Run initial state check
    checkInitialState();
});