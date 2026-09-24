// 減量目標：目標カロリーから、運動で消費したカロリーを引いて「あと何kcal」かを表示する
// 例）5kg減らしたい → 5 × 7,200 = 36,000kcal が目標
(function(){
  "use strict";
  const KCAL_PER_KG = 7200;      // 体脂肪1kgあたりのカロリー（目安）
  const GKEY = "ugoita-goal";    // 目標の保存場所（このブラウザ）
  const $ = id => document.getElementById(id);
  const pad = n => String(n).padStart(2,"0");
  const ymd = d => d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
  const fmt = n => Math.round(n).toLocaleString("ja-JP");

  // 保存されている目標を読む（なければ 5kg・今日から）
  let goal = { kg: 5, start: ymd(new Date()) };
  try{ const r = localStorage.getItem(GKEY); if(r) goal = Object.assign(goal, JSON.parse(r)); }catch(e){}
  function saveGoal(){ try{ localStorage.setItem(GKEY, JSON.stringify(goal)); }catch(e){} }

  let lastLogs = [];

  // app.js の render() から毎回呼ばれる
  window.renderGoal = function(logs){
    lastLogs = logs || [];
    const target = goal.kg * KCAL_PER_KG;                       // 目標カロリー
    const burned = lastLogs
      .filter(l => l.date >= goal.start)                         // 開始日からの記録だけ
      .reduce((sum, l) => sum + (l.kcal || 0), 0);               // 消費カロリーの合計
    const remain = Math.max(0, target - burned);                 // 目標 − 消費 ＝ 残り
    const pct = target > 0 ? Math.min(100, burned / target * 100) : 0;

    $("gRemain").textContent = remain > 0 ? fmt(remain) : "0";
    $("gFill").style.width = pct.toFixed(1) + "%";
    $("gBar").setAttribute("aria-valuenow", pct.toFixed(0));
    $("gMeta").textContent =
      "目標 " + fmt(target) + "kcal（" + goal.kg + "kg × 7,200kcal）・消費済み " + fmt(burned) + "kcal・達成率 " + pct.toFixed(1) + "%";

    // ペースの目安
    const days = Math.max(1, Math.round((new Date(ymd(new Date())) - new Date(goal.start)) / 86400000) + 1);
    const perDay = burned / days;
    let pace;
    if(remain <= 0){
      pace = "目標達成です。おつかれさまでした！";
    } else if(perDay > 0){
      pace = "開始から" + days + "日・1日平均 " + fmt(perDay) + "kcal。このペースなら、あと約" + fmt(Math.ceil(remain / perDay)) + "日で達成です。";
    } else {
      pace = "1日300kcal運動すると、あと約" + fmt(Math.ceil(remain / 300)) + "日で達成です。";
    }
    $("gPace").textContent = pace;
    document.querySelector(".goal").classList.toggle("done", remain <= 0);
  };

  // 入力欄の準備
  $("goalKg").value = goal.kg;
  $("goalStart").value = goal.start;
  $("goalStart").max = ymd(new Date());
  $("goalKg").addEventListener("input", () => {
    const v = parseFloat($("goalKg").value);
    if(v >= 0.5 && v <= 50){ goal.kg = v; saveGoal(); window.renderGoal(lastLogs); }
  });
  $("goalStart").addEventListener("change", () => {
    if($("goalStart").value){ goal.start = $("goalStart").value; saveGoal(); window.renderGoal(lastLogs); }
  });
})();
