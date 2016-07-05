

function save_options() {
    
    var options = {};
    options["fontType"] = document.getElementById("fontTypeSelector").value;
    options["fontSize"] = document.getElementById("fontSizeSelector").value;
    options["fontColor"] = document.getElementById("fontColor").color.toString();

    options["backColor1"] = document.getElementById("backgroundColor1").color.toString();
    options["backColor2"] = document.getElementById("backgroundColor2").color.toString();
    
    options["tooltipUpDelayTime"] = document.getElementById("tooltipUpDelayedTimeSelector").value;
    options["tooltipDownDelayTime"] = document.getElementById("tooltipDownDelayedTimeSelector").value;
    options["popupKey"] = document.getElementById("popupKey").value;
    options["popupOrientation"] = document.getElementById("popupOrientation").value;

    options["enableEngKor"] = document.getElementById("enableEngKor").value;
    options["enableKorEng"] = document.getElementById("enableKorEng").value;
    options["enableJapaneseKor"] = document.getElementById("enableJapaneseKor").value;
    options["enableChineseKor"] = document.getElementById("enableChineseKor").value;

    options["enablePronunciation"] = document.getElementById("enablePronunciation").value;
    options["enableTranslate"] = document.getElementById("enableTranslate").value;
    
    chrome.storage.local.set(options, function () {
       
    });
}
function restore_defaults(orage) {

    document.getElementById("fontTypeSelector").value = "Arial"
    document.getElementById("fontSizeSelector").value = "12";
    document.getElementById("fontColor").color.fromString("000000");

    
    document.getElementById("tooltipUpDelayedTimeSelector").value = "300";
    document.getElementById("tooltipDownDelayedTimeSelector").value = "700";
    document.getElementById("popupKey").value = "0";
    document.getElementById("popupOrientation").value = "0";
    
    document.getElementById("backgroundColor1").color.fromString("FFDC00");
    document.getElementById("backgroundColor2").color.fromString("FFEB00");
    
    document.getElementById("enableEngKor").value = "true";
    document.getElementById("enableKorEng").value = "false";
    document.getElementById("enableJapaneseKor").value = "true";
    document.getElementById("enableChineseKor").value = "true";

    document.getElementById("enablePronunciation").value = "false";
    document.getElementById("enableTranslate").value = "true";
    
}

function restore_options() {

    var keys = ["fontSize", "fontType", "fontBold"
                    , "fontColor", "backColor1"
                    , "backColor2", "tooltipUpDelayTime", "tooltipDownDelayTime"
                    , "enableEngKor", "enableKorEng", "enableJapaneseKor", "enableChineseKor"
                    , "enablePronunciation", "enableTranslate", "popupKey", "popupOrientation"
                    ];  // 불러올 항목들의 이름

    chrome.storage.local.get(keys, function (options) {
        
        if (!options["fontSize"]) {            
            restore_defaults(0);
            save_options();
            return;
        }

        document.getElementById("fontTypeSelector").value = options["fontType"];
        document.getElementById("fontSizeSelector").value = options["fontSize"];
        document.getElementById("fontColor").color.fromString(options["fontColor"]);

        document.getElementById("backgroundColor1").color.fromString(options["backColor1"]);
        document.getElementById("backgroundColor2").color.fromString(options["backColor2"]);
        
        document.getElementById("tooltipUpDelayedTimeSelector").value = options["tooltipUpDelayTime"];
        document.getElementById("tooltipDownDelayedTimeSelector").value = options["tooltipDownDelayTime"];
        document.getElementById("popupKey").value = options["popupKey"];
        document.getElementById("popupOrientation").value = options["popupOrientation"];
        
        document.getElementById("enableEngKor").value = options["enableEngKor"];
        document.getElementById("enableKorEng").value = options["enableKorEng"];
        document.getElementById("enableJapaneseKor").value = options["enableJapaneseKor"];
        document.getElementById("enableChineseKor").value = options["enableChineseKor"];

        document.getElementById("enablePronunciation").value = options["enablePronunciation"];
        document.getElementById("enableTranslate").value = options["enableTranslate"];
        
    });
}

function clickHandler(e) {

    switch (e.target.id) {
        case 'save': save_options(); break;
        case 'restoreDefault': restore_defaults(0); break;
    }

}

document.addEventListener('DOMContentLoaded', function () {

    var e = document.getElementsByTagName('input');
    for (var i = 0; i < e.length; i++) {
        if (e[i].type == "button")
            document.getElementById(e[i].id).addEventListener('click', clickHandler);
    }

    jscolor.init();    
    restore_options();
   
});