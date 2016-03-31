var onOff = true;
var title = "Cool-ToolTip Translate";

// Set up context menu at install time.
chrome.runtime.onInstalled.addListener(
    function () {
        /*
        chrome.contextMenus.create({
            title: title + " " + (onOff == true ? "On" : "Off"),
            contexts: ["all"],
            id: "1"
        });
        */
       chrome.contextMenus.create({
            title: title + " '%s'",
            contexts: ["selection"],
            id: "2"
        });  
    }    
);
/*
var contents_port;
chrome.runtime.onConnect.addListener(function (port) {
    contents_port = port;
    console.debug(port);
})
*/
chrome.runtime.onMessage.addListener(
function (request, sender, sendResponse) {
    if (request.url != null) {
        $.get(request.url, function (data) {

            sendResponse(data);  // 응답을 보냄    

        }).fail(function () {

        });
        
        /*
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("GET", request.url, false);
        xmlHttp.send();
        sendResponse( xmlHttp.responseText);*/
        return true;
    }

    sendResponse("");
   
    return true;
})

// add click event

chrome.contextMenus.onClicked.addListener(
    function (info, tab) {
       
        if (info.menuItemId == "1") {
            
            translateOnOff(info, tab);
        }
        else if (info.menuItemId == "2") {
            translateSelectedText(info, tab);
        }
        
    }
);

function translateOnOff(info, tab) {
    
    onOff = !onOff;
       
    chrome.contextMenus.update(info.menuItemId, {
        title: title + " " + (onOff == true ? "On" : "Off")
    });
    
    contents_port.postMessage({ id: 2, on: onOff });
    
}

function translateSelectedText(info, tab) {
    var sText = info.selectionText;
    //contents_port.postMessage({ id: 1, greeting: sText });
    doInCurrentTab(function (tab) {
        chrome.tabs.sendMessage(tab.id, { id: 1, greeting: sText }, function (response) { });
    });
}

function doInCurrentTab(tabCallback) {
    chrome.tabs.query(
        { currentWindow: true, active: true },
        function (tabArray) { tabCallback(tabArray[0]); }
    );
}