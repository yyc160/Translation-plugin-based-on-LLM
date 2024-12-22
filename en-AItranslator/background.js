chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "translateSelection",
        title: "Translate Selection",
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