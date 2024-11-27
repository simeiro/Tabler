chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT }, (tabs) => {
    //popupの大きさ
    if (screen.width <= 600) {//スクリーンが600px以下の場合
        $("body").css("width", "300px");
        $(".URLList").css("font-size", "10px");
        $("#textarea").css("width", "270px");
    }
    else {//スクリーンが600pxより大きい場合
        $("body").css("width", "400px");
        $(".URLList").css("font-size", "16px");
        $("#textarea").css("width", "370px");
    }

    const searchResult = document.getElementById("resultSelect");
    const searchinput = document.getElementById("inputSearch");

    //初期表示
    chrome.storage.local.get(["maxTabNum", "check", "tabGroups", "group", "bArray"], (items) => {
        document.querySelector("#URLListButton").value = "close";
        document.querySelector("#tabGroup").checked = items.group;
        if (items.check == false) {
            chrome.storage.local.set({ maxTabNum: tabs.length });
            document.querySelector("#maxTabNum").value = tabs.length;
        } else {
            document.querySelector("#maxTabNum").value = items.maxTabNum;
        };
        document.querySelector("#check").checked = items.check;
        document.querySelector("#maxTabNum").min = tabs.length;
        chrome.storage.local.set({ groupStatus: "domains" });
        for (let i = 0; i < items.tabGroups.length; i++) {
            let ul = document.createElement("ul");
            ul.innerHTML = items.tabGroups[i][0];
            ul.value = i;
            let img = document.createElement("img");
            img.src = "http://www.google.com/s2/favicons?domain=" + items.tabGroups[i][0];
            ul.prepend(img);
            document.querySelector("#domains").appendChild(ul);
        };
        //rangeの最大タブ数初期表示
        if (items.check == true) {
            document.getElementById("nowTabNum").innerHTML = items.maxTabNum;
            $(".tabRange").css("pointer-events", "auto");
        } else {
            document.getElementById("nowTabNum").innerHTML = "∞";
            $(".tabRange").css("pointer-events", "none");
        }

        setbackground(items.bArray[2]);
        //検索結果欄  --shita
        //--検索結果欄初期表示  あとで検索結果のこしておく処理作りたい
        const defaultOption = document.createElement("option");
        defaultOption.text = "検索結果がここに表示されます。";
        searchResult.replaceChildren(defaultOption);
        searchResult.disabled = true;
        //同一タブ削除ボタン --shita
        switch (items.bArray[1]) {
            case "0":
                var onlyTabs = tabs.filter((tab, index, array) => {
                    return (array.findIndex(nextTab => tab.title === nextTab.title) !== index)
                });
                break;

            case "1":
                var onlyTabs = tabs.filter((tab, index, array) => {
                    return (array.findIndex(nextTab => tab.url === nextTab.url) !== index)
                });
                break;

            case "2":
                var onlyTabs = tabs.filter((tab, index, array) => {
                    // if(1 ===(array.findIndex(nextTab => tab.title === nextTab.title) !== index));
                    return (array.findIndex(nextTab => tab.title === nextTab.title || tab.url === nextTab.url) !== index)
                });
                break;
        };
        if (onlyTabs.length != 0) {
            const h_sametab = document.getElementById("sameTabDelete");
            h_sametab.innerHTML = "重複タブ:" + Number(onlyTabs.length) + "個" + '<button class = "deletetabs_button" id="deleteTabsButton" disabled>削除</button>';
            const deleteTab = document.getElementById("deleteTabsButton");
            deleteTab.disabled = false;
            deleteTab.addEventListener("click", (event) => {
                chrome.tabs.remove(onlyTabs.map((tab) => Number(tab.id)));
                h_sametab.textContent = "重複タブ:0個";
            });
            $(function () {
                $(".deletetabs_button").text("削除");
                $(".deletetabs_button").css({
                    "box-shadow": "0 5px rgb(35, 100, 35)",
                    "visibility": "visible"
                });
            });
        };
    });

    //URLリスト
    document.querySelector("#URLListButton").addEventListener("click", (event) => {
        if (event.target.value == "close") {
            event.target.value = "open";
            event.target.innerHTML = "閉じる"
            //textarea
            let textarea = document.createElement("textarea");
            let txt = "";
            tabs.forEach((tab) => {
                txt += `[${tab.title}] (${tab.url})\n\n`;
            });
            textarea.value = txt;
            document.querySelector("#textarea").appendChild(textarea);
            //copyButton
            let button = document.createElement("button");
            button.innerHTML = "コピー";
            button.value = "copy";
            document.querySelector("#copyButton").appendChild(button);
        }
        else {
            event.target.value = "close";
            event.target.innerHTML = "&ensp;開く&ensp;"
            document.querySelector("#textarea").replaceChildren();
            document.querySelector("#copyButton").replaceChildren();
        };
    });

    //コピーボタン
    document.querySelector("#copyButton").addEventListener("click", (event) => {
        if (event.target.value == "copy") {
            document.getSelection().selectAllChildren(document.querySelector("#textarea"));
            document.execCommand('copy');
        };
    });

    //最大タブ数
    document.querySelector("#maxTabNum").addEventListener("change", () => {
        let maxTabNum = document.querySelector("#maxTabNum").value;
        if (maxTabNum < tabs.length) {
            maxTabNum = tabs.length;
            document.querySelector("#maxTabNum").value = tabs.length;
        }
        chrome.storage.local.set({ maxTabNum: maxTabNum });
        chrome.runtime.sendMessage("changeIcon");
    });

    //最大タブ数checkbox
    document.querySelector("#check").addEventListener("change", () => {
        chrome.storage.local.set({ check: document.querySelector("#check").checked });
        chrome.runtime.sendMessage("changeIcon");
    });

    //タブリスト
    document.querySelector("#domains").addEventListener("click", (event) => {
        chrome.storage.local.get(["groupStatus", "tabGroups"], (items) => {
            let result = 0;
            tabs.forEach((tab) => {
                if (tab.id == event.target.value) {
                    chrome.tabs.update((tab.id), { active: true });
                    result++;
                };
            });
            if (result == 0) {
                document.querySelector("#domains").replaceChildren();
                for (let i = 0; i < items.tabGroups.length; i++) {
                    //domain
                    let ul = document.createElement("ul");
                    ul.innerHTML = items.tabGroups[i][0];
                    ul.value = i;
                    let img = document.createElement("img");
                    img.src = "http://www.google.com/s2/favicons?domain=" + items.tabGroups[i][0];
                    ul.prepend(img);
                    //title
                    if (i == event.target.value && items.groupStatus != i) {
                        for (let j = 2; j < items.tabGroups[i].length; j += 3) {
                            let li = document.createElement("li");
                            li.value = items.tabGroups[i][j + 1];//id
                            li.innerHTML = items.tabGroups[i][j];//title
                            ul.appendChild(li);
                            chrome.storage.local.set({ groupStatus: i });
                        }
                    }
                    else if (i == event.target.value) {
                        chrome.storage.local.set({ groupStatus: "domains" });
                    }
                    document.querySelector("#domains").appendChild(ul);
                };
            };
        });
    });

    //グループ化checkbox
    document.querySelector("#tabGroup").addEventListener("change", (event) => {
        chrome.storage.local.get(["group"], (items) => {
            if (items.group == false) {
                chrome.runtime.sendMessage("group");
            }
            else {
                chrome.runtime.sendMessage("ungroup");
            }
        });
    });

    //検索窓 --shita
    searchinput.addEventListener("change", (event) => {
        searchResult.disabled = false;
        searchResult.replaceChildren();
        chrome.storage.local.get(["bArray"], (value) => {
            var input = event.target.value.toLowerCase();
            switch (value.bArray[0]) {
                case "0":
                    tabs.forEach((tab) => {
                        if (tab.title.toLowerCase().indexOf(input) > -1) {
                            let option = document.createElement("option");
                            option.value = tab.id;
                            option.text = tab.title;
                            searchResult.appendChild(option);
                        };
                    });
                    break;
                case "1":
                    tabs.forEach((tab) => {
                        if (tab.url.toLowerCase().indexOf(input) > -1) {
                            let option = document.createElement("option");
                            option.value = tab.id;
                            option.text = tab.title;
                            searchResult.appendChild(option);
                        };
                    });
                    break;
                case "2":
                    tabs.forEach((tab) => {
                        if (tab.title.toLowerCase().indexOf(input) > -1 || tab.url.toLowerCase().indexOf(input) > -1) {
                            let option = document.createElement("option");
                            option.value = tab.id;
                            option.text = tab.title;
                            searchResult.appendChild(option);
                        };
                    });
                    break;
            }
            let countTabs = document.createElement("option");
            countTabs.setAttribute("selected", true);
            countTabs.text = "ヒット件数: " + searchResult.childElementCount;
            searchResult.prepend(countTabs);
        });
    });

    //検索結果欄  --shita
    searchResult.addEventListener("change", (event) => {
        chrome.tabs.update(Number(event.target.value), { active: true });
    });

    //同一タブ削除ボタン --shita
    $('#config').on('click', (e) => {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('options.html'));
        }
    });
});

//メッセージ取得時実行
chrome.runtime.onMessage.addListener((data) => {
    chrome.storage.local.get(["group", "maxTabNum"], (items) => {
        switch (data) {
            case "changeMaxTabNum":
                document.querySelector("#maxTabNum").value = items.maxTabNum;
                break;
            case "checkON":
                document.querySelector("#check").checked = true;
                document.querySelector("#maxTabNum").value = items.maxTabNum;
                break;
            case "checkOFF":
                document.querySelector("#check").checked = false;
                document.querySelector("#maxTabNum").value = items.maxTabNum;
                break;
            default:
                break;
        }
    });
});

function setbackground(value) {
    let light = "#f9f9f9";
    let dark = "#202020";
    switch (Number(value)) {
        default:
        case 0://white
            $("body").css("background-color", light);
            break;

        case 1://black
            $("body").css("background-color", dark);
            $("body").css("color", light);//とりあえず文字見にくいから設定してるだけ
            break;

        case 2://auto
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                $("body").css("background-color", dark);
            } else {
                $("body").css("background-color", light);
            }
            break;

        case 3://rgb
            chrome.storage.local.get(["oArray"], function (value) {
                $("body").css("background-color", value.oArray[0]);
            });
            break;

        case 4://maguro
            $("body").css("background-image", "url(https://1.bp.blogspot.com/-gq_tAX03Btk/VpjBpezB-kI/AAAAAAAA25Y/s__gB-bb2lc/s1600/bg_natural_ocean.jpg)");
            $(".main").css("background-image", "url(https://4.bp.blogspot.com/-L-oUiflcmD8/VvXe7bOhc3I/AAAAAAAA5KE/YlzixMhJl-UdBETW5PstRAAfqqNyH84QQ/w1200-h630-p-k-no-nu/fish_maguro2.png)");
            break;

        case 5://img
            chrome.storage.local.get(["oArray", "rArray"], function (value) {
                if (Boolean(value.oArray[1])) {
                    $("body").css("background-image", "url(" + value.oArray[1] + ")");
                    $("body").css("background-repeat", "no-repeat");
                    $("body").css("background-size", "cover");
                    // $("body").css("position","relative");
                    $("body::before").css("background-color", "rgba(0, 0, 0, " + value.rArray[0] / 100 + ")");
                } else {
                    $("body").css("background-image", "url(https://1.bp.blogspot.com/-gq_tAX03Btk/VpjBpezB-kI/AAAAAAAA25Y/s__gB-bb2lc/s1600/bg_natural_ocean.jpg)");
                    $(".main").css("background-image", "url(https://4.bp.blogspot.com/-L-oUiflcmD8/VvXe7bOhc3I/AAAAAAAA5KE/YlzixMhJl-UdBETW5PstRAAfqqNyH84QQ/w1200-h630-p-k-no-nu/fish_maguro2.png)");
                };

            });
            break;
    };
};
