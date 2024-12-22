chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "translateSelection",
        title: "AI翻译所选文本",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "translateSelection") {
        chrome.tabs.sendMessage(tab.id, {
            action: "translate",
            text: info.selectionText
        });
    }
});
