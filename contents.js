﻿var debug = false;
var wordForDebug = null;
var debugString = null;
var forceShowToolTip = false;
var foundWord = null;

var mouseEvent;
var mouseX = 0, mouseY = 0, mouseTarget = null, mousePageX = 0, mousePageY = 0, mousePressed = 0, rMouseX = 0, rMouseY = 0;
var pageHeight = 0, pageWidth = 0;
var pressKey = 0;
var loading = false;
var focusIframe = null;
var contextSelectionWord = null;
var maxSentenceLen = 90;

var startTootipTime = 0;
var maxMeaning = 3;

var arrowSize = 10;
//var bridgeLine = '<hr noshade>';
var bridgeLine = '<dicbridgeLine>';
var brTag = '<br></br>';

var domParser = new DOMParser();

var userOptions = {};
userOptions["tooltipDownDelayTime"] = 700;
userOptions["enableEngKor"] = "true";
userOptions["enableKorEng"] = "false";
userOptions["enableJapaneseKor"] = "true";
userOptions["enableChineseKor"] = "true";
userOptions["enablePronunciation"] = "false";
userOptions["enableTranslate"] = "true";
userOptions["popupKey"] = "0";
userOptions["popupOrientation"] = "0";
userOptions["enableEE"] = false;
userOptions["enableHanja"] = false;


function getWordUnderCursor(event) {
    var range, textNode, offset;

    if (document.caretRangeFromPoint) {     // Chrome
        range = document.caretRangeFromPoint(event.clientX, event.clientY);
        if (range == null)
            return null;

        textNode = range.startContainer;
        offset = range.startOffset;
    }

    //data contains a full sentence
    //offset represent the cursor position in this sentence
    var data = textNode.data,
        i = offset,
        begin,
        end;

    if (data == null)
        return null;

    //Find the begin of the word (space)
    while (i > 0 && data[i] !== " ") { --i; };
    begin = i;

    //Find the end of the word
    i = offset;
    while (i < data.length && data[i] !== " ") { ++i; };
    end = i;

    //Return the word under the mouse cursor

    var resultString = data.substring(begin, end);
    range.setStart(textNode, begin);
    range.setEnd(textNode, end);

    var rect = range.getBoundingClientRect();    
    if (rect.left > event.clientX || rect.right < event.clientX ||
               rect.top > event.clientY || rect.bottom < event.clientY) {

        return null;
    }
    
    return resultString;
}

function getCharacterAtPoint(elem, x, y) {
    if (elem == null)
        return null;

    if (elem.nodeType == elem.TEXT_NODE) {

        var range = elem.ownerDocument.createRange();

        range.selectNodeContents(elem);
        var currentPos = 0;
        var endPos = range.endOffset;
        while (currentPos < endPos)
        {
            range.setStart(elem, currentPos);
            range.setEnd(elem, currentPos + 1);
            
            var rect = range.getBoundingClientRect();

            if (rect.left <= x && rect.right >= x &&
               rect.top <= y && rect.bottom >= y) {
                var ret = range.toString();
                //debugString = ret;
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
                return (getCharacterAtPoint(elem.childNodes[i], x, y));
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
    mouseEvent = e;

    pageHeight = mouseTarget.ownerDocument.documentElement.clientHeight;
    pageWidth= mouseTarget.ownerDocument.documentElement.clientWidth;

    if (mousePressed > 0 || e.button > 0) {
        if (InDicLayer(mouseTarget) == false) {
            mouseTarget = null;
            $('#dicLayer').hide();
        }
    }    

    var toolbarHeight = window.outerHeight - window.innerHeight;
    var toolbarWidth = window.outerWidth - window.innerWidth;

    //mousePageX = (e.screenX - window.screenX) / (window.outerWidth) * 100;
    //mousePageY = (e.screenY - window.screenY) / (window.outerHeight) * 100;

    mousePageX = (mouseX) / (pageWidth) * 100;
    mousePageY = (mouseY) / (pageHeight) * 100;
    
    if (debug == true) {
        $('#ylog').html('<p>x:' + parseInt(mousePageX) + ', y:' + parseInt(mousePageY) + ', word:' + wordForDebug + ', debugString:' + debugString);
    }
}

window.onmousemove = onMouseMove;


function parseEnglishEnglish(word, lang) {
    
    try {

        if (word == null || word.length == 0)
            return null;

        var jdata = JSON.parse($("#dicRawData").text());
        if (jdata.entries.length == 0)
            return null;
    
        word = jdata.entries[0].entry;
        // extract data
        var phoneticSymbol = '';
        if (jdata.entries[0].pronunciation_ipa)
            phoneticSymbol = '[' + jdata.entries[0].pronunciation_ipa + ']';

        var meanings = [];
        var meaningCount = 0;
        $.each(jdata.entries[0].definitions, function (key, data) {
        
            meanings[meaningCount] = bridgeLine;
            meaningCount++;

            if (key == "i")
                key = "Idioms";
            else if (key == "vp")
                key = "Verb phrases";

            meanings[meaningCount] = '<dicWordClass>' + key + '</dicWordClass>' + brTag;
            meaningCount++;

            var count = 0;
        
            $.each(data, function (index, data) {
            
                if (data.type == "simple") {
                    if (data.definition.label == null) {
                        ++count;
                        meanings[meaningCount] = '<dicCount>' + count + '.' + '</dicCount>' + '<dicMean>' + data.definition.content + '</dicMean>' + brTag;
                        meaningCount++;
                    }
                    else {
                        ++count;
                        meanings[meaningCount] = '<dicCount>' + count + '.' + '</dicCount>' + '<dicMean>' + data.definition.label + '</dicMean>' + brTag;
                        meaningCount++;

                        meanings[meaningCount] = '<dicMean>' + data.definition.content + '</dicMean>' + brTag;
                        meaningCount++;
                    }

                }
                else if (data.type == "group") {
                    ++count;
                    meanings[meaningCount] = '<dicCount>' + count + '.' + '</dicCount>' + '<dicMean>' + data.group_label + '</dicMean>' + brTag;
                    meaningCount++;

                    $.each(data.definitions, function (index2, data2) {
                        meanings[meaningCount] = '<dicMean>' + data2.content + '</dicMean>' + brTag;
                        meaningCount++;
                    });
                }
            
            
            })
        });

    
        $.each(jdata.entries[0].supnt_data, function (key, data) {

            if ("synonyms" == key || "antonyms" == key)
            {
                meanings[meaningCount] = bridgeLine;
                meaningCount++;

                meanings[meaningCount] = '<dicWordClass>' + key + '</dicWordClass>' + brTag;
                meaningCount++;

                $.each(data, function (index, data) {

                    if (data.type == "syndesc" || data.type == "antdesc")
                    {
                        meanings[meaningCount] = '<dicMean>' + data.value + '</dicMean>' + brTag;
                        meaningCount++;
                    }
                });
            }
        
        
        });
    
        if (meanings.length == 0)
            return null;

        var soundUrl = "https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=" + lang + "&q=" + encodeURIComponent(word);

        return { word: word, phoneticSymbol: phoneticSymbol, soundUrl: soundUrl, meanings: meanings };
    }
    catch(err)
    {
        return null;
    }
}


function parseKoreanEnglish(word, lang) {
    if ($("#dicRawData").text().indexOf("[") == -1)
        return null;

    var jdata = JSON.parse($("#dicRawData").text());
    
    var meanings = [];
    var count = 0;
    for (var meaningCount in jdata.mean) {
        ++count;
        meanings[meaningCount] = '<dicCount>' + count + '.' + '</dicCount>' + '<dicMean>' + jdata.mean[meaningCount] + '</dicMean>' + brTag;
    }

    if (meanings.length == 0)
        return null;
    
    return { word: jdata.word, phoneticSymbol: jdata.phoneticSymbol, soundUrl: jdata.soundUrl, meanings: meanings };
}

function parseChineseKorean(word, lang) {
    if ($("#dicRawData").text().indexOf("[") == -1)
        return null;

    var jdata = JSON.parse($("#dicRawData").text());

    // extract data
    var phoneticSymbol = '';
    if (jdata.pinyin)
        phoneticSymbol = jdata.pinyin;

    var meanings = [];

    for (var meaningCount in jdata.mean) {

        meanings[meaningCount] = '<dicMean>' + jdata.mean[meaningCount] + '</dicMean>' + brTag;
    }
    
    if (meanings.length == 0)
        return null;

    var soundUrl = "http://tts.cndic.naver.com/tts/mp3ttsV1.cgi?url=cndic.naver.com&spk_id=250&text_fmt=0&pitch=100&volume=100&speed=100&wrapper=0&enc=0&text=" + encodeURIComponent(word);

    return { word: jdata.word, phoneticSymbol: phoneticSymbol, soundUrl: soundUrl, meanings: meanings };
}

function parseHanjaKorean(word, lang) {
    if ($("#dicRawData").text().indexOf("[") == -1)
        return null;

    var jdata = JSON.parse($("#dicRawData").text());
        
    // extract data
    var phoneticSymbol = '';
    if (jdata.pinyin)
        phoneticSymbol = jdata.pinyin;

    if (jdata.readPronun)
        phoneticSymbol = phoneticSymbol + '[' + jdata.readPronun + ']';

    var meanings = [];
    var count = 0;
    for (var meaningCount in jdata.mean) {
        ++count;
        meanings[meaningCount] = '<dicMean>' + jdata.mean[meaningCount] + '</dicMean>' + brTag;

    }

    if (meanings.length == 0)
        return null;
    
    var soundUrl = "http://tts.cndic.naver.com/tts/mp3ttsV1.cgi?url=cndic.naver.com&spk_id=250&text_fmt=0&pitch=100&volume=100&speed=100&wrapper=0&enc=0&text=" + encodeURIComponent(word);

    return { word: jdata.word, phoneticSymbol: phoneticSymbol, soundUrl: soundUrl, meanings: meanings };
}

function parseJapaneseKorean(word, lang) {
    if ($("#dicRawData").text().indexOf("[") == -1)
        return null;
    
    var jdata = JSON.parse($("#dicRawData").text());
    
    // extract data
    var phoneticSymbol = '';
    if (jdata.pinyin)
        phoneticSymbol = '[' + jdata.pinyin + ']';

    var meanings = [];

    for (var meaningCount in jdata.mean) {
    
        meanings[meaningCount] = jdata.mean[meaningCount];
    }

    if (meanings.length == 0)
        return null;

    var soundUrl = "https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=" + lang + "&q=" + encodeURIComponent(jdata.word);
    
    return { word: jdata.word, phoneticSymbol: phoneticSymbol, soundUrl: soundUrl, meanings: meanings };
}

function parseGoogleTranslate(word, lang) {
    
    try {
        var jdata = JSON.parse($("#dicRawData").text());
    
        var meanings = [];
        if (jdata.sentences) {
            meanings[0] = "";
            for (var i = 0; i < jdata.sentences.length; ++i)
                meanings[0] += jdata.sentences[i].trans;
        }

        if (meanings.length == 0)
            return null;

        var soundUrl = "https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=" + lang + "&q=" + encodeURIComponent(word).substring(0, 320);
    
        return { word: word, phoneticSymbol: "", soundUrl: soundUrl, meanings: meanings, isSentence:true };
    }
    catch (err) {
        return null;
    }
}

chrome.runtime.onMessage.addListener(onMessageProc);

function onMessageProc(request, sender, sendResponse) {
    if (request.id == 1) {
        contextSelectionWord = request.greeting;

        showWordToolTipCore(rMouseX, rMouseY, request.greeting, 1000);
    }
    else if (request.id == 2) {
        var e = jQuery.Event("keyup");
        e.which = 192; // # Some key code value
        e.keyCode = 192;
        $(document).trigger(e);
    }
}


function convertRawDataToJson(word, language, parser, data)
{
    if (data == null)
        return null;

    if (language == 'zh')    {
        data = convertRawDataToJsonForNaverChiness(word, parser, data);
    }
    else if (language == 'hanja') {
        data = convertRawDataToJsonForNaverHanja(word, parser, data);
    }
    else if (language == 'ja') {
        data = convertRawDataToJsonForNaverJapan(word, parser, data);
    }
    else if (language == 'en' || language == 'ko') {
        data = convertRawDataToJsonForNaverEnglish(word, parser, data);
    }
    
    $("#dicRawData").text(data);

    return parser(word, language);
}

function convertRawDataToJsonForNaverHanja(word, parser, data) {
    if (data.indexOf("<html") >= 0) {

        var jsonData = {};
        jsonData.word = $(data).find(".result_chn_chr:first  dl dt").text();
        jsonData.pinyin = "";

        jsonData.readPronun = $(data).find(".result_chn_chr:first  .single dd .sound").text();
        jsonData.mean = [];

        if (jsonData.word.length > 1) {
            var sumWord = $(data).find(".result_chn_words:first dl dd a span:first").text();

            if (sumWord.length > 0)
                jsonData.pinyin += '[' + sumWord + ']';

            $(data).find(".result_chn_words:first .meaning:first").each(function () {
                jsonData.mean.push($(this).text());
            });
        }
        else {
            $(data).find(".result_chn_chr:first dl dd a span").each(function () {
                jsonData.pinyin += '[' + $(this).text() + ']';
            });
        }

        $(data).find(".result_chn_chr:first").each(function () {

            var hanjas = [];
            $(this).find("dl dt a").each(function () {
                hanjas.push($(this).text());
            });

            var hunms = [];
            $(this).find("dd a span").each(function () {
                hunms.push($(this).text());
            });

            var meanings = [];
            $(this).find(".meaning").each(function () {
                meanings.push($(this).text());
            });

            for (var i = 0; i < hunms.length; ++i) {
                jsonData.mean.push(bridgeLine);
                jsonData.mean.push('<dicWordClass>' + hanjas[i] + ' ' + '[' + hunms[i] + ']' + '</dicWordClass>');
                jsonData.mean.push(meanings[i]);
            }

        });

        return JSON.stringify(jsonData);
    }

    return data;
}

function convertRawDataToJsonForDaumJapan(word, parser, data)
{    
    if (data.indexOf("<html") >= 0) {

        var jsonData = {};
        jsonData.word = $(data).find(".cleanword_type:first .txt_emph1:first").text();

        if (jsonData.word != null && jsonData.word.length > 0) {
            jsonData.pinyin = "";
            jsonData.mean = [];

            $(data).find(".search_box:first").each(function () {

                var japans = [];
                $(this).find(".txt_emph1").each(function () {
                    japans.push($(this).text());
                });

                var hanjas = [];
                $(this).find(".sub_txt").each(function () {
                    hanjas.push($(this).text());
                });

                var meanings = [];
                $(this).find(".list_search").each(function () {
                    meanings.push($(this).text());
                });

                for (var i = 0; i < japans.length; ++i) {
                    jsonData.mean.push(bridgeLine);
                    if (hanjas[i])
                        jsonData.mean.push('<dicWordClass>' + japans[i] + ' ' + '[' + hanjas[i] + ']' + '</dicWordClass>' + brTag);
                    else
                        jsonData.mean.push('<dicWordClass>' + japans[i] + '</dicWordClass>' + brTag);
                    jsonData.mean.push(meanings[i]);
                }

            });
        }

        return JSON.stringify(jsonData);

    }

    return data;
}

function convertRawDataToJsonForNaverChiness(word, parser, data) {
    if (data.indexOf("<html") >= 0) {

        var jsonData = {};
        jsonData.mean = [];
        var natives = [];
        var meanings = [];
        $(data).find("div.word_result").each(function () {
            $(this).find("dt").each(function () {
                
                natives.push($(this).find(".sc").text().replace(/\s+/g, '') + $(this).find(".py").text().replace(/\s+/g, ''));
            });

            $(this).find("dd").each(function () {
                var mean = "";
                var means = []
                $(this).find("li").each(function () {
                    means.push($(this).text().replace(/\s+/g,''));
                });

                for (var i = 0; i < means.length; ++i)
                    mean += brTag + means[i];

                meanings.push(mean);
            });
        });

        for (var i = 0; i < natives.length; ++i)
        {
            jsonData.word = natives[0];
            jsonData.mean.push(bridgeLine);
            jsonData.mean.push('<dicWordClass>' + natives[i] + '</dicWordClass>' + brTag);
            jsonData.mean.push(meanings[i] + brTag + brTag);
        }
        
        data = JSON.stringify(jsonData);
    }

    return data;
}
function convertRawDataToJsonForNaverJapan(word, parser, data) {
    if (data.indexOf("<html") >= 0) {
                
        var jsonData = {};
       
        jsonData.pinyin = "";
        jsonData.mean = [];
        var natives = [];
        var meanings = [];
        $(data).find("div.section.all.section_word").each(function () {
            
            $(this).find(".srch_box").each(function () {

                natives.push($(this).find(".srch_top .entry").text());
                var mean = $(this).find(".pin").text();

                var subLable = [];
                var subMean = [];
                $(this).find(".top_dn dt").each(function () {                    
                    subLable.push($(this).text());
                });
                $(this).find(".top_dn dd").each(function () {                    
                    subMean.push($(this).text());
                });

                for (var i = 0; i < subLable.length; ++i)
                {
                    mean += brTag + subLable[i] + ' ' + subMean[i];
                }
            
                var i = 1;
                $(this).find(".inner_lst").each(function () {
                    mean += brTag + i + '.'+ $(this).text();
                    ++i;
                });
                meanings.push(mean);
            });
        });
        
        for (var i = 0; i < natives.length; ++i) {
            jsonData.word = natives[0];
            jsonData.mean.push(bridgeLine);
            jsonData.mean.push('<dicWordClass>' + natives[i] + '</dicWordClass>' + brTag);
            jsonData.mean.push(meanings[i] + brTag + brTag);
        }

        return JSON.stringify(jsonData);

    }

    return data;
}

function findEndIndexOfTag(data, startIndex, tag)
{
    var startTag = '<' + tag;
    var endTag = '</' + tag;
    var stackCount = 0;
    for (var i = startIndex; i < data.length; ++i)
    {
        var extractStr = data.substring(i, i + endTag.length);
        if (0 <= extractStr.search(startTag)) {
            i += startTag.length;
            stackCount++;
        }
        else if (0 <= extractStr.search(endTag)) {
            i += endTag.length;
            stackCount--;
        }
        
        if (stackCount == 0)
            break
    }
    
    
    return i;
}

function convertRawDataToJsonForNaverEnglish(word, parser, data) {
    if (data.indexOf("<html") >= 0) {
        data = domParser.parseFromString(data, "text/html");
        
        var jsonData = {};
        
        jsonData.mean = [];
        
        jsonData.word = $(data).find(".word_num .first:first .fnt_e30").text();
        if (jsonData.word == null || jsonData.word.length == 0)
            jsonData.word = word;
        jsonData.soundUrl = $(data).find(".word_num .first a[playlist]").attr('playlist');
        jsonData.phoneticSymbol = $(data).find(".word_num .first:first .fnt_e25").text();
        
        
        
        var meanings = [];
        
        var mean = "";
        var subLable = [];
        var subMean = [];
        $(data).find(".word_num dt .fnt_e30").each(function () {
            subLable.push($(this).text().trim());
        });
        $(data).find(".word_num dd").each(function () {
            subMean.push($(this).find("p:first").text().trim());
        });
        
        for (var i = 0; i < subLable.length; ++i) {
            meanings.push(subLable[i] + brTag + subMean[i]);
        }

        for (var i = 0; i < meanings.length; ++i) {
            jsonData.mean.push(meanings[i]);
        }

        return JSON.stringify(jsonData);

    }

    return data;
}


function translateSentence(word, lang, toLang, parser) {
    var url = null;
    url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" + 'auto' + "&tl=" + toLang + "&hl=ko&dt=t&dt=bd&dj=1&source=icon&q=" + encodeURIComponent(word);
    parser = parseGoogleTranslate;
    
    chrome.runtime.sendMessage({ url: url }, function (data) {
        
        var parsedData = convertRawDataToJson(word, lang, parser, data);
        if (parsedData != null) {
            presentParsedDic(lang, parsedData);
            foundWord = word;
        }
        else
        {
            foundWord = null;
        }
        loading = false;
    });
}



function loadWordMeaningFromWeb(word) {

    if (loading == true)
        return;

    var url = "";
    var parser = parseKoreanEnglish;

    guessLanguage.detect(word, function (language) {
        
        if (language == 'unknown') {
            if ( word.match(/[^a-zA-Z]/) == null ) {
                language = 'en';
            }
        }
        // 중국어라 감지되었지만, 중국어 사전이 꺼지고, 일본어 사전이 켜진 경우에는 일본어로 감지시키자.
        if (language == 'zh') {
            if (userOptions["enableChineseKor"] == "false" && userOptions["enableJapaneseKor"] == "true")
                language = 'ja';
        }
        var sentence = word;
        
        if (language == 'zh') {
            if (userOptions["enableChineseKor"] == "false") {
                $('#dicLayer').hide();
                foundWord = null;
                return;
            }

            var regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi;
            word = word.replace(regExp, "");

            if (userOptions["enableHanja"] == true) {
                language = 'hanja';
                url = "http://hanja.naver.com/search?query=" + encodeURIComponent(word);
                parser = parseHanjaKorean;
            }
            else {
                //url = "http://tooltip.dic.naver.com/tooltip.nhn?languageCode=1&nlp=false&wordString=" + encodeURIComponent(word);
                url = "http://cndic.naver.com/search/all?q=" + encodeURIComponent(word);
                parser = parseChineseKorean;
            }
        }
        else if (language == 'ja') {
            if (userOptions["enableJapaneseKor"] == "false") {
                $('#dicLayer').hide();
                foundWord = null;
                return;
            }

            var regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi;
            word = word.replace(regExp, "");
            
            //url = "http://tooltip.dic.naver.com/tooltip.nhn?languageCode=2&nlp=false&wordString=" + encodeURI(word, "UTF-8");
            //url = "http://dic.daum.net/search.do?dic=jpq&q=" + encodeURIComponent(word);
            url = "http://jpdic.naver.com/search.nhn?range=all&q=" + encodeURIComponent(word);
            parser = parseJapaneseKorean;
            
        }
        else if (language == 'ko') {
            if (userOptions["enableKorEng"] == "false") {
                $('#dicLayer').hide();
                foundWord = null;
                return;
            }
            
            //url = "http://endic.naver.com/searchAssistDict.nhn?query=" + encodeURIComponent(word);            
            url = "http://endic.naver.com/search.nhn?sLn=kr&query=" + encodeURIComponent(word);
            parser = parseKoreanEnglish;        
        }        
        else if (language == 'en')
        {
            if (userOptions["enableEngKor"] == "false") {
                $('#dicLayer').hide();
                foundWord = null;
                return;
            }
            var regExp = /[0-9\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gim;
            
            word = word.replace(regExp, "");
            if (userOptions["enableEE"] == true)
            {
                url = "http://restapi.dictionary.com/v2/word.json/" + encodeURIComponent(word) + "/complete?api_key=sWq3tLz8ifndaTK&platform=Chrome&app_id=chromeExtension_1.1&clickSource=Popup";
                parser = parseEnglishEnglish;
            }
            else
            {
                //url = "http://endic.naver.com/searchAssistDict.nhn?query=" + encodeURIComponent(word);
                url = "http://endic.naver.com/search.nhn?sLn=kr&query=" + encodeURIComponent(word);
                parser = parseKoreanEnglish;
            }
        }

        if (language == 'zh' || language == 'ja') {
            if (sentence.length > maxSentenceLen) {
                sentence = sentence.substring(0, maxSentenceLen - 1);
            }
        }
        
        if (word == null || word.length == 0 || foundWord == word || foundWord == sentence)
            return null;
        
        loading = true;
        
        chrome.runtime.sendMessage({ url: url }, function (data) {
            var parsedData = convertRawDataToJson(word, language, parser, data);
            
            if (parsedData != null) {
                    
                var correctSearch = false;
                for (var i = 0; i < parsedData.meanings.length; ++i) {
                    if (0 <= parsedData.meanings[i].search(new RegExp(word, "gi"))) {
                            
                        correctSearch = true;
                        break;
                    }
                }

                if (correctSearch == true) {
                    presentParsedDic(language, parsedData);
                    foundWord = word;
                    loading = false;
                    return;
                }
            }

            
            if (language == 'ko') {
                translateSentence(sentence, language, 'en', parser);
            }
            else if (language == 'en') {            

                if ((sentence.match(/ /g) || []).length > 0) {
                    translateSentence(sentence, language, 'ko', parser);
                }
                else {
                    loading = false;
                    foundWord = null;
                }
            }
            else
            {
                translateSentence(sentence, language, 'ko', parser);
            }
        });
       
    });
}

function presentParsedDic(language, parsedData) {

    var soundTag = '<div id="dicImg" style="background-image: url(' + chrome.extension.getURL('play.gif') + ');" ></div>';

    if (parsedData.soundUrl == null)
        soundTag = "";

    var eeTag = "";
    var eeCheckBox = false;
    var eeOptionName = null;
    var eeLableName = null;
    if (language == "en") {
        eeOptionName = "enableEE";
        eeLableName = "Eng";
        if (userOptions[eeOptionName] == true)
            eeCheckBox = true;        
    }
    else if (language == "zh" || language == "hanja") {
        eeOptionName = "enableHanja";
        eeLableName = "Hanja";
        if (userOptions[eeOptionName] == true)
            eeCheckBox = true;
    }
    
    if (eeLableName != null)
    {
        if (eeCheckBox == true)
            eeTag = '  <input type="checkbox" id="ee" checked>' + eeLableName + '</>';
        else
            eeTag = '  <input type="checkbox" id="ee">' + eeLableName + '</>';
    }
    
    var htmlData = '<dicWord>' + parsedData.word + parsedData.phoneticSymbol + '</dicWord>' + '<dicWord>' + soundTag + eeTag + '</dicWord>' +
                         brTag + brTag;

    for (var meaningCount in parsedData.meanings) {
        htmlData += parsedData.meanings[meaningCount];
        
    }
    
    var dicLayer = $("#dicLayer");    
    try{
        $("#dicLayerContents").html(htmlData);
    }
    catch (e)
    {
        var doc = domParser.parseFromString(htmlData, 'text/html');
        var result = new XMLSerializer().serializeToString(doc);
        result = $(result).find('body').html();
        result = result.replace(/xmlns/gi, "dicns");
        $("#dicLayerContents").html(result);
    }
    
    dicLayer.scrollTop(0);

    if (parsedData.isSentence)
    {
        if (userOptions["enablePronunciation"] == "true")
            chrome.runtime.sendMessage({ soundUrl: parsedData.soundUrl }, function (data) { });
    }
    else
    {
        if (userOptions["enablePronunciation"] == "true" || userOptions["enablePronunciation"] == "onlyWord")
            chrome.runtime.sendMessage({ soundUrl: parsedData.soundUrl }, function (data) { });
    }

    $("#dicLayer #dicImg").click(function () {
        chrome.runtime.sendMessage({ soundUrl: parsedData.soundUrl }, function (data) { });
    });
    
    $("#dicLayer #ee").click(function () {
        userOptions[eeOptionName] = $(this).is(":checked");
            
        if (language == "en") {
            chrome.storage.local.set({ "enableEE": userOptions[eeOptionName] }, function () {

            });
        }
        else if (language == "zh" || language == "hanja") {
            chrome.storage.local.set({ "enableHanja": userOptions[eeOptionName] }, function () {

            });
        }

        
        
    });

    var topArrow = true;
    var x = mouseX;
    var y = mouseY;
    var gabHeight = 20;
    var arrowYPos = y;

    if (pageWidth < dicLayer.width() + x) {
        x = pageWidth - dicLayer.width();
    }
    
    if (userOptions["popupOrientation"] == "1" || pageHeight < dicLayer.height() + y + gabHeight) {
        //y = pageHeight - dicLayer.height() - gabHeight;
        y = mouseY - dicLayer.height() - gabHeight - arrowSize * 3;
        arrowYPos = y + dicLayer.height() + gabHeight + arrowSize / 2 + 1;
        topArrow = false;
    }

    if (y < 0)
    {
        y = mouseY
        arrowYPos = y;
        topArrow = true;
    }

    
    dicLayer.css("left", x + 'px');
    dicLayer.css("top", (y + gabHeight) + 'px');

    var dicLayerArrowB = $("#dicLayerArrowB");
    var dicLayerArrowF = $("#dicLayerArrowF");

    
    dicLayerArrowB.css("left", (x + arrowSize/2) + 'px');
    dicLayerArrowF.css("left", (x + arrowSize) + 'px');

    dicLayerArrowB.css("border-bottom-color", '');
    dicLayerArrowB.css("border-top-color", '');
    dicLayerArrowF.css("border-bottom-color", '');
    dicLayerArrowF.css("border-top-color", '');

    if (topArrow == true)
    {        
        dicLayerArrowB.css("top", (arrowYPos + 1) + 'px');
        dicLayerArrowF.css("top", (arrowYPos + 2) + 'px');
        dicLayerArrowF.css("border-bottom-color", '#' + userOptions['backColor1']);
        dicLayerArrowB.css("border-bottom-color", 'black');
    }
    else
    {
        dicLayerArrowB.css("top", (arrowYPos + 1) + 'px');
        dicLayerArrowF.css("top", (arrowYPos) + 'px');
        dicLayerArrowF.css("border-top-color", '#' + userOptions['backColor2']);
        dicLayerArrowB.css("border-top-color", 'black');
    }

    if (userOptions["enableTranslate"] == "true") {
        dicLayer.show();
    }
}

function createDicionaryLayer() {
    
    var myLayer = document.createElement('div');
    myLayer.id = 'dicLayer';
    document.body.appendChild(myLayer);

    var myLayerContents = document.createElement('div');
    myLayerContents.id = 'dicLayerContents';
    myLayer.appendChild(myLayerContents);

    var myLayerArrowB = document.createElement('div');
    myLayerArrowB.id = 'dicLayerArrowB';
    myLayer.appendChild(myLayerArrowB);

    var myLayerArrowF = document.createElement('div');
    myLayerArrowF.id = 'dicLayerArrowF';
    myLayer.appendChild(myLayerArrowF);
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

    if (forceShowToolTip == true)
        return foundWord;

    if (target == null)
        return null;

    if (InDicLayer(target))
        return foundWord;

    var selWord = getSelectedWord().toString();
    if (selWord.length) {        
        return selWord;
    }

    if (contextSelectionWord)
    {
        return contextSelectionWord;
    }
    
    return getWordUnderCursor(mouseEvent);
}

function hideWordToolTip() {

    if (InDicLayer(mouseTarget))
        return;

    if (new Date().getTime() - startTootipTime < userOptions["tooltipDownDelayTime"])
        return;

    var word = getWordUnderMouse(mouseX, mouseY, mouseTarget);
    
    //var hidden = (word == null || word.length == 0 || (loading == false));
    var hidden = (word == null || word.length == 0);
    /*if (word != null && foundWord != word)
    {        
        hidden = true;
    }*/
    
    if (hidden == true)
    {
        $('#dicLayer').hide();
        
        if (window.getSelection && InDicLayer(window.getSelection().anchorNode))
        {
            if (window.getSelection)
                window.getSelection().removeAllRanges();
        }
        foundWord = null;
    }
}

function showWordToolTipCore(x, y, word, timeDelay)
{
    wordForDebug = word;
   
    if (word) {
        word = word.trim();
        
        loadWordMeaningFromWeb(word);
        
        startTootipTime = new Date().getTime() + timeDelay;
    }
    else {
        //$('#dicLayer').hide();
    }
}

function showWordToolTip() {
    var x = mouseX,
        y = mouseY
    target = mouseTarget;
    
    if (userOptions["enableTranslate"] == "false")
        return;

    if (userOptions["popupKey"] != "0" && pressKey.toString() != userOptions["popupKey"])
        return;
   
    var word = getWordUnderMouse(x, y, target);

    showWordToolTipCore(x, y, word, 0);
}

function loadOptions() {
    var keys = ["fontSize", "fontType", "fontBold"
                     , "fontColor", "backColor1"
                     , "backColor2", "tooltipUpDelayTime", "tooltipDownDelayTime"
                    , "enableEngKor", "enableKorEng", "enableJapaneseKor", "enableChineseKor"
                    , "enablePronunciation"
                   , "enableTranslate"
                    , "popupKey", "popupOrientation", "enableEE", "enableHanja"];  // 불러올 항목들의 이름


    chrome.storage.local.get(keys, function (options) {
        
        $.each(options, function (key, data) {
            userOptions[key] = data;
        });
        
        var dicLayer = $("#dicLayer");

        dicLayer.css('color', '#' + options['fontColor']);
        dicLayer.css('font-size', options["fontSize"] + 'px');
        dicLayer.css('font-family', options["fontType"]);
        dicLayer.css('background', '-webkit-linear-gradient(bottom, ' + '#' + options['backColor2'] + ', ' + '#' + options['backColor1'] + ')');
        
        setInterval(function () { showWordToolTip() }, options['tooltipUpDelayTime']);
        setInterval(function () { hideWordToolTip() }, options['tooltipDownDelayTime']);
    });
}

$(document).ready(function () {

    createDicionaryLayer();
    createDicionaryRawData();
    
    if (debug == true)
        createLogDiv();

    loadOptions();   

    $(document).keyup(function (e) {
        //~
        if (e.which == 192) {            
            
            if (userOptions["enableTranslate"] == "false") {
                $('#dicLayer').show();
                userOptions["enableTranslate"] = "true";
            }
            else {

                $('#dicLayer').hide();
                userOptions["enableTranslate"] = "false";
            }   
            
            chrome.storage.local.set({ "enableTranslate": userOptions["enableTranslate"] }, function () {

            });
        }

        pressKey = 0;
    });

    $(document).keydown(function (e) {
        pressKey = e.which;
        if (userOptions["popupKey"] != "0")
            showWordToolTip();
    });
    
    $(document).mousedown(function (e) {
        if (e.which == 3) {
                rMouseX = mouseX;
                rMouseY = mouseY;            
            return true;
        }

        if (e.which == 1) {
            contextSelectionWord = null;            
        }
        return true;
    });
});

