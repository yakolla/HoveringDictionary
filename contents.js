var debug = false;
var wordForDebug = null;
var debugString = null;
var forceHideToolTip = false;

var mouseX = 0, mouseY = 0, mouseTarget = null, mousePageX = 0, mousePageY = 0, mousePressed = 0, rMouseX = 0, rMouseY = 0;
var oldWord = null;
var loading = false;
var focusIframe = null;
var contextSelectionWord = null;

var startTootipTime = 0;
var maxMeaning = 3;

var userOptions = {};
userOptions["tooltipDownDelayTime"] = 700;
userOptions["enableEngKor"] = "true";
userOptions["enableKorEng"] = "true";
userOptions["enableJapaneseKor"] = "true";
userOptions["enableChineseKor"] = "true";
userOptions["enablePronunciation"] = "false";

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
        $('#ylog').html('<p>x:' + parseInt(mousePageX) + ', y:' + parseInt(mousePageY) + ', word:' + wordForDebug + ', debugString:' + debugString);
    }
}

window.onmousemove = onMouseMove;

function parseKoreanEnglish(word) {

    
    $("#dicRawData .fnt_e11").remove();
    // extract data
    var phoneticSymbol = $("#dicRawData .t2:first").text();

    var soundUrl = $("#dicRawData #pron_en").attr('playlist');

    var meanings = [];
    var meaningCount = 0;
    $("#dicRawData .list_ex1 .first").each(function () {
        if (meaningCount >= maxMeaning)
            return;

        meanings[meaningCount] = $(this).text();
        meaningCount++;
    });

    if (meanings.length == 0)
        return null;
    
    return { word: word, phoneticSymbol: phoneticSymbol, soundUrl: soundUrl, meanings: meanings };
}

function parseChineseKorean(word) {


    var jdata = JSON.parse($("#dicRawData").text());   
    
    // extract data
    var phoneticSymbol = '[' + jdata.pinyin + ']';
    if (jdata.pinyin == null)
        phoneticSymbol = '';

    var meanings = [];

    for (var meaningCount in jdata.mean) {
        if (meaningCount >= maxMeaning)
            break;

        meanings[meaningCount] = jdata.mean[meaningCount];
    }
    
    if (meanings.length == 0)
        return null;

    var soundUrl = "http://tts.cndic.naver.com/tts/mp3ttsV1.cgi?url=cndic.naver.com&spk_id=250&text_fmt=0&pitch=100&volume=100&speed=80&wrapper=0&enc=0&text=" + word;    

    return { word: word, phoneticSymbol: phoneticSymbol, soundUrl: soundUrl, meanings: meanings };
}

function parseJapaneseKorean(word) {
    
    var jdata = JSON.parse($("#dicRawData").text());
    
    // extract data
    var phoneticSymbol = '[' + jdata.pinyin + ']';
    if (jdata.pinyin == null)
        phoneticSymbol = '';

    var meanings = [];

    for (var meaningCount in jdata.mean) {
        if (meaningCount >= maxMeaning)
            break;

        meanings[meaningCount] = jdata.mean[meaningCount];
    }

    if (meanings.length == 0)
        return null;

    var soundUrl = "http://tts.naver.com/tts/mp3ttsV1.cgi?spk_id=302&text_fmt=0&pitch=100&volume=100&speed=80&wrapper=0&enc=0&text=" + word;
    
    return { word: word, phoneticSymbol: phoneticSymbol, soundUrl: soundUrl, meanings: meanings };
}

var port = chrome.runtime.connect({ name: "mycontentscript" });
port.onMessage.addListener(function (message, sender) {
    contextSelectionWord = message.greeting;
    showWordToolTipCore(rMouseX, rMouseY, message.greeting, 1000);
});

function loadXMLDoc(word) {

    if (loading == true)
        return;

    var url = "";
    var parser = parseKoreanEnglish;

    guessLanguage.detect(word, function (language) {
        
        if (language == 'zh') {
            if (userOptions["enableChineseKor"] == "false")
                return;

            url = "http://tooltip.dic.naver.com/tooltip.nhn?languageCode=1&nlp=false&wordString=" + encodeURI(word, "UTF-8");
            
            parser = parseChineseKorean;
            
        }
        else if (language == 'ja') {
            if (userOptions["enableJapaneseKor"] == "false")
                return;

            url = "http://tooltip.dic.naver.com/tooltip.nhn?languageCode=2&nlp=false&wordString=" + encodeURI(word, "UTF-8");
            parser = parseJapaneseKorean;
            
        }
        else if (language == 'ko') {
            if (userOptions["enableKorEng"] == "false")
                return;

            url = "http://endic.naver.com/searchAssistDict.nhn?query=" + encodeURI(word, "UTF-8");
            parser = parseKoreanEnglish;        
        }        
        else
        {
            if (userOptions["enableEngKor"] == "false")
                return;
            
            url = "http://endic.naver.com/searchAssistDict.nhn?query=" + encodeURI(word, "UTF-8");
            parser = parseKoreanEnglish;
        }

        loading = true;
        
        chrome.runtime.sendMessage({ url: url}, function (data) {

            // 응답 처리
            // store dic data to easy
            $("#dicRawData").html(data);

            var parsedData = parser(word);
            
            if (parsedData == null) {
                if (language == 'zh') {
                    url = "http://tooltip.dic.naver.com/tooltip.nhn?languageCode=3&nlp=false&wordString=" + encodeURI(word, "UTF-8");
                    chrome.runtime.sendMessage({ url: url }, function (data) {
                        $("#dicRawData").html(data);

                        var parsedData = parser(word);
                        if (parsedData != null) {
                            presenteParsedDic(parsedData);
                        }

                        loading = false;
                    });
                }
                else
                {
                    loading = false;
                }
            }
            else {
                presenteParsedDic(parsedData);
                loading = false;
            }
        });
       
    });
}

function presenteParsedDic(parsedData) {
    var means = "";
    for (var i in parsedData.meanings) {
        means += '*' + '<strong>' + parsedData.meanings[i] + '</strong></br>';
    }

    var soundLoop = userOptions["enablePronunciation"] == "true" ? "autoplay" : "";
    var soundTag = '<audio id="proa"' + soundLoop + '> <source src="' + parsedData.soundUrl + '">' + '</audio>' +
                    '<img onclick="document.getElementById(\'proa\').play()" src="' + chrome.extension.getURL('play.gif') + '" />';

    if (parsedData.soundUrl == null)
        soundTag = "";

    var htmlData = parsedData.word +
                        parsedData.phoneticSymbol +
                        soundTag +
                         '</br>' +
                        means;


    $("#dicLayer").html(htmlData);
    
    if (forceHideToolTip == false) {
        $('#dicLayer').show();
    }
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

function InDicLayer(target)
{
    if (target == null)
        return false;

    if (target.attributes && target.attributes.getNamedItem("id") && target.attributes.getNamedItem("id").value && target.attributes.getNamedItem("id").value == "dicLayer")
        return true;

    return InDicLayer(target.parentNode);
}

function getWordUnderMouse(x, y, target) {

    if (InDicLayer(target))
        return oldWord;

    var selWord = getSelectedWord().toString();
    if (selWord.length) {        
        return selWord;
    }

    if (contextSelectionWord)
    {
        return contextSelectionWord;
    }

    return getWordAtPoint(target, x, y);;
}

function hideWordToolTip() {

    if (InDicLayer(mouseTarget))
        return;

    if (new Date().getTime() - startTootipTime < userOptions["tooltipDownDelayTime"])
        return;

    var word = getWordUnderMouse(mouseX, mouseY, mouseTarget);
    
    if (word == null)
    {
        $('#dicLayer').hide();
        
        if (window.getSelection && InDicLayer(window.getSelection().anchorNode))
        {
            if (window.getSelection)
                window.getSelection().removeAllRanges();
        }

        oldWord = null;
    }
}

function showWordToolTipCore(x, y, word, timeDelay)
{
    wordForDebug = word;

    if (word) {
        word = word.trim();
        if (oldWord == word)
            return;

        var dicLayer = $("#dicLayer");

        //dicLayer.css("left", mousePageX + 'vw');
        //dicLayer.css("top", (mousePageY+1) + 'vh');

        dicLayer.css("left", x + 'px');
        dicLayer.css("top", (y + 20) + 'px');

        loadXMLDoc(word);

        startTootipTime = new Date().getTime() + timeDelay;
    }
    else {
        //$('#dicLayer').hide();
    }


    oldWord = word;
}

function showWordToolTip() {
    var x = mouseX,
        y = mouseY
    target = mouseTarget;
         
    var word = getWordUnderMouse(x, y, target);

    showWordToolTipCore(x, y, word, 0);
}

function loadOptions() {
    var keys = ["fontSize", "fontType", "fontBold"
                     , "fontColor", "backColor1"
                     , "backColor2", "tooltipUpDelayTime", "tooltipDownDelayTime"
                    , "enableEngKor", "enableKorEng", "enableJapaneseKor", "enableChineseKor"
                    , "enablePronunciation"];  // 불러올 항목들의 이름


    chrome.storage.local.get(keys, function (options) {
        /*
        if (!options["fontSize"]) {
            setInterval(function () { hideWordToolTip() }, 90);
            setInterval(function () { showWordToolTip() }, 90);
            return;
        }*/
        userOptions = options;

        var dicLayer = $("#dicLayer");

        dicLayer.css('color', '#' + options['fontColor']);
        dicLayer.css('font-size', options["fontSize"] + 'px');
        dicLayer.css('font-family', options["fontType"]);
        dicLayer.css('background', '-webkit-linear-gradient(bottom, ' + '#' + options['backColor2'] + ', ' + '#' + options['backColor1'] + ')');
        $("#dicLayerArc").text("#dicLayer:after{border-color:" + '#' + options['backColor1'] + ' transparent' + ";}");
        debugString = options['tooltipDownDelayTime'];
        setInterval(function () { showWordToolTip() }, options['tooltipUpDelayTime']);
        setInterval(function () { hideWordToolTip() }, options['tooltipDownDelayTime']);
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
    
    $(document).keydown(function (e) {
        if (e.which == 18) {            
            forceHideToolTip = true;
            $('#dicLayer').hide();
        }
    });

    $(document).keyup(function (e) {
        if (e.which == 18) {            
            forceHideToolTip = false;
            $('#dicLayer').show();
        }
    });
    
    $(document).mousedown(function (e) {
        if (e.which == 3) {
                rMouseX = mouseX;
                rMouseY = mouseY;            
            return false;
        }

        if (e.which == 1) {
            contextSelectionWord = null;            
        }
        return true;
    });
});

