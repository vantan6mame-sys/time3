// 運動の種類のデータ
// mets: 運動の強さ（メッツ）  min: 標準の運動時間（分）
// 参考：国立健康・栄養研究所「改訂版 身体活動のメッツ(METs)表」
window.EXERCISES = [
  {id:"run",    name:"ランニング",   note:"時速8km程度",          mets:8.3, min:30},
  {id:"kinniku",name:"筋肉体操",     note:"自重トレ・きつめ",      mets:5.0, min:20},
  {id:"yoga",   name:"ヨガ",         note:"ハタヨガ",              mets:2.5, min:60},
  {id:"light",  name:"軽い運動",     note:"ストレッチ・軽い体操",  mets:2.3, min:10},
  {id:"radio",  name:"ラジオ体操",   note:"第1・第2",              mets:4.0, min:6},
  {id:"walk",   name:"ウォーキング", note:"普通〜やや速歩",         mets:3.5, min:30},
  {id:"cycle",  name:"サイクリング", note:"時速16〜19km",          mets:6.8, min:30},
  {id:"swim",   name:"水泳",         note:"クロール・ゆっくり",    mets:5.8, min:30},
  {id:"kintore",name:"筋トレ",      note:"ダンベル10kg",          mets:6.0, min30},
  {id:"dansu",name:"ダンス",        note:"kpop",                mets:6.5, min45},
  // ↓ Aさん担当：ここに運動を2つ追加する
];
