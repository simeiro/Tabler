$(function(){
    //タブ検索窓-simeiro

    //開くボタンを押した時には
    $(".open-btn").on("click",function () {
        $("#search-wrap").removeClass('result');
        $("#search-wrap").addClass('panelactive');//#search-wrapへpanelactiveクラスを付与
        $('#inputSearch').focus();//テキスト入力のinputにフォーカス
    });
    //enterキーを押したとき
    $("input[type='text']").on("keydown", function(e){    
        if(e.which == 13){//enterキー
            $("#search-wrap").addClass('result');//検索窓だけを非表示
            $(".result_select").addClass('active');
        }
    });
    //検索ボタンを押したとき
    $("#searchsubmit").on("click", function(){
        $("#search-wrap").addClass('result');//検索窓だけを非表示
        $(".result_select").addClass('active');
    });
    //閉じるボタンを押した時には
    $(".close-btn").on("click", function () {
        $("#search-wrap").removeClass('panelactive');//#search-wrapからpanelactiveクラスを除去
        $(".result_select").removeClass('active');
    });
    // タブ検索窓終了

    //現在Tab数表示range-simeiro
    $(".tabRange").on("input", function(){
        chrome.storage.local.get("nArray", (items) =>{
            $(".tabRange").prop("max", `${items.nArray[0]}`);//コード追加しそうなら訂正してください
        });
        let val = $(this).val();
        $("#nowTabNum").html(val);
    });

    $("#check").on("click", function(){
        chrome.storage.local.get(["maxTabNum", "check"], (items) =>{
            if(items.check == true){
                $("#nowTabNum").html("∞");
                $(".tabRange").css("pointer-events", "none");
            }else{
                $("#nowTabNum").html(items.maxTabNum);
                $(".tabRange").css("pointer-events", "auto");
            }
        }); 
    });
    //現在Tab数表示range終了
});
