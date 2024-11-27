//拡張機能インストール時実行
chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT }, (tabs) => {
        //ストレージの初期値を設定
        const bArray = ["0", "1", "0", "2", "0", "0"];
        const cArray = [false, false, true];
        const rArray = ["50"];
        const oArray = ["#ffcccc"];
        const nArray = [50];
        chrome.storage.local.set({ bArray: bArray, cArray: cArray, rArray: rArray, oArray: oArray, nArray: nArray });
        chrome.storage.local.set({ maxTabNum: tabs.length });
        chrome.storage.local.set({ check: false });
        chrome.storage.local.set({ group: false });
        //ストレージにタブの情報をグループごとに格納
        makeGroups(tabs);
        //アイコンの表示
        displayNum(tabs.length, tabs.length, false);
        makeIcon(tabs.length, tabs.length, false);
    });
});

//タブ更新時実行
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT }, (tabs) => {
        chrome.storage.local.get(["group", "maxTabNum", "check", "bArray", "cArray"], (items) => {
            if (changeInfo.status === "complete") {//ページ読み込みが完了した時
                makeGroups(tabs);
                displayNum(tabs.length, items.maxTabNum, items.check, items.bArray[4]);
                makeIcon(tabs.length, items.maxTabNum, items.check);
                if (items.group == true) {
                    tabGroup();
                };
            };
        });
    });
});

//タブ作成時実行
chrome.tabs.onCreated.addListener((tab) => {
    chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT }, (tabs) => {
        chrome.storage.local.get(["maxTabNum", "check", "bArray", "cArray"], (items) => {
            if (items.check == true && tabs.length > items.maxTabNum) {
                chrome.tabs.remove(Number(tab.id));
                if (items.cArray[2]) {
                    makeNotify("タブ制限超過", items.maxTabNum + "個以上は開けません。")
                };
            };
            displayNum(tabs.length, items.maxTabNum, items.check, items.bArray[4]);
            makeIcon(tabs.length, items.maxTabNum, items.check);
            duplicateVerify(tabs, tab, items.cArray, items.bArray[1]);
        });
    });
});

//タブ削除時実行
chrome.tabs.onRemoved.addListener(() => {
    chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT }, (tabs) => {
        chrome.storage.local.get(["maxTabNum", "check", "bArray"], (items) => {
            makeGroups(tabs);
            displayNum(tabs.length, items.maxTabNum, items.check, items.bArray[4]);
            makeIcon(tabs.length, items.maxTabNum, items.check);
            if (items.check == false) {
                chrome.storage.local.set({ maxTabNum: tabs.length });
            }
        });
    });
});

//メッセージ取得時実行
chrome.runtime.onMessage.addListener((data) => {
    chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT }, (tabs) => {
        chrome.storage.local.get(["maxTabNum", "check", "bArray"], (items) => {
            switch (data) {
                case "changeIcon":
                    displayNum(tabs.length, items.maxTabNum, items.check, items.bArray[4]);
                    makeIcon(tabs.length, items.maxTabNum, items.check);
                    break;
                case "group":
                    tabGroup();
                    break;
                case "ungroup":
                    tabUngroup();
                    break;
                case "checkON":
                    displayNum(tabs.length, items.maxTabNum, items.check, items.bArray[4]);
                    makeIcon(tabs.length, items.maxTabNum, items.check);
                    break;
                case "checkOFF":
                    displayNum(tabs.length, items.maxTabNum, items.check, items.bArray[4]);
                    makeIcon(tabs.length, items.maxTabNum, items.check);
                    break;
                default:
                    break;
            }
        });
    });
});

//アイコンを作成する関数
function makeIcon(tabsLength, maxTabNum, check) {
    const canvas = new OffscreenCanvas(16, 16);
    const context = canvas.getContext('2d');
    const colorDegree = 255 - Math.pow(1 / 255, 1.5) * Math.pow(255 * (tabsLength / maxTabNum), 2.5) //限界値に近づくほど色合いの変化を上げる
    context.clearRect(0, 0, 16, 16);
    if (check == true) {
        context.fillStyle = `rgb(255, ${colorDegree}, ${colorDegree})`; //白→赤のグラデーション
    } else {
        context.fillStyle = "rgb(0, 255, 0)"; //∞なら緑
    }
    context.fillRect(0, 0, 16, 16);
    const imageData = context.getImageData(0, 0, 16, 16);
    chrome.action.setIcon({ imageData: imageData }, () => {
    });
}
//アイコン下に現在のタブ数を表示する関数
function displayNum(tabsLength, maxTabNum, check, value = "0") {
    switch (value) {
        case "0": //通常表示
            if (tabsLength == maxTabNum && check == true) {
                chrome.action.setBadgeText({ text: String("MAX") });
            } else if (check == true && maxTabNum < 100) {
                chrome.action.setBadgeText({ text: String(tabsLength + "/" + maxTabNum) });
            } else { //check == false
                chrome.action.setBadgeText({ text: String(tabsLength) });
            };
            break;
        case "1": //残数表示
            if (check == true && maxTabNum - tabsLength < 10000) {
                chrome.action.setBadgeText({ text: String(maxTabNum - tabsLength) });
            } else {
                chrome.action.setBadgeText({ text: String("∞") });
            };
            break;
    };
};
//タブをグループ化する関数
function tabGroup() {
    chrome.storage.local.get(["tabGroups", "group", "bArray"], (items) => {
        for (let i = 0; i < items.tabGroups.length; i++) {
            //配列にタブのidを格納
            let tabIdList = [];
            for (let j = 3; j < items.tabGroups[i].length; j += 3) {
                tabIdList.push(items.tabGroups[i][j]);
            }
            //グループ化
            chrome.tabs.ungroup(tabIdList);
            chrome.tabs.group({ tabIds: tabIdList });
            chrome.storage.local.set({ group: true });
            if (items.bArray[5] == "1") {
                chrome.tabs.ungroup(tabIdList);
            }
        }
    });
}
//グループを解除する関数
function tabUngroup() {
    chrome.storage.local.get(["tabGroups", "group"], (items) => {
        for (let i = 0; i < items.tabGroups.length; i++) {
            //配列にタブのidを格納
            let tabIdList = [];
            for (let j = 3; j < items.tabGroups[i].length; j += 3) {
                tabIdList.push(items.tabGroups[i][j]);
            }
            //グループ解除
            chrome.tabs.ungroup(tabIdList);
            chrome.storage.local.set({ group: false });
        }
    });
}
//ストレージにタブの情報をグループごとに格納する関数
function makeGroups(tabs) {
    let tabGroups = [];
    tabs.forEach((tab) => {
        //ロード中のタブのURLを取得
        if (tab.url == "") {
            tab.url = tab.pendingUrl;
        }
        const info = tab.url.split("/");
        let sameDomainNum = 0;
        //index0にドメイン，1からはURL，タイトル，IDの順で格納
        for (let i = 0; i < tabGroups.length; i++) {
            const infoOfgroupI = tabGroups[i][1].split("/");
            if (info[0] + info[2] == infoOfgroupI[0] + infoOfgroupI[2]) {
                tabGroups[i].push(tab.url, tab.title, tab.id);
                sameDomainNum++;
            };
        };
        if (sameDomainNum == 0 && info[2] == "") {
            const domain = info[3];
            tabGroups.push([domain, tab.url, tab.title, tab.id]);
        }
        else if (sameDomainNum == 0) {
            const domain = info[2];
            tabGroups.push([domain, tab.url, tab.title, tab.id]);
        };
        chrome.storage.local.set({ tabGroups: tabGroups });
    });
};

function duplicateVerify(tabs, target, cArray) {
    let tabsArray = [];
    if (tabs.length == 1) {
        return -1;
    }
    if (cArray[1] == true || cArray[0] == true) {
        let sameIndex = detectDuplicate(tabs, target)
        if (sameIndex != -1) {
            if (cArray[1] == true) {
                if (cArray[0] == true) {
                    makeNotify("重複タブ削除", tabs[sameIndex].title + "を削除しました。")
                };
                if (tabs[sameIndex].active) {
                    chrome.tabs.remove(target.id);
                } else {
                    chrome.tabs.remove(tabs[sameIndex].id);
                };
            } else if (cArray[0] == true) {
                makeNotify("重複タブ検知", tabs[sameIndex].title + "が重複しています。")
            };
        };
    };

    //urlのみでしか検索かけれん。
    function detectDuplicate(tabs, target) {
        tabs.forEach(function (value) {
            tabsArray.push(value.url);
        });
        return tabsArray.indexOf(target.pendingUrl);
    };
};

function makeNotify(title = "title未設定", message = "message未設定") {
    const notify = {
        type: "basic",
        title: title,
        message: message,
        iconUrl: "./taber128.png"
    };
    chrome.notifications.create(notify);
};
