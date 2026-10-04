(function(root){
const core=root.EarSyncCore;let journal,account=null,busy=false,timer,apply,lastAt=0,storageOk=true,ready=false,stagedDay=null;
const read=k=>{try{return JSON.parse(localStorage.getItem(k))}catch{return null}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{storageOk=false;return false}};
const id=()=>crypto.randomUUID();
const cacheKey=()=>account?'earlab-sync-account:'+account.id:'earlab-sync-unassigned';
const fingerprint=j=>Object.keys(j.imports).sort().join('|')+';'+Object.keys(j.events).sort().join('|');
function save(){const other=read(cacheKey());if(other?.journal&&core.validate(other.journal))journal=core.merge(other.journal,journal);write(cacheKey(),{journal,account});if(account)write('earlab-sync-active',account)}
function status(text,detail){const label=document.getElementById('sync-label');if(label)label.textContent=text;const note=document.getElementById('sync-detail');if(note)note.textContent=detail;const accountText=document.getElementById('account-name');if(accountText)accountText.textContent=account?.email||'尚未登入';const link=document.getElementById('signin-link');if(link)link.hidden=!!account;const out=document.getElementById('signout-link');if(out)out.hidden=!account;const storage=document.querySelector('.storage-note');if(storage)storage.textContent=text}
function boot(){account=read('earlab-sync-active');const cached=read(cacheKey());journal=cached?.journal;
 if(!core.validate(journal)){journal=core.empty();if(!account){const legacy=read('earlab-v1');if(legacy?.days&&legacy?.stats&&!read('earlab-legacy-imported')){const importId=id();const snapshot=core.copy(legacy);for(const m of ['pitch','interval','chord','rhythm'])snapshot.stats[m]??={total:0,correct:0};journal.imports[importId]={id:importId,at:Date.now(),data:snapshot};if(!core.validate(journal))journal=core.empty()}}}
 lastAt=Math.max(0,...Object.values(journal.events).map(x=>x.at));save();return core.project(journal);
}
function record(event){if(stagedDay&&event.kind!=='daily'){const staged=stagedDay;stagedDay=null;record({kind:'daily',date:staged.date,level:staged.day.level,questions:staged.day.questions})}const eventId=id();lastAt=Math.max(Date.now(),lastAt+1);journal.events[eventId]={...core.copy(event),id:eventId,at:lastAt};save();status(navigator.onLine?'等待同步':'離線待同步',storageOk?'紀錄已暫存於此裝置，連線後會自動同步。':'裝置儲存空間不足，請保持網頁開啟並連線同步。');clearTimeout(timer);timer=setTimeout(sync,350)}
function ensureDay(date,day){if(!ready&&!account&&!Object.keys(journal.imports).length&&!Object.keys(journal.events).length){stagedDay={date,day:core.copy(day)};return}const existing=core.project(journal).days[date];if(day.questions&&(!existing?.questions||!existing.answers.length&&JSON.stringify(existing.questions)!==JSON.stringify(day.questions)))record({kind:'daily',date,level:day.level||'intermediate',questions:day.questions})}
function changeAccount(user){if(account?.id===user.id){account=user;return}
 if(!account){const saved=read('earlab-sync-account:'+user.id);if(saved?.journal&&core.validate(saved.journal))journal=core.merge(saved.journal,journal);account=user;write('earlab-legacy-imported',{accountId:user.id});try{localStorage.removeItem('earlab-sync-unassigned')}catch{}}
 else{account=user;const saved=read(cacheKey());journal=saved?.journal&&core.validate(saved.journal)?saved.journal:core.empty()}
 save();
}
async function sync(){if(busy)return;if(!navigator.onLine){status('離線待同步','可以繼續練習；恢復連線後會自動合併紀錄。');return}busy=true;status('同步中…','正在取得帳號的最新練習紀錄。');
 try{
  const response=await fetch('/api/sync',{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(12000)});
  if(response.status===401){status('登入以同步','請使用同一個 ChatGPT 帳號登入。裝置上的紀錄會保留。');document.getElementById('signin-link').hidden=false;return}
  if(!response.ok)throw new Error('fetch_failed');
  let remote=await response.json();if(!core.validate(remote.journal)||!remote.user?.id)throw new Error('invalid_response');stagedDay=null;ready=true;changeAccount(remote.user);
  for(let attempt=0;attempt<5;attempt++){
   journal=core.merge(remote.journal,journal);save();
   if(fingerprint(journal)===fingerprint(remote.journal))break;
   const snapshot=core.copy(journal),sent=fingerprint(snapshot);
   const result=await fetch('/api/sync',{method:'POST',credentials:'same-origin',signal:AbortSignal.timeout(12000),headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:remote.revision,journal:snapshot})});
   if(result.status!==409&&!result.ok)throw new Error('save_failed');remote=await result.json();if(!core.validate(remote.journal))throw new Error('invalid_response');
   if(result.status===409)continue;
   journal=core.merge(remote.journal,journal);save();if(sent===fingerprint(journal))break;
  }
  if(fingerprint(journal)!==fingerprint(remote.journal))throw new Error('retry_needed');
  save();apply?.(core.project(journal));status('已同步至雲端',`使用 ${account.email||'目前帳號'}，其他裝置登入同一帳號即可接續。`);
 }catch{status('等待重新同步','目前無法連上雲端。紀錄會留在裝置，可繼續練習並稍後重試。');timer=setTimeout(sync,15000)}
 finally{busy=false}
}
function start(callback){apply=callback;document.getElementById('sync-now').onclick=sync;document.getElementById('account-button').onclick=()=>document.getElementById('account-dialog').showModal();document.getElementById('signout-link').onclick=()=>{try{localStorage.removeItem('earlab-sync-active')}catch{}};status('準備同步','登入同一個 ChatGPT 帳號即可跨裝置接續。');sync();window.addEventListener('online',sync);window.addEventListener('offline',()=>status('離線待同步','可以繼續練習；恢復連線後會自動同步。'));document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});setInterval(()=>{if(!document.hidden&&navigator.onLine)sync()},30000);
 if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>status('離線快取未完成','雲端同步仍可使用；首次載入請保持網路連線。'));
}
function recentQuestions(mode,level){return Object.values(journal.events).filter(e=>e.kind==='answer'&&e.question.mode===mode&&e.question.level===level).sort((a,b)=>b.at-a.at).slice(0,60).map(e=>(e.question.mix?root.MixingTraining:root.EarQuestionBank).key(e.question))}
root.EarSync={boot,record,ensureDay,start,sync,recentQuestions};
})(globalThis);
