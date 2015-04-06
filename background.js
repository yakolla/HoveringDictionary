var debug = false;
var wordForDebug = null;
var mouseX = 0, mouseY = 0, mouseTarget = null, mousePageX = 0, mousePageY = 0, mousePressed = 0;
var oldWord = null;
var loading = false;
var focusIframe = null;


function getWordAtPoint(elem, x, y) {
    if (elem == null)
        return null;

    if (elem.nodeType == elem.TEXT_NODE) {

        var range = elem.ownerDocument.createRange();

        range.selectNodeContents(elem);
        var currentPos = 0;
        var endPos = range.endOffset;

        while (currentPos < endPos) {
            range.setStart(elem, currentPos);
            range.setEnd(elem, currentPos + 1);
            var rect = range.getBoundingClientRect();
            if (rect.left <= x && rect.right >= x &&
               rect.top <= y && rect.bottom >= y) {
                range.expand("word");
                var ret = range.toString();
                //range.detach();

                return (ret);
            }

            currentPos += 1;
        }
    } else {
        for (var i = 0; i < elem.childNodes.length; i++) {
            var range = elem.childNodes[i].ownerDocument.createRange();
            range.selectNodeContents(elem.childNodes[i]);
            var rect = range.getBoundingClientRect();
            if (rect.left <= x && rect.right >= x &&
               rect.top <= y && rect.bottom >= y) {
                //range.detach();
                return (getWordAtPoint(elem.childNodes[i], x, y));
            } else {
                //range.detach();
            }
        }
    }
    return (null);
}

function getSelectedWord() {
    if (focusIframe) {
        var word = getSelectedTextFromIFrame(focusIframe);
        if (word != null) {
           return word;
        }
    }
    
    if (window.getSelection) {
        return window.getSelection();
    } else if (document.getSelection) {
        return document.getSelection();
    } else if (document.selection) {
        return document.selection.createRange();
    }
    return '';
}

function getSelectedTextFromIFrame(frame) {
    // In ExtJS use: 
    // var frame = Ext.getDom(frameId); 


    var frameWindow = frame && frame.contentWindow;
    var frameDocument = frameWindow && frameWindow.document;

    if (frameDocument) {
        if (frameDocument.getSelection) {
            // Most browsers 
            return frameDocument.getSelection();
        }
        else if (frameDocument.selection) {
            // Internet Explorer 8 and below 
            return frameDocument.selection.createRange();
        }
        else if (frameWindow.getSelection) {
            // Safari 3 
            return frameWindow.getSelection();
        }
    }

    /* Fall-through. This could happen if this function is called 
       on a frame that doesn't exist or that isn't ready yet. */
    return null;
}

function isInSelectedTextArea(x, y) {
    if (mousePressed != 0)
        return false;

    var s = getSelectedWord();

    if (s == null)
        return false;

    var oRange = s.getRangeAt(0); //get the text range
    var oRect = oRange.getBoundingClientRect();

    if (oRect.left <= x && oRect.right >= x &&
         oRect.top <= y && oRect.bottom >= y) {
        return true;
    }

    return false;
}


function onMouseMove(e) {
    mouseX = e.clientX,
    mouseY = e.clientY;
    
    mousePressed = e.which;
    mouseTarget = e.target;

    var height = mouseTarget.ownerDocument.documentElement.clientHeight;
    var width = mouseTarget.ownerDocument.documentElement.clientWidth;
    
    var toolbarHeight = window.outerHeight - window.innerHeight;
    var toolbarWidth = window.outerWidth - window.innerWidth;

    //mousePageX = (e.screenX - window.screenX) / (window.outerWidth) * 100;
    //mousePageY = (e.screenY - window.screenY) / (window.outerHeight) * 100;

    mousePageX = (mouseX) / (width) * 100;
    mousePageY = (mouseY) / (height) * 100;
    
    if (debug == true) {
        $('#ylog').html('<p>x:' + parseInt(mousePageX) + ', y:' + parseInt(mousePageY) + ', word:' + wordForDebug + ', target:' + width);
    }
}

window.onmousemove = onMouseMove;


var maxMeaning = 3;
function parseKoreanEnglish(word) {

    var meaningCount = 0;
    $("#dicRawData .fnt_e11").remove();
    // extract data
    var phoneticSymbol = $("#dicRawData .t2:first").text();
    var meaning = '';

    $("#dicRawData .list_ex1 .first").each(function () {
        if (meaningCount >= maxMeaning)
            return;

        meaning += '*' + '<strong>' + $(this).text() + '</strong></br>';
        meaningCount++;
    });

    if (meaning.length) {

    }
    else {
        return null;
    }

    return word + ' ' +
             phoneticSymbol + '</br>' +
             meaning;
}

function parseChiness(word) {


    var jdata = JSON.parse($("#dicRawData").text());
    var meaningCount = 0;
    // extract data
    var phoneticSymbol = '[' + jdata.pinyin + ']';
    if (jdata.pinyin == null)
        phoneticSymbol = '';

    var meaning = '';

    for (var meaningCount in jdata.mean) {
        if (meaningCount >= maxMeaning)
            return;

        meaning += '*' + '<strong>' + jdata.mean[meaningCount] + '</strong></br>';

    }

    if (meaning.length) {

    }
    else {
        return null;
    }

    return word + ' ' +
             phoneticSymbol + '</br>' +
             meaning;
}

function parseJapaness(word) {


    var jdata = JSON.parse($("#dicRawData").text());
    var meaningCount = 0;
    // extract data
    var phoneticSymbol = '[' + jdata.pinyin + ']';
    if (jdata.pinyin == null)
        phoneticSymbol = '';

    var meaning = '';

    for (var meaningCount in jdata.mean) {
        if (meaningCount >= maxMeaning)
            return;

        meaning += '*' + '<strong>' + jdata.mean[meaningCount] + '</strong></br>';

    }

    if (meaning.length) {

    }
    else {
        return null;
    }

    return word + ' ' +
             phoneticSymbol + '</br>' +
             meaning;
}

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

function loadXMLDoc(word) {

    if (loading == true)
        return;
    loading = true;

    var url = "http://endic.naver.com/searchAssistDict.nhn?query=" + encodeURI(word, "UTF-8");
    var parser = parseKoreanEnglish;
    guessLanguage.detect(word, function (language) {
        if (language == 'zh') {
            url = "http://tooltip.dic.naver.com/tooltip.nhn?languageCode=1&nlp=false&wordString=" + encodeURI(word, "UTF-8");
            parser = parseChiness;
        }
        else if (language == 'ja') {
            url = "http://tooltip.dic.naver.com/tooltip.nhn?languageCode=2&nlp=false&wordString=" + encodeURI(word, "UTF-8");
            parser = parseJapaness;
        }

    });

    if (!chrome.runtime) {
        // Chrome 20-21
        chrome.runtime = chrome.extension;
    } else if (!chrome.runtime.onMessage) {
        // Chrome 22-25
        chrome.runtime.onMessage = chrome.extension.onMessage;
        chrome.runtime.sendMessage = chrome.extension.sendMessage;
        chrome.runtime.onConnect = chrome.extension.onConnect;
        chrome.runtime.connect = chrome.extension.connect;
    }

    // https 호출할 때, 보안오류 발생하는걸 우회
    chrome.runtime.sendMessage(null, { url: url }, null, function (data) {

        // 응답 처리
        // store dic data to easy
        $("#dicRawData").html(data);

        var parsedData = parser(word);

        if (parsedData == null)
        {
            $('#dicLayer').hide();
        }
        else
        {
            $("#dicLayer").html(parsedData);
            $('#dicLayer').show();
        }

        loading = false;

    });

}
function createDicionaryLayer() {
    $("<style type='text/css' id='dicLayerArc' />").appendTo("head");

    var myLayer = document.createElement('div');
    myLayer.id = 'dicLayer';
    document.body.appendChild(myLayer);
}

function createDicionaryRawData() {
    var myLayer = document.createElement('div');
    myLayer.id = 'dicRawData';
    myLayer.style.display = 'none';

    document.body.appendChild(myLayer);
}

function createLogDiv() {
    var myLayer = document.createElement('div');
    myLayer.id = 'ylog';
    document.body.appendChild(myLayer);
}

function checkWord() {
    var x = mouseX,
        y = mouseY
    target = mouseTarget;
         
    var selWord = getSelectedWord().toString();
    var word = getWordAtPoint(target, x, y);
    

    if (selWord.length) {
        word = null;
        if (isInSelectedTextArea(x, y))
            word = selWord;

    }

    wordForDebug = word;

    if (word) {
        word = word.trim();
        if (oldWord == word)
            return;

        var dicLayer = $("#dicLayer");

        //dicLayer.css("left", mousePageX + 'vw');
        //dicLayer.css("top", (mousePageY+1) + 'vh');

        dicLayer.css("left", mouseX + 'px');
        dicLayer.css("top", (mouseY+20) + 'px');

        loadXMLDoc(word);
    }
    else {
        $('#dicLayer').hide();
    }


    oldWord = word;
}

function loadOptions() {
    var keys = ["fontSize", "fontType", "fontBold"
                     , "fontColor", "backColor1"
                     , "backColor2", "delayedTime"];  // 불러올 항목들의 이름


    chrome.storage.local.get(keys, function (options) {

        if (!options["fontSize"]) {

            setInterval(function () { checkWord() }, 90);
            return;
        }

        var dicLayer = $("#dicLayer");

        dicLayer.css('color', '#' + options['fontColor']);
        dicLayer.css('font-size', options["fontSize"] + 'px');
        dicLayer.css('font-family', options["fontType"]);
        dicLayer.css('background', '-webkit-linear-gradient(bottom, ' + '#' + options['backColor2'] + ', ' + '#' + options['backColor1'] + ')');
        $("#dicLayerArc").text("#dicLayer:after{border-color:" + '#' + options['backColor1'] + ' transparent' + ";}");

        setInterval(function () { checkWord() }, options['delayedTime']);
    });
}

$(document).ready(function () {

    createDicionaryLayer();
    createDicionaryRawData();
    if (debug == true)
        createLogDiv();

    /*
    $('iframe').contents().mousemove(onMouseMove);
    $("iframe").hover(function () {
        focusIframe = this;
    }, function () {
        focusIframe = null;

    });
    */
    loadOptions();
});

