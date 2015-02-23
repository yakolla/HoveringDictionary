function getWordAtPoint(elem, x, y) {
  if(elem.nodeType == elem.TEXT_NODE) {
      
    var range = elem.ownerDocument.createRange();
      
    range.selectNodeContents(elem);
    var currentPos = 0;
    var endPos = range.endOffset;
      
    while(currentPos+1 < endPos) {
      range.setStart(elem, currentPos);
      range.setEnd(elem, currentPos + 1);
      var rect = range.getBoundingClientRect();
      if (rect.left <= x && rect.right >= x &&
         rect.top <= y && rect.bottom >= y) {
        range.expand("word");
        var ret = range.toString();
        range.detach();
        
        return(ret);
      }
       
      currentPos += 1;
    }
  } else {
    for(var i = 0; i < elem.childNodes.length; i++) {
      var range = elem.childNodes[i].ownerDocument.createRange();
      range.selectNodeContents(elem.childNodes[i]);
      var rect = range.getBoundingClientRect();
      if (rect.left <= x && rect.right >= x &&
         rect.top <= y && rect.bottom >= y) {
        range.detach();
        return(getWordAtPoint(elem.childNodes[i], x, y));
      } else {
        range.detach();
      }
    }
  }
  return(null);
}

function getSelectedWord()
{
    if (focusIframe) {
        return getSelectedTextFromIFrame(focusIframe);
    }

    if (window.getSelection) {
        return window.getSelection();
    } else if (document.getSelection) {
        return document.getSelection();        
    } else if (document.selection) {
        return document.selection.createRange();
    }
    return null;
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

function isInSelectedTextArea(x, y)
{
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
 
var mouseX = 0, mouseY = 0, mouseTarget = null, mousePageX = 0, mousePageY = 0, mousePressed = 0;
var oldWord = null;
var loading = false;

function onMouseMove(e) {
    mouseX = e.clientX,
    mouseY = e.clientY;
    var toolbarHeight = window.outerHeight - window.innerHeight;
    var toolbarWidth = window.outerWidth - window.innerWidth;
    mousePageX = e.screenX - window.screenX + $(window).scrollLeft() - toolbarWidth;
    mousePageY = e.screenY - window.screenY + $(window).scrollTop() - toolbarHeight;
    mousePressed = e.which;

    mouseTarget = e.target;


    $('#ylog').html('<p>x:' + e.target.offsetTop + ', y:' + focusIframe.offsetTop);
}

window.onmousemove = onMouseMove;

var maxMeaning = 3;
function parseKoreanEnglish(word)
{
    
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
        meaning = "sorry, no match";
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
        meaning = "sorry, no match";
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
        meaning = "sorry, no match";
    }

    return word + ' ' +
             phoneticSymbol + '</br>' +
             meaning;
}


function loadXMLDoc(word) {
    if (loading == true)
        return;
    loading = true;

    var url = "http://endic.naver.com/searchAssistDict.nhn?query=" + encodeURI(word, "UTF-8");
    var parser = parseKoreanEnglish;
    guessLanguage.detect(word, function (language) {
        if (language == 'zh')
        {
            url = "http://tooltip.dic.naver.com/tooltip.nhn?languageCode=1&nlp=false&wordString=" + encodeURI(word, "UTF-8");
            parser = parseChiness;            
        }
        else if (language == 'ja')
        {
            url = "http://tooltip.dic.naver.com/tooltip.nhn?languageCode=2&nlp=false&wordString=" + encodeURI(word, "UTF-8");
            parser = parseJapaness;
        }
        
    });
    
    $.get(url, function (data) {
        
        // store dic data to easy
        $("#dicRawData").html(data);
        
        $("#dicLayer").html(parser(word));

        
        $('#dicLayer').show();
        loading = false;
    });


}
function createDicionaryLayer()
{    
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

function checkWord()
{
    var x = mouseX,
        y = mouseY
    target = mouseTarget;

    var selWord = getSelectedWord().toString();    
    var word = getWordAtPoint(target, x, y);
    
    if (selWord.length)
    {
        word = null;
        if (isInSelectedTextArea(x, y))
            word = selWord;

    }
        
    
    if (word) {
        word = word.trim();
        if (oldWord == word)
            return;

        
        $("#dicLayer").css("left", mousePageX);
        $("#dicLayer").css("top", mousePageY + 30);

        loadXMLDoc(word);
    }
    else
    {
        $('#dicLayer').hide();
    }
    

    oldWord = word;
}

$(document).ready(function () {
    createDicionaryLayer();
    createDicionaryRawData();
    //createLogDiv();
    setInterval(function () { checkWord() }, 90);
    $('iframe').contents().mousemove(onMouseMove);
    $("iframe").hover(function () {
        focusIframe = this;
    }, function () {
        focusIframe = null;

    });
});

var focusIframe = null;
