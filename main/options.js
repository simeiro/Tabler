$(function () {
    //chrome.storage.local.clear();
    chrome.storage.local.get(["bArray","cArray","rArray","oArray","nArray"], (function(value){
        defaultSet(value.bArray,value.cArray,value.rArray,value.oArray,value.nArray);

        switch(Number(value.bArray[2])){
            case 0:
                themeset();
                break;

            case 1:
                themeset(bcolor = "#202020",fcolor = "#f9f9f9");
                break;

            case 2:
                if(window.matchMedia('(prefers-color-scheme: dark)').matches){
                    themeset(bcolor = "#202020",fcolor = "#f9f9f9");
                }else{
                    themeset();
                }
                break;

        };
        $("#resetB").on("click", function () {
            defaultSet(value.bArray,value.cArray,value.rArray,value.oArray,value.nArray);
        });
    }));


    $("#saveB").on("click", function () {
        let bArray = [];//(button)btsm,bstm,bbg,botm,gm,bGm0
        let cArray = [];//(checkbox)cdtn0,cdtn1,cotm0
        let rArray = [];//(range)sBg0
        let oArray = [];//(color,image,その他的な立ち位置)coBg0,iBg0
        let nArray = [];//nbr
        $("input:radio:checked").each(function(){
            bArray.push($(this).val());
        });

        $("input:checkbox").each(function(){
            if(this.checked){
                cArray.push(true);
            }else{
                cArray.push(false);
            };
        });

        $("input[type=range]").each(function(){
            rArray.push($(this).val());
        });

        $("input[type=color]").each(function(){
            oArray.push($(this).val());
        });

        $("input[type=number]").each(function(index){
            nArray.push($(this).val());
        });
        
        if($("#bBg0").prop('checked')){
            themeset();
        }

        if($("#bBg1").prop('checked')){
            themeset(bcolor = "#202020",fcolor = "#f9f9f9");
        }

        chrome.storage.local.set({ bArray: bArray, cArray: cArray, rArray: rArray, nArray: nArray});
        // console.log(bArray, cArray,rArray);
        // console.log(oArray);
        // console.log(nArray);

        if($("#bBg5").prop('checked')){
            let reader = new FileReader();
            let file = $("input[type=file]").prop('files')[0];
            // console.log($("input[type=file]").prop('files'));
            
            if(file){
                // console.log("ファイル有り");
                reader.readAsDataURL(file);
                reader.addEventListener("load", () => {
                    oArray.push(reader.result);
                    chrome.storage.local.set({oArray: oArray});
                    // console.log(oArray);
                }, false);
            }else{
                chrome.storage.local.get(["oArray"], (function(value){
                    if(Boolean[value.oArray[1]]){
                        $("#warning").hide();
                        return;
                    }else{
                        $("#warning").html("画像ファイルが設定されていません");
                        $("#warning").show();
                    }
                }));

                
                chrome.storage.local.set({oArray: oArray});
            };
        };
        window.location.reload();
    });

    $("#sBg0").on('input',function(){
        $(".t_bg").html($(this).val()+"%");
    });
});

/*//音声認識 --fuma
window.SpeechRecognition = window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();//音声認識のオブジェクト生成
recognition.interimResults = true;//認識途中にも結果を取得
recognition.continuous = true;//音声認識を持続
//結果取得時実行
recognition.onresult = (event) => {
    const num = event.results.length;
    const word = event.results[num - 1].length;
    let txt = "";
    txt = event.results[num - 1][word - 1].transcript;
    console.log(event.results[num - 1][word - 1].transcript);
    chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT }, (tabs) => {
        chrome.storage.local.get(["group", "check"], (items) => {
            if (txt == "グループ化" && items.group == "notGrouped") {
                recognition.abort();
                chrome.runtime.sendMessage("group");
                speechSynthesis.speak(new SpeechSynthesisUtterance("タブをグループ化しました．"));
            }
            else if (txt == "グループ解除" && items.group == "grouped") {
                recognition.abort();
                chrome.runtime.sendMessage("ungroup");
                speechSynthesis.speak(new SpeechSynthesisUtterance("グループを解除しました．"));
            }
            else if (txt == "このタブを削除") {
                chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT, active: true }, (activeTabs) => {
                    recognition.abort();
                    chrome.tabs.remove(Number(activeTabs[0].id));
                    speechSynthesis.speak(new SpeechSynthesisUtterance("タブを削除しました．"));
                });
            }
            else if (txt == "前のページ") {
                recognition.abort();
                chrome.tabs.goBack().then(() => { }, () => { });
            }
            else if (txt == "次のページ") {
                recognition.abort();
                chrome.tabs.goForward().then(() => { }, () => { });
            }
            else if (txt.substr(0, 4) == "最大値を" && txt.substr(-3, 3) == "に設定") {
                recognition.abort();
                if (!isNaN(Number(txt.slice(4, -3))) && items.check == true) {
                    maxTabNum = Number(txt.slice(4, -3));//音声コマンドの数字の部分
                    if (maxTabNum < tabs.length) {
                        maxTabNum = tabs.length;
                        speechSynthesis.speak(new SpeechSynthesisUtterance("最大値を現在のタブ数に変更しました．"));
                    }
                    else {
                        speechSynthesis.speak(new SpeechSynthesisUtterance(`最大値を変更しました．`));
                    }
                    chrome.storage.local.set({ maxTabNum: maxTabNum });
                    chrome.runtime.sendMessage("changeMaxTabNum");
                    chrome.runtime.sendMessage("changeIcon");
                }
                else if (items.check == false) {
                    speechSynthesis.speak(new SpeechSynthesisUtterance("制限機能がオンになっていません．"));
                }
            }
            else if (txt == "制限機能オン") {
                recognition.abort();
                chrome.storage.local.set({ maxTabNum: tabs.length });
                chrome.storage.local.set({ check: true });
                chrome.runtime.sendMessage("checkON");
            }
            else if ((txt == "制限機能オフ")) {
                recognition.abort();
                chrome.storage.local.set({ maxTabNum: tabs.length });
                chrome.storage.local.set({ check: false });
                chrome.runtime.sendMessage("checkOFF");
            }
        });
    });
}
//話終わった時実行
recognition.onend = () => {
    recognition.start();
}
recognition.start();*/

function themeset(bcolor = "#f9f9f9",fcolor = "#202020"){//default white
    $("body").css("background-color",bcolor);
    $("body").css("color",fcolor);
    $(".titleborder").css("border-top","5px dotted "+fcolor);
};

function defaultSet(bArray,cArray,rArray,oArray,nArray){
    let allname = [];
    $("input:radio").each(function(){
        allname.push($(this).prop("name"));
    });

    let namelist = $.unique(allname);
    namelist.forEach(function(item,index){
        $("input:radio[name='"+item+"']").val([bArray[index]]);
    });

    $("input:checkbox").each(function(index){
        $(this).prop("checked",cArray[index]);
    });

    $("input[type=range]").each(function(index){//range追加するようなら書き換える
        $(".t_bg").html(rArray[index]+"%");
    });

    $("input[type=number]").each(function(index){
        $(this).val(nArray[index]);
    });

    $("#coBg0").val(oArray[0]);
};
