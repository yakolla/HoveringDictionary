
// Set up context menu at install time.
chrome.runtime.onInstalled.addListener(
    function () {

        var context = "selection";
        var title = "Cool-ToolTip Translate '%s'";

        var id = chrome.contextMenus.create({
            "title": title, "contexts": [context],
            "id": "context" + context
        });        
    }    
);

var contents_port;

chrome.runtime.onConnect.addListener(function (port) {
    contents_port = port;   
})

chrome.runtime.onMessage.addListener(
function (request, sender, sendResponse) {
    if (request.url != null) {
        
        $.get(request.url, function (data) {

            sendResponse(data);  // 응답을 보냄    

        }).fail(function () {

        });
    }
    return true;
})

// add click event
chrome.contextMenus.onClicked.addListener(
    function (info, tab) {
        var sText = info.selectionText;
        contents_port.postMessage({ greeting: sText });
    }
);
