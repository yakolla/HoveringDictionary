chrome.tabs.onUpdated.addListener(function () {
        
    chrome.tabs.executeScript(null, { file: "t.js" }, function () { });
    
});
