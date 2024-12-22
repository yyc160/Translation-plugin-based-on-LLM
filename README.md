# 🌐 AI Translator Chrome Extension

[English](#english) | [中文](#中文)

## English

### 🚀 Overview

AI Translator is a Chrome browser extension based on large language models,specifically designed to address the chanllenges of reading technial documents across languages.Unlike traditional translation tools,it accurately preserves technical terms and specialized vocabulary while providing natural and contextually relevant translationgs.

### ✨ Features

- 🔍Smart Language Detection:Automatically detects the source language
- 🌍Multiple Language Support:Supports translation between major languages,including Chinese,English,Japanese,Korean,and more
- 💫Convenient UI:Clean and Intuitive Pop-up Translation Interface
- ⌨️Keyboard Shortcuts:
  * `Alt+T`:Quick translate selected text
  * `ESC`:Close translation popup
- 🖱️Right-click Menu Integration:Translate selected text by right-clicking
- ⚙️Customizable Settings:Select Your Preferred source and target language

### 🛠️ Technical Implementation

* Frontend Technologies:

  * Pure Javascript implementation with no framework dependencies
  * CSS for implementing a responsive popup interface
  * Developed according to Chrome Extension Manifest V3 specification

* Core Features:

  * Using the `fetch`API for communication with LLM services
  * Managing setting using the Chrome Storage API
  * Stremed response handling for real-time translation
  * Automatic language detection algorithm

* #### API Integration

  ```javascript
  // Translation request example
  const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
          model: "moonshot-v1-8k",
          messages: messages,
          temperature: 0.3,
          stream: true
      })
  });
  ```

### 🛠️ Configuration

1. Click the extension icon to open the settings
2. Select the model that you need
3. Enter the API key
4. Select the source language and target language
5. Click"Save Settings"

### 📥 Installation

1. Download and unzip the extension
2. Open Chrome and go to `chrome://extensions/`
3. Enable"Developer mode"
4. Click"Load unpacked extension"and select the extension directory

### 📖 Usage

- 👉 Method1:Select the text,right-click,and choose "AI translate"
- ⌨️ Method2:Select the text and press `Alt + T`

------

## 中文

### 🚀 概述

AI Translator 是一款基于大型语言模型的 Chrome 浏览器扩展，专门解决跨语言技术文档阅读的难题。与传统机器翻译工具不同，它能够准确保留技术术语和专业词汇，同时提供自然、符合上下文的翻译结果。

### ✨ 功能特点

- 🔍 **智能语言检测**：自动检测源语言
- 🌍 **多语言支持**：支持中文、英语、日语、韩语等主要语言之间的互译
- 💫 **便捷界面**：清晰直观的弹出式翻译界面
- ⌨️ 快捷键支持:
  - `Alt + T`：快速翻译选中文本
  - `Esc`：关闭翻译窗口
- 🖱️ **右键菜单集成**：右键选中文本即可翻译
- ⚙️ **自定义设置**：可选择偏好的源语言和目标语言

### 🛠️ 技术实现

- 前端技术：

  - 纯 JavaScript 实现，无框架依赖
  - CSS 实现响应式弹窗界面
  - 采用 Chrome Extension Manifest V3 规范

- 核心功能：

  - 使用 `fetch` API 进行 LLM 服务通信
  - 使用 Chrome Storage API 管理设置
  - 流式响应处理实现实时翻译
  - 自动检测语言算法

- **API 集成**：

  ```javascript
  // 翻译请求示例
  const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
          model: "moonshot-v1-8k",
          messages: messages,
          temperature: 0.3,
          stream: true
      })
  });
  ```

### 📥 安装方法

1. 下载并解压扩展程序
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"，选择扩展程序目录

### 🛠️ 配置说明

1. 点击扩展图标打开设置
2. 选择需要使用的模型
3. 输入 API 密钥
4. 选择源语言和目标语言
5. 点击"保存设置"

### 📖 使用方法

- 👉 **方式一**：选中文本，右键点击，选择"AI 翻译"
- ⌨️ **方式二**：选中文本，按 `Alt + T`
