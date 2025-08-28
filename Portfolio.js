
let didInteract = false;

(function(){
const LS_KEY = "pp_state_v1";
const LS_PRESETS = "pp_presets_v1";
const LS_CURRENT = "pp_current_preset_v1";
const LS_TITLE = "pp_title_v1";
const fmt = (n) => new Intl.NumberFormat("ko-KR").format(Number.isFinite(n)? n : 0);
const toNum = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

function numberToKoreanUnit(n, unit){
const units=["","만","억","조","경"];
const small=["","십","백","천"];
const num=["","일","이","삼","사","오","육","칠","팔","구"];
let s=Math.floor(Math.abs(n)).toString();
    if(s==="0") return "";
let parts=[], idx=0;
    while(s.length>0){
    const chunk=s.slice(-4); s=s.slice(0,-4);
    const d=chunk.padStart(4,"0").split("").map(x=>+x);
let part="";
    for(let i=0;i<4;i++){
    const v=d[i]; if(!v) continue;
    if(!(v===1 && i!==3)) part+=num[v];
        part+=small[3-i];
        }
    if(part) parts.unshift(part+units[idx]);
        idx++;
    }
    return (n<0? "마이너스 ":"")+parts.join(" ")+" "+unit;
}

const KEYS = ["krw","gold","silver","usd","jpy","btc","usdt","eth","xrp"];

const totalHangulEl = document.getElementById("totalKRWHangul");
const totalDigitsEl = document.getElementById("totalKRWDigits");
const priceInputs = Object.fromEntries(KEYS.map(k => [k, document.getElementById("p-"+k)]));
const qtyInputs   = Object.fromEntries(KEYS.map(k => [k, document.getElementById("q-"+k)]));
const valCells    = Object.fromEntries(KEYS.map(k => [k, document.getElementById("v-"+k)]));
const titleEl = document.getElementById("title");
const titleModal = document.getElementById("titleModal");
const titleInput = document.getElementById("titleInput");
const titleOk = document.getElementById("titleOk");
const titleCancel = document.getElementById("titleCancel");
const goldBtn = document.getElementById("goldChooserBtn");
const goldModal = document.getElementById("goldModal");
const goldOk = document.getElementById("goldOk");
const goldCancel = document.getElementById("goldCancel");
const goldInputs = {
    "1000": document.getElementById("gci-1000"),
    "500": document.getElementById("gci-500"),
    "375": document.getElementById("gci-375"),
    "187.5": document.getElementById("gci-187_5"),
    "100": document.getElementById("gci-100"),
    "37.5": document.getElementById("gci-37_5"),
    "18.75": document.getElementById("gci-18_75"),
    "10": document.getElementById("gci-10")
};
const silverBtn = document.getElementById("silverChooserBtn");
const silverModal = document.getElementById("silverModal");
const silverOk = document.getElementById("silverOk");
const silverCancel = document.getElementById("silverCancel");
const silverInputs = {
    "1000": document.getElementById("sci-1000"),
    "500": document.getElementById("sci-500"),
    "375": document.getElementById("sci-375"),
    "187.5": document.getElementById("sci-187_5"),
    "100": document.getElementById("sci-100"),
    "37.5": document.getElementById("sci-37_5"),
    "18.75": document.getElementById("sci-18_75"),
    "10": document.getElementById("sci-10")
};

function openTitleDialog(){
    titleInput.value = titleEl.textContent || "";
    titleModal.classList.add("show");
    setTimeout(()=>titleInput.focus(),0);
}
function closeTitleDialog(){
    titleModal.classList.remove("show");
}
function saveTitle(){
    const v = (titleInput.value||"").trim();
    if(!v) {closeTitleDialog(); return; }
    titleEl.textContent = v;
    localStorage.setItem(LS_TITLE, v);
    if (typeof showToast === "function") showToast("제목이 저장되었습니다");
    closeTitleDialog();
}
function bindLongPress(el, fn){
    let t=null;
    const start=()=>{t = setTimeout(fn, 600); };
    const end=()=>{ if(t){clearTimeout(t); t=null;} };
    el.addEventListener("touchstart", start, {passive:true});
    el.addEventListener("mousedown", start);
    ["touchend","touchcancel","mouseup","mouseleave"].forEach(ev=>el.addEventListener(ev,end));
}

function openGoldModal(){
    Object.values(goldInputs).forEach(el => { if (el) el.value = ""; });
    goldModal.classList.add("show");
    if (goldInputs["1000"]) setTimeout(()=>goldInputs["1000"].focus(),0);
}
function closeGoldModal(){
    goldModal.classList.remove("show");
    Object.values(goldInputs).forEach(el=>{ if(el) el.value=""; });
}
function confirmGoldModal(){
    let total=0, has=false;
    Object.entries(goldInputs).forEach(([w,el])=>{
    const q = Number(el && el.value);
    if(Number.isFinite(q) && q>0){has = true; total += parseFloat(w) * q; }
});
if(!has){closeGoldModal(); return; }
    if(qtyInputs.gold){
        qtyInputs.gold.value = Math.round(total * 1000) / 1000;
    didInteract = true;
recalc();
}
closeGoldModal();
}

function openSilverModal(){
    Object.values(silverInputs).forEach(el => { if (el) el.value = ""; });
    silverModal.classList.add("show");
    if (silverInputs["1000"]) setTimeout(()=>silverInputs["1000"].focus(),0);
}
function closeSilverModal(){
    silverModal.classList.remove("show");
    Object.values(silverInputs).forEach(el=>{ if(el) el.value=""; });
}
function confirmSilverModal(){
    let total=0, has=false;
    Object.entries(silverInputs).forEach(([w,el])=>{
        const q = Number(el && el.value);
        if(Number.isFinite(q) && q>0){has = true; total += parseFloat(w) * q; }
    });
    if(!has){closeSilverModal(); return; }
    if(qtyInputs.silver){
        qtyInputs.silver.value = Math.round(total * 1000) / 1000;
    didInteract = true;
recalc();
}
closeSilverModal();
}

function save(){
    if (!didInteract) return;
    const data = { };
    KEYS.forEach(k=>{
        const pEl = priceInputs[k];
    const qEl = qtyInputs[k];
    data[k] = {
        p: (pEl && !pEl.disabled && String(pEl.value).trim()!=="") ? Number(pEl.value) : "",
    q: (qEl && String(qEl.value).trim()!=="") ? Number(qEl.value) : ""
        };
    });
    localStorage.setItem(LS_KEY, JSON.stringify(data));
}

function load(){
    try {
        const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
        KEYS.forEach(k => {
        if (data[k]) {
            if (priceInputs[k] && !priceInputs[k].disabled) {
        priceInputs[k].value = (data[k].p === "" || data[k].p == null) ? "" : data[k].p;
            }
    if (qtyInputs[k]) {
        qtyInputs[k].value = (data[k].q === "" || data[k].q == null) ? "" : data[k].q;
            }
        }
        });
    } catch(e){ }
}

function recalc(){
    let total = 0;
KEYS.forEach(k => {
    const p = toNum(priceInputs[k]?.value || (k==="krw"?1:0));
    const q = toNum(qtyInputs[k]?.value);
    const v = p * q;
    total += v;
    if (valCells[k]) valCells[k].textContent = fmt(v);
    });
    totalDigitsEl.textContent = fmt(total);
    totalHangulEl.textContent = numberToKoreanUnit(total, "원");
    save();
}

const onAnyInput = () => {didInteract = true; recalc(); };
    KEYS.forEach(k => {
    if (priceInputs[k]) priceInputs[k].addEventListener("input", onAnyInput);
    if (qtyInputs[k])   qtyInputs[k].addEventListener("input", onAnyInput);
});

load();
recalc();

function readPresets(){ try{ return JSON.parse(localStorage.getItem(LS_PRESETS)||"{ }"); }catch(e){ return { }; } }
function writePresets(p){localStorage.setItem(LS_PRESETS, JSON.stringify(p)); }

function blankState(){
    const s={ }; KEYS.forEach(k=>{s[k] = { p: (k === "krw" ? 1 : ""), q: "" }; }); return s;
}
function stateFromInputs(){
    const s={ };
    KEYS.forEach(k=>{
        s[k] = {
            p: (priceInputs[k] && !priceInputs[k].disabled && String(priceInputs[k].value).trim() !== "") ? Number(priceInputs[k].value) : "",
            q: (qtyInputs[k] && String(qtyInputs[k].value).trim() !== "") ? Number(qtyInputs[k].value) : ""
        };
    });
    return s;
}
function applyState(s){
    if(!s) return;
    KEYS.forEach(k=>{
        if(s[k]){
        if(priceInputs[k] && !priceInputs[k].disabled) priceInputs[k].value = (s[k].p===""||s[k].p==null) ? "" : s[k].p;
        if(qtyInputs[k]) qtyInputs[k].value = (s[k].q===""||s[k].q==null) ? "" : s[k].q;
            }
    });
    if (priceInputs.krw) priceInputs.krw.value = "1";
        didInteract = true;
        recalc();
}

let toastTimer=null;
function showToast(msg){
    const el=document.getElementById("toast");
    if(!el) return;
    el.textContent=msg;
    el.classList.add("show");
    if(toastTimer) clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>el.classList.remove("show"),1200);
}

function loadCurrentPreset(){
    const n = Number(localStorage.getItem(LS_CURRENT));
    return [1,2,3].includes(n) ? n : 1;
    }
let currentPreset = loadCurrentPreset();

function setCurrentPreset(n){
    currentPreset = n;
    localStorage.setItem(LS_CURRENT, String(n));
    updatePresetUI();
}

function updatePresetUI(){
    const map={1:"presetA",2:"presetB",3:"presetC"};
    ["presetA","presetB","presetC"].forEach(id=>document.getElementById(id)?.classList.remove("pulse"));
document.getElementById(map[currentPreset])?.classList.add("pulse");
}

function bindPresetLoad(btnId, n, key){
    const el=document.getElementById(btnId);
    if(!el) return;
    el.addEventListener("click", ()=>{
        setCurrentPreset(n);
    const p=readPresets();
    applyState(p[key] || blankState());
    });
}
bindPresetLoad("presetA",1,"A");
bindPresetLoad("presetB",2,"B");
bindPresetLoad("presetC",3,"C");

document.getElementById("savePreset").addEventListener("click", ()=>{
    const p=readPresets();
    const key = (currentPreset===1?"A": currentPreset===2?"B":"C");
    p[key] = stateFromInputs();
    writePresets(p);
    showToast(`${currentPreset}번 프리셋에 저장되었습니다`);
});

document.getElementById("resetPresets").addEventListener("click", ()=>{
    localStorage.removeItem(LS_PRESETS);
    localStorage.removeItem(LS_KEY);
    KEYS.forEach(k=>{
        if (priceInputs[k] && !priceInputs[k].disabled) priceInputs[k].value = "";
    if (qtyInputs[k]) qtyInputs[k].value = "";
    });
    if (priceInputs.krw) priceInputs.krw.value = "1";
    didInteract = true;
    recalc();
});

document.getElementById("zeroBtn").addEventListener("click", ()=>{
    KEYS.forEach(k => {
        if (priceInputs[k] && !priceInputs[k].disabled) priceInputs[k].value = "";
        if (qtyInputs[k]) qtyInputs[k].value = "";
    });
    if (priceInputs.krw) priceInputs.krw.value = "1";
        didInteract = true;
        recalc();
});

const quickSheet = document.getElementById("quickSheet");
document.getElementById("toggleSheet").addEventListener("click", ()=> quickSheet.classList.toggle("show"));
document.getElementById("closeSheet").addEventListener("click", ()=> quickSheet.classList.remove("show"));

setCurrentPreset(currentPreset);

const savedTitle = localStorage.getItem(LS_TITLE);
    if(savedTitle) titleEl.textContent = savedTitle;
        bindLongPress(document.querySelector("header"), openTitleDialog);
        titleOk.addEventListener("click", saveTitle);
        titleCancel.addEventListener("click", closeTitleDialog);
        titleModal.addEventListener("click", (e)=>{ if(e.target===titleModal) closeTitleDialog(); });

    if (goldBtn) goldBtn.addEventListener("click", openGoldModal);
    if (goldOk) goldOk.addEventListener("click", confirmGoldModal);
    if (goldCancel) goldCancel.addEventListener("click", closeGoldModal);

    if (silverBtn) silverBtn.addEventListener("click", openSilverModal);
    if (silverOk) silverOk.addEventListener("click", confirmSilverModal);
    if (silverCancel) silverCancel.addEventListener("click", closeSilverModal);

})();