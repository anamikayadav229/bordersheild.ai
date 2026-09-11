
/* ======================================================================
   BorderShield AI — demo prototype logic (vanilla HTML/CSS/JS, no build step)
   ====================================================================== */

/* ---------------- Navigation ---------------- */
const titles = {
  'dashboard':'Dashboard','new-screening':'New Screening','doc-analysis':'Document Analysis',
  'validation':'Document Validation','tampering':'Tampering Detection','face':'Face Verification',
  'risk':'Risk Assessment','history':'Screening History','trail':'Investigation Trail',
  'reports':'Reports','settings':'Settings'
};
function goto(view){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+view).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active', n.dataset.view===view));
  document.getElementById('page-title').textContent = titles[view] || view;
  if(view==='history') renderHistory();
  if(view==='trail') renderTrail();
  if(view==='reports') populateReportSelect();
  window.scrollTo({top:0,behavior:'instant'});
}
document.getElementById('nav').addEventListener('click', e=>{
  const item = e.target.closest('.nav-item');
  if(item) goto(item.dataset.view);
});

/* Mobile menu toggle: open/close sidebar as overlay on small screens */
const btnMenu = document.getElementById('btn-menu');
const mobileBackdrop = document.getElementById('mobile-backdrop');
if(btnMenu){
  btnMenu.addEventListener('click', ()=> document.body.classList.toggle('sidebar-open'));
}
if(mobileBackdrop){
  mobileBackdrop.addEventListener('click', ()=> document.body.classList.remove('sidebar-open'));
}
document.querySelectorAll('.nav-item').forEach(n=> n.addEventListener('click', ()=>{ if(window.innerWidth<=900) document.body.classList.remove('sidebar-open'); }));

/* ---------------- Clock ---------------- */
function tickClock(){
  const d = new Date();
  document.getElementById('clock').textContent = d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})+' · '+d.toLocaleTimeString('en-IN');
}
tickClock(); setInterval(tickClock,1000);

/* ---------------- Toasts ---------------- */
function toast(msg, kind){
  kind = kind || 'blue';
  const colors = {blue:'var(--cyan)',green:'var(--green)',amber:'var(--amber)',red:'var(--red)'};
  const host = document.getElementById('toast-host');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = '<span class="tdot" style="background:'+colors[kind]+'"></span><span>'+msg+'</span>';
  host.appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; el.style.transition='opacity .25s'; setTimeout(()=>el.remove(),260); }, 3200);
}

/* ---------------- Utility ---------------- */
function rand(min,max){ return Math.random()*(max-min)+min; }
function ri(min,max){ return Math.floor(rand(min,max+1)); }
function pad(n){ return n<10?'0'+n:n; }
let caseCounter = 125;
function nextCaseId(){ caseCounter++; return 'BS-2026-'+String(caseCounter).padStart(5,'0'); }
function nowStr(){ const d=new Date(); return d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}); }
function nowTime(){ return new Date().toLocaleTimeString('en-IN'); }

/* ============================================================
   DEMO DOCUMENT PROFILES
   Each profile fully defines OCR fields, validation, tampering,
   face-match and the resulting risk composition.
   ============================================================ */
const DEMO_PROFILES = [
  {
    id:'clean-passport', title:'Clean Passport', subtitle:'All checks pass', docType:'PASSPORT', country:'India',
    fields:{name:'ARJUN MEHTA', docnum:'P1234567', nationality:'Indian', dob:'15 Aug 2002', doe:'15 Aug 2032', gender:'Male', visanum:'N/A', visatype:'N/A', entry:'Valid', stay:'N/A'},
    fieldConf:{name:98,docnum:96,nationality:97,dob:95,doe:94,gender:99},
    validation:['pass','pass','pass','pass','pass','pass','pass','pass','pass'],
    tamper:[96,4,94,6,95,5,93,3].map((v,i)=> i%2===0 ? {status:'ok',conf:v} : {status:'ok',conf:100-v}),
    suspiciousRegion:false, faceScore:96.4, faceQuality:'Good',
    accent:'#22c55e'
  },
  {
    id:'tampered-passport', title:'Tampered Passport', subtitle:'Manipulation detected', docType:'PASSPORT', country:'India',
    fields:{name:'ROHIT VERMA', docnum:'P9981204', nationality:'Indian', dob:'02 Jan 1994', doe:'02 Jan 2029', gender:'Male', visanum:'N/A', visatype:'N/A', entry:'Flagged', stay:'N/A'},
    fieldConf:{name:91,docnum:62,nationality:89,dob:88,doe:71,gender:97},
    validation:['pass','pass','warn','pass','pass','pass','fail','warn','warn'],
    tamper:[{status:'fail',conf:78},{status:'fail',conf:82},{status:'ok',conf:91},{status:'fail',conf:85},{status:'ok',conf:90},{status:'fail',conf:74},{status:'warn',conf:66},{status:'fail',conf:80}],
    suspiciousRegion:true, faceScore:71.2, faceQuality:'Fair',
    accent:'#e5484d'
  },
  {
    id:'expired-visa', title:'Expired Visa', subtitle:'Validity failure', docType:'VISA', country:'USA',
    fields:{name:'MICHAEL CARTER', docnum:'V5567712', nationality:'American', dob:'22 Nov 1988', doe:'11 Mar 2024', gender:'Male', visanum:'US-88213', visatype:'Tourist (B2)', entry:'Expired', stay:'30 Days'},
    fieldConf:{name:97,docnum:95,nationality:96,dob:94,doe:98,gender:98},
    validation:['pass','pass','pass','pass','fail','pass','pass','pass','warn'],
    tamper:[{status:'ok',conf:95},{status:'ok',conf:93},{status:'ok',conf:96},{status:'ok',conf:90},{status:'ok',conf:92},{status:'ok',conf:94},{status:'ok',conf:91},{status:'ok',conf:89}],
    suspiciousRegion:false, faceScore:93.8, faceQuality:'Good',
    accent:'#e2a336'
  },
  {
    id:'suspicious-id', title:'Suspicious ID', subtitle:'Multiple fraud indicators', docType:'NATIONAL ID', country:'India',
    fields:{name:'SANJAY KUMAR', docnum:'ID7742210', nationality:'Indian', dob:'19 Jun 1990', doe:'19 Jun 2027', gender:'Male', visanum:'N/A', visatype:'N/A', entry:'Flagged', stay:'N/A'},
    fieldConf:{name:82,docnum:58,nationality:85,dob:70,doe:66,gender:93},
    validation:['warn','pass','fail','warn','pass','pass','fail','fail','fail'],
    tamper:[{status:'fail',conf:88},{status:'fail',conf:91},{status:'fail',conf:84},{status:'fail',conf:87},{status:'warn',conf:69},{status:'fail',conf:83},{status:'fail',conf:79},{status:'fail',conf:90}],
    suspiciousRegion:true, faceScore:48.5, faceQuality:'Poor',
    accent:'#e5484d'
  },
  {
    id:'face-mismatch', title:'Face Mismatch Document', subtitle:'Document valid, bearer mismatch', docType:'DRIVING LICENCE', country:'India',
    fields:{name:'PRIYA NAIR', docnum:'DL0092281', nationality:'Indian', dob:'04 Apr 1997', doe:'04 Apr 2031', gender:'Female', visanum:'N/A', visatype:'N/A', entry:'Valid', stay:'N/A'},
    fieldConf:{name:97,docnum:95,nationality:96,dob:96,doe:95,gender:98},
    validation:['pass','pass','pass','pass','pass','pass','pass','pass','pass'],
    tamper:[{status:'ok',conf:96},{status:'ok',conf:94},{status:'ok',conf:95},{status:'ok',conf:91},{status:'ok',conf:93},{status:'ok',conf:92},{status:'ok',conf:90},{status:'ok',conf:89}],
    suspiciousRegion:false, faceScore:32.8, faceQuality:'Good',
    accent:'#e2a336'
  }
];

const VALIDATION_LABELS = ['Document format','Required fields','Document number format','Date of birth consistency','Expiry date','Nationality code','MRZ validation','Checksum validation','Demo database lookup'];
const TAMPER_LABELS = ['Photo Replacement','Text Manipulation','Stamp Forgery','Image Metadata Anomaly','Copy-Paste Artifacts','Inconsistent Fonts','Compression Anomalies','Altered Regions'];

/* ============================================================
   Canvas document renderer — draws a self-contained mock ID
   ============================================================ */
function drawDocument(canvas, profile, w, h){
  w = w || 520; h = h || 330;
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  // background
  const grad = ctx.createLinearGradient(0,0,w,h);
  grad.addColorStop(0,'#eef2f8'); grad.addColorStop(1,'#dfe6f0');
  ctx.fillStyle = grad; ctx.fillRect(0,0,w,h);
  // border
  ctx.strokeStyle = '#9fb0c9'; ctx.lineWidth = 2; ctx.strokeRect(4,4,w-8,h-8);
  // guilloche-style lines
  ctx.strokeStyle = 'rgba(80,110,150,0.12)';
  for(let i=0;i<14;i++){
    ctx.beginPath(); ctx.moveTo(0, i*(h/12)); ctx.bezierCurveTo(w*0.3, i*(h/12)+20, w*0.6, i*(h/12)-20, w, i*(h/12));
    ctx.stroke();
  }
  // header strip
  ctx.fillStyle = profile.accent; ctx.fillRect(0,0,w,34);
  ctx.fillStyle = '#fff'; ctx.font = '700 14px Manrope, sans-serif';
  ctx.fillText(profile.docType + '  ·  DEMO DOCUMENT', 14, 22);
  // photo box
  ctx.fillStyle = '#cbd5e3'; ctx.fillRect(20,54,110,130);
  ctx.strokeStyle = '#8a9ab3'; ctx.strokeRect(20,54,110,130);
  ctx.fillStyle = '#8a9ab3';
  ctx.beginPath(); ctx.arc(75,100,26,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(75,168,42,34,0,Math.PI,0,true); ctx.fill();
  // text fields
  ctx.fillStyle = '#1c2636'; ctx.font = '700 13px Manrope, sans-serif';
  const lines = [
    ['NAME', profile.fields.name],
    ['DOCUMENT NO.', profile.fields.docnum],
    ['NATIONALITY', profile.fields.nationality],
    ['DATE OF BIRTH', profile.fields.dob],
    ['DATE OF EXPIRY', profile.fields.doe],
    ['GENDER', profile.fields.gender]
  ];
  let ly = 66;
  lines.forEach(pair=>{
    ctx.fillStyle = '#5b6b85'; ctx.font = '700 9px Manrope, sans-serif';
    ctx.fillText(pair[0], 146, ly);
    ctx.fillStyle = '#141b28'; ctx.font = '700 13.5px "JetBrains Mono", monospace';
    ctx.fillText(pair[1], 146, ly+15);
    ly += 30;
  });
  // MRZ strip
  ctx.fillStyle = '#101722'; ctx.fillRect(0,h-48,w,48);
  ctx.fillStyle = '#7ee8f2'; ctx.font = '13px "JetBrains Mono", monospace';
  const mrz1 = 'P<IND'+profile.fields.name.replace(/ /g,'<')+'<<<<<<<<<<<<<<<<<<';
  const mrz2 = profile.fields.docnum+'<'+ri(0,9)+'IND'+ri(700101,991231)+'M'+ri(300101,399912)+'<<<<<<<<<<<<<<';
  ctx.fillText(mrz1.slice(0,44), 14, h-28);
  ctx.fillText(mrz2.slice(0,44), 14, h-12);
  // watermark
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = '#3b4a63';
  ctx.font = '700 11px Manrope, sans-serif';
  ctx.translate(w-14,h-58); ctx.rotate(-Math.PI/2);
  ctx.fillText('SIH 2026 • SIMULATED DOCUMENT • NOT A REAL ID', 0, 0);
  ctx.restore();

  // tamper artifact if flagged
  if(profile.suspiciousRegion){
    ctx.save();
    ctx.strokeStyle = 'rgba(229,72,77,0.9)';
    ctx.setLineDash([4,3]);
    ctx.lineWidth = 2;
    ctx.strokeRect(profile._region.x, profile._region.y, profile._region.w, profile._region.h);
    ctx.restore();
  }
}

// assign a fixed suspicious-region rect (in canvas coords) for flagged docs
DEMO_PROFILES.forEach(p=>{
  if(p.suspiciousRegion) p._region = {x:150+ri(0,60), y:150+ri(0,40), w:110+ri(0,30), h:36+ri(0,14)};
});

/* ============================================================
   Demo picker grid
   ============================================================ */
const demoGrid = document.getElementById('demo-grid');
DEMO_PROFILES.forEach((p,idx)=>{
  const card = document.createElement('div');
  card.className = 'demo-card';
  card.innerHTML = '<canvas></canvas><div class="t">'+p.title+'</div><div class="s">'+p.subtitle+'</div>';
  card.onclick = ()=> selectDemo(idx);
  demoGrid.appendChild(card);
  drawDocument(card.querySelector('canvas'), p, 240, 150);
});

function showDemoPicker(){
  document.getElementById('camera-panel').style.display='none';
  document.getElementById('staged-panel').style.display='none';
  document.getElementById('demo-panel').style.display='block';
}

/* ============================================================
   State
   ============================================================ */
let currentCase = null;   // active in-progress / most recent case
let allCases = [];        // history store
let auditLog = [];        // investigation trail
let stagedImageProfile = null; // profile-like object for uploaded/camera docs

function logAudit(caseId, event, detail){
  auditLog.unshift({caseId:caseId, event:event, detail:detail, time:nowTime(), date:nowStr()});
}

/* ---------------- Intake: upload / camera / demo ---------------- */
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
dropZone.addEventListener('click', ()=>fileInput.click());
dropZone.addEventListener('dragover', e=>{e.preventDefault(); dropZone.classList.add('drag');});
dropZone.addEventListener('dragleave', ()=>dropZone.classList.remove('drag'));
dropZone.addEventListener('drop', e=>{
  e.preventDefault(); dropZone.classList.remove('drag');
  if(e.dataTransfer.files.length) handleUploadedFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', e=>{
  if(e.target.files.length) handleUploadedFile(e.target.files[0]);
});

function handleUploadedFile(file){
  if(file.size > 10*1024*1024){ toast('File exceeds 10 MB limit', 'red'); return; }
  // For any real uploaded file we still build a realistic demo analysis,
  // since no government database is actually connected (per prototype scope).
  const base = DEMO_PROFILES[ri(0,DEMO_PROFILES.length-1)];
  const profile = JSON.parse(JSON.stringify(base));
  profile.uploadedFileName = file.name;
  profile.isUserFile = true;
  stagedImageProfile = profile;
  const reader = new FileReader();
  reader.onload = ev=>{
    profile._userImage = ev.target.result;
    stageDocument(profile);
  };
  if(file.type.startsWith('image/')) reader.readAsDataURL(file);
  else { profile._userImage = null; stageDocument(profile); }
}

function stageDocument(profile){
  document.getElementById('demo-panel').style.display='none';
  document.getElementById('camera-panel').style.display='none';
  const panel = document.getElementById('staged-panel');
  panel.style.display='block';
  const canvas = document.getElementById('staged-canvas');
  if(profile._userImage){
    const img = new Image();
    img.onload = ()=>{
      canvas.width = 480; canvas.height = 480*(img.height/img.width);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img,0,0,canvas.width,canvas.height);
    };
    img.src = profile._userImage;
  } else {
    drawDocument(canvas, profile, 480, 300);
  }
  panel.scrollIntoView({behavior:'smooth', block:'nearest'});
}

function selectDemo(idx){
  const base = DEMO_PROFILES[idx];
  const profile = JSON.parse(JSON.stringify(base));
  profile.isDemo = true;
  profile._region = base._region;
  stagedImageProfile = profile;
  stageDocument(profile);
}

function resetIntake(){
  stagedImageProfile = null;
  document.getElementById('staged-panel').style.display='none';
  document.getElementById('demo-panel').style.display='none';
  document.getElementById('camera-panel').style.display='none';
  fileInput.value = '';
}

/* ---------------- Camera (document capture) ---------------- */
let docStream = null;
async function openCamera(){
  document.getElementById('demo-panel').style.display='none';
  document.getElementById('staged-panel').style.display='none';
  const panel = document.getElementById('camera-panel');
  panel.style.display='block';
  const video = document.getElementById('camera-video');
  const shot = document.getElementById('camera-shot');
  video.style.display='block'; shot.style.display='none';
  document.getElementById('btn-capture').style.display='inline-flex';
  document.getElementById('btn-retake').style.display='none';
  document.getElementById('btn-usephoto').style.display='none';
  try{
    docStream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});
    video.srcObject = docStream;
  }catch(err){
    toast('Camera unavailable — falling back to demo document', 'amber');
    panel.style.display='none';
    showDemoPicker();
  }
}
function closeCamera(){
  if(docStream){ docStream.getTracks().forEach(t=>t.stop()); docStream=null; }
  document.getElementById('camera-panel').style.display='none';
}
function captureShot(){
  const video = document.getElementById('camera-video');
  const canvas = document.getElementById('camera-canvas');
  canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 480;
  canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);
  const dataUrl = canvas.toDataURL('image/png');
  document.getElementById('camera-shot').src = dataUrl;
  document.getElementById('camera-video').style.display='none';
  document.getElementById('camera-shot').style.display='block';
  document.getElementById('btn-capture').style.display='none';
  document.getElementById('btn-retake').style.display='inline-flex';
  document.getElementById('btn-usephoto').style.display='inline-flex';
  window._capturedDataUrl = dataUrl;
}
function retakeShot(){
  document.getElementById('camera-video').style.display='block';
  document.getElementById('camera-shot').style.display='none';
  document.getElementById('btn-capture').style.display='inline-flex';
  document.getElementById('btn-retake').style.display='none';
  document.getElementById('btn-usephoto').style.display='none';
}
function usePhoto(){
  const base = DEMO_PROFILES[ri(0,DEMO_PROFILES.length-1)];
  const profile = JSON.parse(JSON.stringify(base));
  profile.isCameraCapture = true;
  profile._userImage = window._capturedDataUrl;
  stagedImageProfile = profile;
  closeCamera();
  stageDocument(profile);
}

/* ---------------- Screening workflow ---------------- */
const SCAN_STEPS = ['Document Detection','OCR Extraction','Document Validation','Tampering Analysis','Face Verification','Risk Assessment','Final Decision'];

function beginScreening(){
  if(!stagedImageProfile){ toast('Please select a document first', 'amber'); return; }
  document.getElementById('ns-intake').style.display='none';
  const scanPanel = document.getElementById('scan-panel');
  scanPanel.style.display='block';
  const caseId = nextCaseId();
  stagedImageProfile.caseId = caseId;
  stagedImageProfile.date = nowStr();
  document.getElementById('scan-case-id').textContent = caseId;

  const stepsList = document.getElementById('steps-list');
  stepsList.innerHTML='';
  SCAN_STEPS.forEach((s,i)=>{
    const row = document.createElement('div');
    row.className = 'step-row ' + (i===0?'active':'wait');
    row.id = 'step-'+i;
    row.innerHTML = '<div class="step-num">'+String(i+1).padStart(2,'0')+'</div>'+
      '<div class="step-body"><div class="t">'+s+'</div><div class="s">'+stepDesc(i)+'</div></div>'+
      '<div class="step-status">'+(i===0?'Scanning...':'Waiting')+'</div>';
    stepsList.appendChild(row);
  });
  document.getElementById('scan-done-actions').style.display='none';
  logAudit(caseId, 'Screening initiated', (stagedImageProfile.isDemo?'Demo document: ':'')+(stagedImageProfile.title||stagedImageProfile.uploadedFileName||'Uploaded document'));
  runStep(0, stagedImageProfile);
  scanPanel.scrollIntoView({behavior:'smooth'});
}

function stepDesc(i){
  return ['Locating document edges and type','Reading text fields from the document',
    'Cross-checking fields and demo database','Scanning for signs of manipulation',
    'Comparing document photo to bearer','Combining module outputs into a score',
    'Issuing the screening verdict'][i];
}

function runStep(i, profile){
  if(i>=SCAN_STEPS.length){ finishScreening(profile); return; }
  const row = document.getElementById('step-'+i);
  const delay = ri(1000,2600);
  setTimeout(()=>{
    row.classList.remove('active');
    // decide warn vs done for validation/tampering/face steps based on profile
    let outcome = 'done';
    if(i===2 && profile.validation.some(v=>v==='fail')) outcome='warn';
    if(i===3 && profile.suspiciousRegion) outcome='warn';
    if(i===4 && profile.faceScore < 60) outcome='warn';
    row.classList.add(outcome);
    row.querySelector('.step-status').textContent = outcome==='warn' ? '⚠ Flagged' : '✓ Completed';
    logAudit(profile.caseId, SCAN_STEPS[i]+' completed', outcome==='warn' ? 'Anomaly flagged for review' : 'No issues found');
    if(i+1<SCAN_STEPS.length){
      const next = document.getElementById('step-'+(i+1));
      next.classList.remove('wait'); next.classList.add('active');
      next.querySelector('.step-status').textContent = 'Scanning...';
    }
    runStep(i+1, profile);
  }, delay);
}

function computeRisk(profile){
  // Component sub-scores (0-100, higher = riskier)
  const ocrAvg = Object.values(profile.fieldConf).reduce((a,b)=>a+b,0)/Object.values(profile.fieldConf).length;
  const ocrRisk = Math.max(0, 100-ocrAvg);
  const failCount = profile.validation.filter(v=>v==='fail').length;
  const warnCount = profile.validation.filter(v=>v==='warn').length;
  const validationRisk = Math.min(100, failCount*18 + warnCount*8);
  const tamperFails = profile.tamper.filter(t=>t.status==='fail').length;
  const tamperWarns = profile.tamper.filter(t=>t.status==='warn').length;
  const tamperRisk = Math.min(100, tamperFails*14 + tamperWarns*7);
  const faceRisk = Math.max(0, 100-profile.faceScore);
  const composite = Math.round(ocrRisk*0.15 + validationRisk*0.30 + tamperRisk*0.30 + faceRisk*0.25);
  return {ocrRisk:Math.round(ocrRisk), validationRisk:Math.round(validationRisk), tamperRisk:Math.round(tamperRisk), faceRisk:Math.round(faceRisk), composite:Math.min(100,composite)};
}

function riskTag(score){
  if(score<=30) return {label:'LOW RISK', color:'var(--green)'};
  if(score<=60) return {label:'MEDIUM RISK', color:'var(--amber)'};
  if(score<=80) return {label:'HIGH RISK', color:'#ef8b2b'};
  return {label:'CRITICAL RISK', color:'var(--red)'};
}
function decisionFromScore(score, faceScore){
  if(score<=30 && faceScore>=60) return {status:'VERIFIED', kind:'ok'};
  if(score>80) return {status:'HIGH RISK — ESCALATE', kind:'bad'};
  return {status:'REVIEW REQUIRED', kind:'warnb'};
}

function finishScreening(profile){
  const risk = computeRisk(profile);
  profile.risk = risk;
  const decision = decisionFromScore(risk.composite, profile.faceScore);
  profile.decision = decision;
  profile.status = decision.status.startsWith('VERIFIED') ? 'Verified' : (decision.status.startsWith('HIGH') ? 'High Risk' : 'Review Required');
  logAudit(profile.caseId, 'Final decision issued', decision.status+' · risk score '+risk.composite+'/100');

  currentCase = profile;
  allCases.unshift(profile);

  document.getElementById('scan-done-actions').style.display='flex';
  toast('Screening complete — '+profile.caseId, decision.kind==='ok'?'green':(decision.kind==='bad'?'red':'amber'));

  populateDocAnalysis(profile);
  populateValidation(profile);
  populateTampering(profile);
  populateFace(profile);
  populateRisk(profile);
  renderDashboardTable();
}

/* ---------------- Document Analysis view ---------------- */
function populateDocAnalysis(profile){
  document.getElementById('da-empty').style.display='none';
  document.getElementById('da-content').style.display='block';
  document.getElementById('da-doctype').textContent = profile.docType;
  document.getElementById('da-doc-conf').textContent = (97.8).toFixed(1)+'% confidence';

  const canvas = document.getElementById('da-canvas');
  const preview = document.getElementById('da-preview');
  preview.querySelectorAll('.field-box').forEach(n=>n.remove());
  if(profile._userImage){
    const img = new Image();
    img.onload = ()=>{
      canvas.width = 560; canvas.height = 560*(img.height/img.width);
      canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
      addFieldBoxes(preview, canvas, false);
    };
    img.src = profile._userImage;
  } else {
    drawDocument(canvas, profile, 560, 350);
    addFieldBoxes(preview, canvas, profile.suspiciousRegion, profile._region);
  }

  const fieldMeta = [
    ['Document Type', profile.docType, null],
    ['Name', profile.fields.name, profile.fieldConf.name],
    ['Document Number', profile.fields.docnum, profile.fieldConf.docnum],
    ['Nationality', profile.fields.nationality, profile.fieldConf.nationality],
    ['Date of Birth', profile.fields.dob, profile.fieldConf.dob],
    ['Date of Expiry', profile.fields.doe, profile.fieldConf.doe],
    ['Gender', profile.fields.gender, profile.fieldConf.gender],
    ['Visa Number', profile.fields.visanum, null],
    ['Visa Type', profile.fields.visatype, null],
    ['Entry Validation', profile.fields.entry, null],
    ['Stay Duration', profile.fields.stay, null],
  ];
  const list = document.getElementById('field-list');
  list.innerHTML='';
  fieldMeta.forEach((f,idx)=>{
    const item = document.createElement('div');
    item.className='field-item';
    const confBadge = f[2]!=null ? '<span class="conf '+(f[2]>=90?'hi':'lo')+'">'+(f[2]>=90?'✓ High Confidence':'⚠ Low Confidence')+' · '+f[2]+'%</span>' : '';
    item.innerHTML = '<div class="k">'+f[0]+'</div><div class="v-row"><div class="v" data-idx="'+idx+'" data-val="'+f[1]+'">'+f[1]+'</div>'+confBadge+'</div>';
    list.appendChild(item);
  });
}
function addFieldBoxes(container, canvas, showSuspect, region){
  const rect = {w:canvas.width, h:canvas.height};
  const boxes = [
    {x:146,y:54,w:150,h:26,label:'NAME'},
    {x:146,y:84,w:150,h:26,label:'DOC NO.'},
    {x:146,y:174,w:150,h:26,label:'DOB'},
    {x:146,y:204,w:150,h:26,label:'EXPIRY'},
  ];
  const scaleX = canvas.clientWidth ? canvas.clientWidth/canvas.width : 1;
  requestAnimationFrame(()=>{
    const displayScale = canvas.getBoundingClientRect().width / canvas.width;
    boxes.forEach(b=>{
      const div = document.createElement('div');
      div.className='field-box';
      div.dataset.label=b.label;
      div.style.left=(b.x*displayScale)+'px';
      div.style.top=(b.y*displayScale)+'px';
      div.style.width=(b.w*displayScale)+'px';
      div.style.height=(b.h*displayScale)+'px';
      container.appendChild(div);
    });
    if(showSuspect && region){
      const div = document.createElement('div');
      div.className='field-box suspect';
      div.dataset.label='SUSPECT';
      div.style.left=(region.x*displayScale)+'px';
      div.style.top=(region.y*displayScale)+'px';
      div.style.width=(region.w*displayScale)+'px';
      div.style.height=(region.h*displayScale)+'px';
      container.appendChild(div);
    }
  });
}
let editMode=false;
function toggleEdit(){
  editMode=!editMode;
  document.getElementById('edit-toggle').textContent = editMode? 'Save Extracted Data':'Edit Extracted Data';
  document.querySelectorAll('#field-list .v[data-val]').forEach(v=>{
    if(editMode){
      const val = v.dataset.val;
      v.innerHTML = '<input type="text" value="'+val+'">';
    } else {
      const input = v.querySelector('input');
      if(input){ v.dataset.val=input.value; v.textContent=input.value; }
    }
  });
  if(!editMode) toast('Extracted data updated','green');
}

/* ---------------- Validation view ---------------- */
function populateValidation(profile){
  document.getElementById('val-empty').style.display='none';
  document.getElementById('val-content').style.display='block';
  const list = document.getElementById('check-list');
  list.innerHTML='';
  VALIDATION_LABELS.forEach((label,i)=>{
    const status = profile.validation[i];
    const cls = status==='pass'?'pass':(status==='warn'?'warnc':'fail');
    const icon = status==='pass' ? '<path d="M9 12l2 2 4-4"/>' : (status==='warn' ? '<path d="M12 9v3M12 16h.01"/>' : '<path d="M6 6l12 12M18 6L6 18"/>');
    const text = status==='pass' ? 'Passed' : (status==='warn' ? 'Warning' : 'Failed');
    const specialText = (i===8) ? (status==='pass' ? 'Match Found' : 'No Match') : text;
    const item = document.createElement('div');
    item.className = 'check-item '+cls;
    item.innerHTML = '<div class="check-ico '+cls+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">'+icon+'</svg></div><div class="ct">'+label+'</div><div class="cs">'+specialText+'</div>';
    list.appendChild(item);
  });
  const failCount = profile.validation.filter(v=>v==='fail').length;
  const warnCount = profile.validation.filter(v=>v==='warn').length;
  const overall = document.getElementById('val-overall');
  if(failCount>0){ overall.innerHTML = '<span class="badge red">FAILED — '+failCount+' check(s) failed</span>'; }
  else if(warnCount>0){ overall.innerHTML = '<span class="badge amber">WARNING — '+warnCount+' item(s) need review</span>'; }
  else { overall.innerHTML = '<span class="badge green">VALID — all checks passed</span>'; }

  document.getElementById('v-record').textContent = 'DEMO-DB-'+ri(10000,99999);
  document.getElementById('v-recstatus').textContent = failCount>1 ? 'Not Found' : 'Active';
  document.getElementById('v-docstatus').textContent = failCount>0 ? 'Flagged' : 'Valid';
  document.getElementById('v-blacklist').textContent = (profile.id==='suspicious-id') ? 'Possible Match' : 'No Match';
}
function toggleDetail(id){
  const el = document.getElementById(id);
  el.classList.toggle('open');
  const trigger = el.previousElementSibling;
  trigger.textContent = (el.classList.contains('open') ? '▾ ' : '▸ ') + trigger.textContent.slice(2);
}

/* ---------------- Tampering view ---------------- */
function populateTampering(profile){
  document.getElementById('tp-empty').style.display='none';
  document.getElementById('tp-content').style.display='block';
  const canvas = document.getElementById('tp-canvas');
  const preview = document.getElementById('tp-preview');
  preview.querySelectorAll('.field-box').forEach(n=>n.remove());
  if(profile._userImage){
    const img = new Image();
    img.onload = ()=>{
      canvas.width=560; canvas.height=560*(img.height/img.width);
      canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
    };
    img.src = profile._userImage;
  } else {
    drawDocument(canvas, profile, 560, 350);
    if(profile.suspiciousRegion){
      requestAnimationFrame(()=>{
        const scale = canvas.getBoundingClientRect().width/canvas.width;
        const div = document.createElement('div');
        div.className='field-box suspect';
        div.dataset.label='ANOMALY';
        div.style.left=(profile._region.x*scale)+'px';
        div.style.top=(profile._region.y*scale)+'px';
        div.style.width=(profile._region.w*scale)+'px';
        div.style.height=(profile._region.h*scale)+'px';
        preview.appendChild(div);
      });
    }
  }
  const note = document.getElementById('tp-region-note');
  if(profile.suspiciousRegion){
    note.style.display='block';
    document.getElementById('tp-x').textContent = profile._region.x;
    document.getElementById('tp-y').textContent = profile._region.y;
    document.getElementById('tp-w').textContent = profile._region.w;
    document.getElementById('tp-h').textContent = profile._region.h;
  } else { note.style.display='none'; }

  const list = document.getElementById('tamper-list');
  list.innerHTML='';
  TAMPER_LABELS.forEach((label,i)=>{
    const t = profile.tamper[i];
    const cls = t.status==='ok'?'pass':(t.status==='warn'?'warnc':'fail');
    const icon = t.status==='ok' ? '<path d="M9 12l2 2 4-4"/>' : '<path d="M12 9v3M12 16h.01"/>';
    const text = t.status==='ok' ? 'No anomaly detected' : (t.status==='warn' ? 'Borderline' : 'Suspicious');
    const item = document.createElement('div');
    item.className='check-item '+cls;
    item.innerHTML = '<div class="check-ico '+cls+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">'+icon+'</svg></div><div class="ct">'+label+'<div style="font-size:11px;color:var(--ink-500);font-weight:600;">'+text+'</div></div><div class="cs">'+t.conf+'%</div>';
    list.appendChild(item);
  });
}
function openEvidence(){ document.getElementById('evidence-modal').classList.add('open'); }
function closeEvidence(){ document.getElementById('evidence-modal').classList.remove('open'); }

/* ---------------- Face verification view ---------------- */
function populateFace(profile){
  document.getElementById('fv-empty').style.display='none';
  document.getElementById('fv-content').style.display='block';
  const docCanvas = document.getElementById('fv-doc-canvas');
  const w = docCanvas.clientWidth || 240, h = docCanvas.clientHeight || 300;
  docCanvas.width=w; docCanvas.height=h;
  const ctx = docCanvas.getContext('2d');
  ctx.fillStyle='#cbd5e3'; ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#8a9ab3';
  ctx.beginPath(); ctx.arc(w/2,h*0.36,Math.min(w,h)*0.16,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(w/2,h*0.78,w*0.3,h*0.26,0,Math.PI,0,true); ctx.fill();
  ctx.fillStyle='#54637d'; ctx.font='700 11px Manrope, sans-serif'; ctx.textAlign='center';
  ctx.fillText(profile.fields.name, w/2, h-14);
  ctx.textAlign='left';

  // reset person slot
  document.getElementById('fv-placeholder').style.display='flex';
  document.getElementById('fv-photo').style.display='none';
  document.getElementById('fv-video').style.display='none';
  document.getElementById('fv-result').style.display='none';
  closeFaceCamera();
}
let faceStream=null;
async function openFaceCamera(){
  const video = document.getElementById('fv-video');
  document.getElementById('fv-placeholder').style.display='none';
  document.getElementById('fv-photo').style.display='none';
  video.style.display='block';
  document.getElementById('fv-capture-btn').style.display='inline-flex';
  try{
    faceStream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'}});
    video.srcObject = faceStream;
  }catch(err){
    toast('Camera unavailable — using simulated capture', 'amber');
    finishFaceCapture();
  }
}
function closeFaceCamera(){
  if(faceStream){ faceStream.getTracks().forEach(t=>t.stop()); faceStream=null; }
  document.getElementById('fv-capture-btn').style.display='none';
}
function captureFace(){
  const video = document.getElementById('fv-video');
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth||320; canvas.height = video.videoHeight||240;
  canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);
  document.getElementById('fv-photo').src = canvas.toDataURL('image/png');
  finishFaceCapture();
}
document.getElementById('fv-file-input').addEventListener('change', e=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ev=>{ document.getElementById('fv-photo').src = ev.target.result; finishFaceCapture(); };
  reader.readAsDataURL(file);
});
function finishFaceCapture(){
  closeFaceCamera();
  document.getElementById('fv-video').style.display='none';
  document.getElementById('fv-placeholder').style.display='none';
  document.getElementById('fv-photo').style.display='block';
  const profile = currentCase;
  const score = profile.faceScore;
  document.getElementById('fv-result').style.display='block';
  document.getElementById('fv-score').textContent = score.toFixed(1)+'%';
  const ring = document.getElementById('fv-ring');
  const circumference = 377;
  ring.style.transition='stroke-dashoffset 1s ease, stroke .3s';
  const offset = circumference - (circumference*Math.min(score,100)/100);
  setTimeout(()=>{ ring.style.strokeDashoffset = offset; ring.style.stroke = score>=60?'var(--cyan)':'var(--red)'; },80);
  document.getElementById('fv-quality').textContent = profile.faceQuality;
  const match = score>=60 ? 'MATCH' : 'MISMATCH';
  document.getElementById('fv-match').textContent = match;
  document.getElementById('fv-match').style.color = score>=60 ? 'var(--green)' : 'var(--red)';
  const badge = document.getElementById('fv-status-badge');
  badge.innerHTML = score>=60 ? '<span class="badge green">VERIFIED</span>' : '<span class="badge red">REVIEW REQUIRED</span>';
  logAudit(profile.caseId, 'Face verification captured', match+' · score '+score.toFixed(1)+'%');
}

/* ---------------- Risk assessment view ---------------- */
function populateRisk(profile){
  document.getElementById('risk-empty').style.display='none';
  document.getElementById('risk-content').style.display='block';
  const risk = profile.risk;
  const tag = riskTag(risk.composite);
  document.getElementById('risk-num').textContent = risk.composite;
  const lbl = document.getElementById('risk-tag');
  lbl.textContent = tag.label;
  lbl.style.color = tag.color;
  lbl.style.background = tag.color+'22';
  lbl.style.border = '1px solid '+tag.color+'55';
  const ring = document.getElementById('risk-ring');
  const circumference = 578;
  ring.style.transition='stroke-dashoffset 1.1s ease, stroke .3s';
  ring.style.stroke = tag.color;
  setTimeout(()=>{ ring.style.strokeDashoffset = circumference - (circumference*risk.composite/100); },100);

  const breakdown = document.getElementById('risk-breakdown');
  const rows = [
    ['OCR Confidence Risk', risk.ocrRisk, 'var(--cyan)'],
    ['Validation Risk', risk.validationRisk, 'var(--blue)'],
    ['Tampering Risk', risk.tamperRisk, 'var(--amber)'],
    ['Face Match Risk', risk.faceRisk, 'var(--red)'],
  ];
  breakdown.innerHTML = rows.map(r=>
    '<div class="bar-row"><span class="lbl">'+r[0]+'</span><div class="bar-track"><div class="bar-fill" style="width:'+r[1]+'%;background:'+r[2]+';"></div></div><span class="pct">'+r[1]+'</span></div>'
  ).join('');

  const indicators = [];
  if(risk.ocrRisk>15) indicators.push('Low-confidence OCR extraction on one or more fields');
  if(profile.validation.includes('fail')) indicators.push('Document failed one or more validation checks');
  if(profile.validation.includes('warn')) indicators.push('Document has unresolved validation warnings');
  if(profile.suspiciousRegion) indicators.push('Suspicious image region flagged by tampering analysis');
  if(profile.tamper.some(t=>t.status==='fail')) indicators.push('Forensic anomaly detected in document imagery');
  if(profile.faceScore<60) indicators.push('Face match score below acceptance threshold');
  if(indicators.length===0) indicators.push('No fraud indicators identified — document and bearer verified successfully');
  const fi = document.getElementById('fraud-indicators');
  fi.innerHTML = indicators.map(t=>'<div style="display:flex;gap:10px;padding:8px 0;font-size:13px;"><span style="color:'+(t.startsWith('No fraud')?'var(--green)':'var(--amber)')+';">●</span>'+t+'</div>').join('');

  const decision = profile.decision;
  const iconPath = decision.kind==='ok' ? '<path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/>' : (decision.kind==='bad' ? '<path d="M12 2l8 3.5v6C20 17 16.5 20.5 12 22 7.5 20.5 4 17 4 11.5v-6L12 2z"/><path d="M12 8v5M12 16h.01"/>' : '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9L2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>');
  document.getElementById('final-decision').innerHTML =
    '<div class="decision-banner '+decision.kind+'">'+
      '<div class="dicon" style="background:rgba(255,255,255,.08);color:'+tag.color+';"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">'+iconPath+'</svg></div>'+
      '<div><div class="dtitle">'+decision.status+'</div><div class="dsub">Case '+profile.caseId+' · Composite risk '+risk.composite+'/100 · '+tag.label+'</div></div>'+
    '</div>';
}

/* ---------------- Dashboard table ---------------- */
const SEED_ROWS = [
  {caseId:'BS-2026-00124', doc:'Passport', name:'Arjun Mehta', country:'India', score:12, status:'Verified', date:'09 Sep 2026'},
  {caseId:'BS-2026-00123', doc:'Visa', name:'Michael Carter', country:'USA', score:68, status:'Review Required', date:'09 Sep 2026'},
  {caseId:'BS-2026-00122', doc:'Passport', name:'Rahul Sharma', country:'India', score:91, status:'High Risk', date:'08 Sep 2026'},
  {caseId:'BS-2026-00121', doc:'National ID', name:'Fatima Noor', country:'UAE', score:22, status:'Verified', date:'08 Sep 2026'},
  {caseId:'BS-2026-00120', doc:'Driving Licence', name:'Elena Petrova', country:'Russia', score:45, status:'Review Required', date:'07 Sep 2026'},
];
function statusBadge(status){
  if(status==='Verified') return '<span class="badge green">Verified</span>';
  if(status==='High Risk') return '<span class="badge red">High Risk</span>';
  return '<span class="badge amber">Review Required</span>';
}
function scoreCell(score){
  const color = score<=30?'var(--green)':(score<=60?'var(--amber)':(score<=80?'#ef8b2b':'var(--red)'));
  return '<span class="mono" style="color:'+color+';font-weight:700;">'+score+'/100</span>';
}
function rowHtml(r, clickable){
  return '<tr'+(clickable?' style="cursor:pointer" onclick="openCase(\''+r.caseId+'\')"':'')+'>'+
    '<td class="mono">'+r.caseId+'</td><td>'+r.doc+'</td><td>'+r.name+'</td><td>'+r.country+'</td>'+
    '<td>'+scoreCell(r.score)+'</td><td>'+statusBadge(r.status)+'</td><td>'+r.date+'</td>'+
    '<td class="tright"><button class="btn btn-sm" onclick="event.stopPropagation();openCase(\''+r.caseId+'\')">View</button></td></tr>';
}
function renderDashboardTable(){
  const rows = allCases.slice(0,6).map(c=>({caseId:c.caseId, doc:c.docType.charAt(0)+c.docType.slice(1).toLowerCase(), name:c.fields.name, country:c.country, score:c.risk.composite, status:c.status, date:c.date}));
  const combined = rows.concat(SEED_ROWS).slice(0,6);
  document.getElementById('dash-table-body').innerHTML = combined.map(r=>rowHtml(r,true)).join('');
}
renderDashboardTable();

/* ---------------- History ---------------- */
function renderHistory(){
  const q = (document.getElementById('hist-search').value||'').toLowerCase();
  const filter = document.getElementById('hist-filter').value;
  const rows = allCases.map(c=>({caseId:c.caseId, doc:c.docType.charAt(0)+c.docType.slice(1).toLowerCase(), name:c.fields.name, country:c.country, score:c.risk.composite, status:c.status, date:c.date}))
    .concat(SEED_ROWS);
  const filtered = rows.filter(r=>{
    const matchQ = !q || r.name.toLowerCase().includes(q) || r.caseId.toLowerCase().includes(q) || r.country.toLowerCase().includes(q);
    const matchF = filter==='all' || r.status===filter;
    return matchQ && matchF;
  });
  const body = document.getElementById('hist-table-body');
  body.innerHTML = filtered.length ? filtered.map(r=>rowHtml(r,true)).join('') :
    '<tr><td colspan="8"><div class="empty"><div class="t">No matching cases</div><div class="s">Try a different search or filter.</div></div></td></tr>';
}
function openCase(caseId){
  const found = allCases.find(c=>c.caseId===caseId);
  if(!found){ toast('This is seed/demo dashboard data — run a live screening to open a full case', 'amber'); return; }
  currentCase = found;
  populateDocAnalysis(found); populateValidation(found); populateTampering(found); populateFace(found); populateRisk(found);
  goto('risk');
}

/* ---------------- Investigation trail ---------------- */
function renderTrail(){
  const list = document.getElementById('trail-list');
  if(auditLog.length===0){
    list.innerHTML = '<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 4h13M8 12h13M8 20h13"/></svg><div class="t">No audit events yet</div><div class="s">Run a screening to populate the investigation trail.</div></div>';
    return;
  }
  list.innerHTML = auditLog.map((e,i)=>
    '<div class="trail-item"><div class="trail-dot-col"><div class="trail-dot"></div>'+(i<auditLog.length-1?'<div class="trail-line"></div>':'')+'</div>'+
    '<div class="trail-body"><div class="t">'+e.event+'</div><div class="s">Case '+e.caseId+' · '+e.detail+'</div><div class="ts">'+e.date+' · '+e.time+'</div></div></div>'
  ).join('');
}

/* ---------------- Reports ---------------- */
function populateReportSelect(){
  const sel = document.getElementById('report-case-select');
  sel.innerHTML = allCases.map(c=>'<option value="'+c.caseId+'">'+c.caseId+' — '+c.fields.name+'</option>').join('');
  if(allCases.length){ document.getElementById('report-empty').style.display='none'; renderReport(); }
  else { document.getElementById('report-empty').style.display='block'; document.getElementById('print-area').innerHTML=''; }
}
function renderReport(){
  const id = document.getElementById('report-case-select').value;
  const c = allCases.find(x=>x.caseId===id);
  if(!c) return;
  const risk = c.risk;
  const tag = riskTag(risk.composite);
  const html =
  '<div class="report-doc" style="margin-top:16px;">'+
    '<h2>BorderShield AI — Screening Report</h2>'+
    '<div class="rsub">SIH 2026 Prototype · Demo Environment · Simulated data only, not connected to any government system.</div>'+
    '<table style="width:100%;margin-bottom:10px;"><tr><td><strong>Case ID</strong><br>'+c.caseId+'</td><td><strong>Date</strong><br>'+c.date+'</td><td><strong>Document Type</strong><br>'+c.docType+'</td><td><strong>Decision</strong><br>'+c.decision.status+'</td></tr></table>'+
    '<h4>Extracted Information</h4>'+
    '<table><tbody>'+
      Object.entries({Name:c.fields.name,'Document Number':c.fields.docnum,Nationality:c.fields.nationality,'Date of Birth':c.fields.dob,'Date of Expiry':c.fields.doe,Gender:c.fields.gender}).map(([k,v])=>'<tr><td>'+k+'</td><td>'+v+'</td></tr>').join('')+
    '</tbody></table>'+
    '<h4>Validation Summary</h4>'+
    '<table><tbody>'+VALIDATION_LABELS.map((l,i)=>'<tr><td>'+l+'</td><td>'+c.validation[i].toUpperCase()+'</td></tr>').join('')+'</tbody></table>'+
    '<h4>Tampering Detection</h4>'+
    '<table><tbody>'+TAMPER_LABELS.map((l,i)=>'<tr><td>'+l+'</td><td>'+c.tamper[i].status.toUpperCase()+' ('+c.tamper[i].conf+'%)</td></tr>').join('')+'</tbody></table>'+
    '<h4>Face Verification</h4>'+
    '<table><tbody><tr><td>Match Score</td><td>'+c.faceScore.toFixed(1)+'%</td></tr><tr><td>Quality</td><td>'+c.faceQuality+'</td></tr></tbody></table>'+
    '<h4>Risk Assessment</h4>'+
    '<table><tbody><tr><td>Composite Risk Score</td><td>'+risk.composite+' / 100 ('+tag.label+')</td></tr><tr><td>Final Decision</td><td>'+c.decision.status+'</td></tr></tbody></table>'+
    '<div style="margin-top:16px;font-size:10.5px;color:#888;">Generated by BorderShield AI demo console on '+nowStr()+' at '+nowTime()+'. This report is for academic demonstration purposes only.</div>'+
  '</div>';
  document.getElementById('print-area').innerHTML = html;
}
function downloadReport(){
  const id = document.getElementById('report-case-select').value;
  const c = allCases.find(x=>x.caseId===id);
  if(!c){ toast('No case selected', 'amber'); return; }
  const risk = c.risk;
  const tag = riskTag(risk.composite);
  let text = 'BORDERSHIELD AI — SCREENING REPORT (SIH 2026 PROTOTYPE — DEMO DATA)\\n';
  text += '================================================================\\n';
  text += 'Case ID: '+c.caseId+'\\nDate: '+c.date+'\\nDocument Type: '+c.docType+'\\n\\n';
  text += 'EXTRACTED INFORMATION\\n----------------------\\n';
  Object.entries({Name:c.fields.name,'Document Number':c.fields.docnum,Nationality:c.fields.nationality,'Date of Birth':c.fields.dob,'Date of Expiry':c.fields.doe,Gender:c.fields.gender}).forEach(([k,v])=>{ text += k+': '+v+'\\n'; });
  text += '\\nVALIDATION\\n----------\\n';
  VALIDATION_LABELS.forEach((l,i)=>{ text += l+': '+c.validation[i].toUpperCase()+'\\n'; });
  text += '\\nTAMPERING DETECTION\\n--------------------\\n';
  TAMPER_LABELS.forEach((l,i)=>{ text += l+': '+c.tamper[i].status.toUpperCase()+' ('+c.tamper[i].conf+'%)\\n'; });
  text += '\\nFACE VERIFICATION\\n-----------------\\nMatch Score: '+c.faceScore.toFixed(1)+'%\\nQuality: '+c.faceQuality+'\\n';
  text += '\\nRISK ASSESSMENT\\n---------------\\nComposite Risk Score: '+risk.composite+'/100 ('+tag.label+')\\nFinal Decision: '+c.decision.status+'\\n';
  text += '\\nThis is a simulated demo report and does not reflect any real government record.\\n';
  const blob = new Blob([text], {type:'text/plain'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = c.caseId+'_screening_report.txt';
  a.click();
  logAudit(c.caseId, 'Report downloaded', 'Screening report exported as text file');
  toast('Report downloaded', 'green');
}

document.getElementById('evidence-modal').addEventListener('click', e=>{ if(e.target.id==='evidence-modal') closeEvidence(); });
