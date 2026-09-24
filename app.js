(function(){
"use strict";
const EX = window.EXERCISES;
const EXM = Object.fromEntries(EX.map(e=>[e.id,e]));
const PRESETS = [5,10,20,30,45,60,90];
const WD = ["日","月","火","水","木","金","土"];

const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2,"0");
const ymd = d => d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const parse = s => { const [y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d); };
const addDays = (d,n) => { const x=new Date(d); x.setDate(x.getDate()+n); return x; };
const fmt = n => Math.round(n).toLocaleString("ja-JP");
const calc = (mets,w,min) => Math.round(mets*w*(min/60)*1.05);
const todayStr = () => ymd(new Date());
const mondayOf = d => { const x=new Date(d.getFullYear(),d.getMonth(),d.getDate()); const wd=(x.getDay()+6)%7; return addDays(x,-wd); };

// ---------- state ----------
const state = {
  logs: [],          // real logs
  weight: 60,
  goal: 4,
  sel: "run",
  histLimit: 10,
};

function sampleLogs(){
  const t = new Date(); const w = 60;
  const plan = [[0,"radio",6],[0,"walk",30],[1,"kinniku",20],[2,"yoga",60],[3,"run",30],[5,"radio",6],[5,"light",10],[6,"kinniku",20],[8,"run",25],[9,"yoga",60],[11,"cycle",40],[12,"radio",6]];
  return plan.map((p,i)=>({id:"s"+i,date:ymd(addDays(t,-p[0])),exId:p[1],minutes:p[2],weight:w,mets:EXM[p[1]].mets,kcal:calc(EXM[p[1]].mets,w,p[2]),createdAt:Date.now()-i*1000,sample:true}));
}
const showingSample = () => state.logs.length===0;
const visibleLogs = () => showingSample() ? sampleLogs() : state.logs;

// ---------- storage（このブラウザに保存） ----------
const LKEY = "ugoita-v1";
function localLoad(){ try{ const r=localStorage.getItem(LKEY); return r?JSON.parse(r):null; }catch(e){ return null; } }
function localSave(){ try{ localStorage.setItem(LKEY, JSON.stringify({logs:state.logs,weight:state.weight,goal:state.goal})); }catch(e){} }

async function addLog(entry){
  state.logs.push({...entry,id:"l"+Date.now()+Math.random().toString(36).slice(2,6)});
  localSave(); render(); return true;
}
async function delLog(id){
  state.logs = state.logs.filter(l=>l.id!==id); localSave(); render();
}
function saveProfile(){ localSave(); }

async function initStore(){
  const l = localLoad();
  if(l){ state.logs=l.logs||[]; state.weight=l.weight||60; state.goal=l.goal||4; $("weight").value=state.weight; $("goal").value=String(state.goal); }
  setStatus("記録はこのブラウザに保存されています。");
  render();
}
function setStatus(t){ $("status").textContent = t; }

// ---------- form ----------
function buildForm(){
  const g = $("exGrid");
  EX.forEach(e=>{
    const b = document.createElement("button");
    b.type="button"; b.className="ex"; b.id="ex-"+e.id; b.dataset.id=e.id;
    b.setAttribute("aria-pressed", e.id===state.sel?"true":"false");
    b.innerHTML = '<span class="n"></span><span class="d"></span><span class="m"></span>';
    b.querySelector(".n").textContent = e.name;
    b.querySelector(".m").textContent = e.mets.toFixed(1)+" METs ・ 標準"+e.min+"分";
    b.querySelector(".d").textContent = e.note;
    b.addEventListener("click",()=>{
      state.sel=e.id;
      g.querySelectorAll(".ex").forEach(x=>x.setAttribute("aria-pressed", x.dataset.id===e.id?"true":"false"));
      $("minutes").value = e.min; updatePreview();
    });
    g.appendChild(b);
  });
  const c = $("chips");
  PRESETS.forEach(m=>{
    const b=document.createElement("button"); b.type="button"; b.className="chip"; b.textContent=m+"分";
    b.addEventListener("click",()=>{ $("minutes").value=m; updatePreview(); });
    c.appendChild(b);
  });
  $("date").value = todayStr();
  $("date").max = todayStr();
  $("minutes").addEventListener("input", updatePreview);
  $("weight").addEventListener("input", ()=>{
    const v = parseFloat($("weight").value);
    if(v>=20 && v<=200){ state.weight = Math.round(v*10)/10; updatePreview(); saveProfile(); }
  });
  $("goal").addEventListener("change", ()=>{ state.goal = Number($("goal").value); render(); saveProfile(); });
  $("form").addEventListener("submit", async ev=>{
    ev.preventDefault();
    const min = Math.round(Number($("minutes").value));
    if(!(min>=1 && min<=600)){ toast("運動時間は1〜600分で入力してください。", true); $("minutes").focus(); return; }
    const date = $("date").value || todayStr();
    const e = EXM[state.sel];
    const entry = {date, exId:e.id, minutes:min, weight:state.weight, mets:e.mets, kcal:calc(e.mets,state.weight,min), createdAt:Date.now()};
    $("save").disabled = true;
    const ok = await addLog(entry);
    $("save").disabled = false;
    if(ok) toast(e.name+" "+min+"分（"+fmt(entry.kcal)+"kcal）を記録しました。");
  });
  updatePreview();
}
function updatePreview(){
  const e = EXM[state.sel];
  const min = Math.max(0, Number($("minutes").value)||0);
  const k = calc(e.mets, state.weight, min);
  $("pvKcal").innerHTML = fmt(k)+"<small>kcal</small>";
  $("pvFormula").innerHTML = e.mets.toFixed(1)+" METs × "+state.weight+"kg<br>× "+min+"分 × 1.05";
}
let toastT=null;
function toast(msg, isErr){
  const t=$("toast"); t.textContent=msg; t.style.color = isErr?"var(--burn)":"var(--pine)";
  clearTimeout(toastT); toastT=setTimeout(()=>{t.textContent="";},5000);
}

// ---------- render ----------
function render(){
  const logs = visibleLogs();
  $("sampleNote").hidden = !showingSample();
  const byDate = {};
  logs.forEach(l=>{ (byDate[l.date] ||= []).push(l); });
  const today = new Date(); const tStr = ymd(today);
  const sum = (arr,k)=>arr.reduce((a,b)=>a+(b[k]||0),0);

  // today
  const tl = byDate[tStr]||[];
  $("sToday").innerHTML = fmt(sum(tl,"kcal"))+"<small>kcal</small>";
  $("sTodayMin").textContent = sum(tl,"minutes")+"分・"+tl.length+"件";

  // week
  const mon = mondayOf(today);
  let wk=0, wkMin=0, days=0; const dots=[];
  for(let i=0;i<7;i++){
    const ds = ymd(addDays(mon,i)); const a = byDate[ds]||[];
    wk+=sum(a,"kcal"); wkMin+=sum(a,"minutes"); if(a.length) days++;
    dots.push('<i class="'+(a.length?"on":"")+(ds===tStr?" today":"")+'" title="'+WD[(i+1)%7]+'"></i>');
  }
  $("sWeek").innerHTML = fmt(wk)+"<small>kcal</small>";
  $("sWeekMin").textContent = wkMin+"分（月曜はじまり）";
  $("sDays").innerHTML = days+"<small>/ "+state.goal+"日</small>";
  $("sDots").innerHTML = dots.join("");

  // streak
  let s=0; let d = tl.length? today : addDays(today,-1);
  while(byDate[ymd(d)]){ s++; d=addDays(d,-1); }
  const dates = Object.keys(byDate).sort();
  let best=0, run=0, prev=null;
  dates.forEach(x=>{ const cur=parse(x); run = (prev && ymd(addDays(prev,1))===x)? run+1 : 1; best=Math.max(best,run); prev=cur; });
  $("sStreak").innerHTML = s+"<small>日</small>";
  $("sBest").textContent = "最長 "+best+"日"+(s>0 && !tl.length?"・今日運動すると更新":"");

  renderChart(byDate, today);
  renderBreakdown(logs, today);
  renderHistory(logs);
}

function niceMax(v){
  if(v<=0) return 100;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for(const m of [1,2,2.5,5,10]){ if(m*p>=v) return m*p; }
  return 10*p;
}
function renderChart(byDate, today){
  const W=640,H=220,L=44,R=10,T=18,B=40; const n=14;
  const cw=(W-L-R)/n;
  const vals=[]; for(let i=n-1;i>=0;i--){ const d=addDays(today,-i); const a=byDate[ymd(d)]||[]; vals.push({d, k:a.reduce((x,y)=>x+y.kcal,0)}); }
  const mx = niceMax(Math.max(...vals.map(v=>v.k)));
  const y = v => T+(H-T-B)*(1-v/mx);
  let s="";
  for(let i=0;i<=4;i++){ const v=mx*i/4; const yy=y(v);
    s+='<line class="grid" x1="'+L+'" x2="'+(W-R)+'" y1="'+yy+'" y2="'+yy+'"/>';
    s+='<text class="axis" x="'+(L-6)+'" y="'+(yy+4)+'" text-anchor="end">'+fmt(v)+'</text>'; }
  const tStr=ymd(today);
  vals.forEach((v,i)=>{
    const x=L+i*cw+cw*0.18, bw=cw*0.64; const isT = ymd(v.d)===tStr;
    if(v.k>0){ const yy=y(v.k);
      s+='<rect class="bar'+(isT?" today":"")+'" x="'+x+'" y="'+yy+'" width="'+bw+'" height="'+(H-B-yy)+'" rx="3"><title>'+(v.d.getMonth()+1)+'/'+v.d.getDate()+' '+fmt(v.k)+'kcal</title></rect>';
      s+='<text class="vlab" x="'+(x+bw/2)+'" y="'+(yy-5)+'" text-anchor="middle">'+fmt(v.k)+'</text>';
    } else {
      s+='<rect class="bar zero" x="'+x+'" y="'+(H-B-2)+'" width="'+bw+'" height="2"/>';
    }
    s+='<text class="axis dlab'+(isT?" today":"")+'" x="'+(x+bw/2)+'" y="'+(H-B+15)+'" text-anchor="middle">'+(v.d.getMonth()+1)+'/'+v.d.getDate()+'</text>';
    s+='<text class="wk" x="'+(x+bw/2)+'" y="'+(H-B+29)+'" text-anchor="middle">'+(isT?"今日":WD[v.d.getDay()])+'</text>';
  });
  $("chart").innerHTML=s;
  const total=vals.reduce((a,b)=>a+b.k,0);
  $("chartAside").textContent = "合計 "+fmt(total)+"kcal・1日平均 "+fmt(total/n)+"kcal";
}

function renderBreakdown(logs, today){
  const ym = today.getFullYear()+"-"+pad(today.getMonth()+1);
  const agg={};
  logs.filter(l=>l.date.startsWith(ym)).forEach(l=>{ const a=(agg[l.exId] ||= {k:0,m:0,c:0}); a.k+=l.kcal; a.m+=l.minutes; a.c++; });
  const rows = Object.entries(agg).sort((a,b)=>b[1].k-a[1].k);
  $("bdAside").textContent = (today.getMonth()+1)+"月・消費カロリー順";
  if(!rows.length){ $("bd").innerHTML='<div class="empty">今月の記録はまだありません。</div>'; return; }
  const mx = rows[0][1].k||1;
  $("bd").innerHTML = rows.map(([id,a])=>{
    const e=EXM[id]||{name:id};
    return '<div class="bd-row"><span>'+e.name+'</span><div class="bd-track"><div class="bd-fill" style="width:'+(a.k/mx*100).toFixed(1)+'%"></div></div><span class="bd-val">'+fmt(a.k)+'kcal・'+a.m+'分・'+a.c+'回</span></div>';
  }).join("");
}

function renderHistory(logs){
  const sorted = [...logs].sort((a,b)=> a.date<b.date?1: a.date>b.date?-1 : (b.createdAt||0)-(a.createdAt||0));
  const groups=[]; const idx={};
  sorted.forEach(l=>{ if(!(l.date in idx)){ idx[l.date]=groups.length; groups.push({date:l.date,items:[]}); } groups[idx[l.date]].items.push(l); });
  $("histAside").textContent = logs.length+"件";
  if(!groups.length){ $("hist").innerHTML='<div class="empty">まだ記録がありません。</div>'; return; }
  const shown = groups.slice(0, state.histLimit);
  const tStr=todayStr(), yStr=ymd(addDays(new Date(),-1));
  const sample = showingSample();
  let h = shown.map(g=>{
    const d=parse(g.date);
    const label = (g.date===tStr?"今日　":g.date===yStr?"昨日　":"")+(d.getMonth()+1)+"月"+d.getDate()+"日（"+WD[d.getDay()]+"）";
    const tot = g.items.reduce((a,b)=>a+b.kcal,0);
    return '<div class="day"><div class="day-h"><span class="dt">'+label+'</span><span class="tot">'+fmt(tot)+' kcal</span></div>'+
      g.items.map(l=>{ const e=EXM[l.exId]||{name:l.exId};
        return '<div class="ent"><span class="en">'+e.name+'</span><span class="em">'+l.minutes+'分</span><span class="ek">'+fmt(l.kcal)+' kcal</span>'+
          (sample?'<span></span>':'<button type="button" class="del" data-id="'+l.id+'" aria-label="'+e.name+'の記録を削除">削除</button>')+'</div>';
      }).join("")+'</div>';
  }).join("");
  if(groups.length>shown.length) h+='<button type="button" class="more" id="more">もっと見る（残り'+(groups.length-shown.length)+'日分）</button>';
  $("hist").innerHTML=h;
  const m=$("more"); if(m) m.addEventListener("click",()=>{ state.histLimit+=10; render(); });
}
$("hist").addEventListener("click", ev=>{
  const b = ev.target.closest(".del"); if(!b) return;
  if(b.classList.contains("arm")){ delLog(b.dataset.id); return; }
  document.querySelectorAll(".del.arm").forEach(x=>{x.classList.remove("arm"); x.textContent="削除";});
  b.classList.add("arm"); b.textContent="本当に削除";
  setTimeout(()=>{ if(b.isConnected){ b.classList.remove("arm"); b.textContent="削除"; } }, 3000);
});

buildForm();
render();
$("save").disabled = true;
initStore().finally(()=>{ $("save").disabled = false; });
})();
