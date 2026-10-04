(function(root){
const modes=['eq','gain','compression','pan'];
const meta={eq:{name:'EQ 頻段',q:'B 的哪個頻段被改變了？',instruction:'A 是原音，B 經過 EQ。比較音色，選出提升或衰減的中心頻率。',tip:'低頻影響厚度，低中頻影響混濁，中高頻影響存在感，高頻影響明亮度。'},gain:{name:'音量差',q:'B 比 A 的音量改變了多少？',instruction:'比較同一段素材的音量。正值代表 B 更大聲，負值代表 B 更小聲。',tip:'保持裝置音量固定，專注整體音量，不要調整 A／B 的播放音量。'},compression:{name:'壓縮動態',q:'哪一段的動態被壓縮了？',instruction:'A／B 已匹配平均音量。聽鼓點瞬態與強弱差，找出被壓縮的一段。',tip:'平均音量相同時，注意鼓點的衝擊、強弱變化與尾音密度。'},pan:{name:'立體聲定位',q:'B 的聲音位於哪裡？',instruction:'A 位於中央。戴上立體聲耳機，辨認 B 的左右位置。',tip:'請關閉装置的單聲道音訊功能。聲像位置由左右聲道的相對能量決定。'}};
const pools={};
for(const level of ['beginner','intermediate','advanced']){
 const frequencies=level==='beginner'?[125,500,2000,8000]:level==='intermediate'?[80,160,315,630,1250,2500,5000,10000]:[63,100,160,250,400,630,1000,1600,2500,4000,6300,10000];
 const changes=level==='beginner'?[-6,-3,3,6]:level==='intermediate'?[-4,-2,-1,1,2,4]:[-2,-1,-.5,.5,1,2];
 const positions=level==='beginner'?[-1,-.5,.5,1]:level==='intermediate'?[-.75,-.5,-.25,.25,.5,.75]:[-.6,-.4,-.2,-.1,.1,.2,.4,.6];
 const settings={beginner:{threshold:-28,ratio:10,attack:.003,release:.08},intermediate:{threshold:-23,ratio:5,attack:.01,release:.12},advanced:{threshold:-18,ratio:3,attack:.025,release:.18}}[level];
 const pool=pools[level]=Object.fromEntries(modes.map(m=>[m,[]]));
 const add=(mode,mix,answer,detail)=>pool[mode].push({mode,level,mix,notes:[mix.seed],answer,detail});
 for(let seed=1;seed<=16;seed++){
  const amount=level==='beginner'?9:level==='intermediate'?6:3;
  for(const frequency of frequencies)for(const db of [amount,-amount])add('eq',{seed,frequency,db,q:level==='advanced'?2:1},frequency+' Hz',`B 在 ${frequency} Hz ${db>0?'提升':'衰減'} ${Math.abs(db)} dB。已匹配平均音量，避免靠音量猜答案。`);
  for(const db of changes)add('gain',{seed,db},(db>0?'+':'')+db+' dB',`B 的增益為 ${db>0?'+':''}${db} dB，振幅是 A 的 ${(10**(db/20)).toFixed(2)} 倍。`);
  for(const side of ['A','B'])add('compression',{seed,...settings,side},side,`${side} 經過壓縮：比率 ${settings.ratio}:1，啟動 ${Math.round(settings.attack*1000)} ms，釋放 ${Math.round(settings.release*1000)} ms。已匹配平均音量。`);
  for(const pan of positions)add('pan',{seed,pan},`${pan<0?'左':'右'} ${Math.round(Math.abs(pan)*100)}%`,`B 的聲像為${pan<0?'左':'右'} ${Math.round(Math.abs(pan)*100)}%。A 位於中央。`);
 }
}
function key(q){return q.mode+'|'+JSON.stringify(q.mix)}
function shuffle(a,r){const c=a.slice();for(let i=c.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[c[i],c[j]]=[c[j],c[i]]}return c}
function sample(mode,level,count,r=Math.random,recent=[]){const used=new Set(recent),pool=pools[level][mode],order=[...shuffle(pool.filter(q=>!used.has(key(q))),r),...shuffle(pool.filter(q=>used.has(key(q))),r)];const labels=[...new Set(pool.map(q=>q.answer))];return order.slice(0,count).map(q=>({...q,notes:q.notes.slice(),mix:{...q.mix},opts:shuffle([q.answer,...shuffle(labels.filter(s=>s!==q.answer),r).slice(0,3)],r)}))}
function measure(a){let sum=0,peak=0;for(const v of a){sum+=v*v;peak=Math.max(peak,Math.abs(v))}return {rms:Math.sqrt(sum/a.length),peak}}
function source(seed,rate=24000){const out=new Float32Array(rate*3);let state=seed*99991,pink=0;const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296*2-1};
 for(let i=0;i<out.length;i++){const t=i/rate,beat=t%(.375+(seed%3)*.02),noise=rand();pink=.97*pink+.03*noise;
 const kick=Math.sin(2*Math.PI*(55+seed%4*7)*t)*Math.exp(-beat*25),snare=noise*Math.exp(-((t+.19)%.4)*38),chord=[110,138.59,164.81].reduce((s,f)=>s+Math.sin(2*Math.PI*f*(1+(seed%4)*.03)*t),0)/3;
 const dynamics=[1,.25,.6,.18,.9,.3,.5,.22][Math.floor(t/.375)%8];out[i]=dynamics*(.36*kick+.24*snare+.18*noise+.25*pink+.16*chord);
 }const scale=.12/measure(out).rms;for(let i=0;i<out.length;i++)out[i]*=scale;return out;
}
function rmsStereo(b){let sum=0;for(let c=0;c<b.numberOfChannels;c++)for(const v of b.getChannelData(c))sum+=v*v;return Math.sqrt(sum/(b.length*b.numberOfChannels))}
async function render(q){const rate=24000,samples=source(q.mix.seed,rate);
 async function variant(processed){const ctx=new OfflineAudioContext(2,samples.length,rate),buffer=ctx.createBuffer(1,samples.length,rate);buffer.copyToChannel(samples,0);const input=ctx.createBufferSource();input.buffer=buffer;let tail=input;
 if(processed&&q.mode==='eq'){const eq=ctx.createBiquadFilter();eq.type='peaking';eq.frequency.value=q.mix.frequency;eq.gain.value=q.mix.db;eq.Q.value=q.mix.q;tail.connect(eq);tail=eq}
 if(processed&&q.mode==='compression'){const c=ctx.createDynamicsCompressor();for(const p of ['threshold','ratio','attack','release'])c[p].value=q.mix[p];c.knee.value=6;tail.connect(c);tail=c}
 const gain=ctx.createGain();gain.gain.value=processed&&q.mode==='gain'?10**(q.mix.db/20):1;tail.connect(gain);const pan=ctx.createStereoPanner();pan.pan.value=processed&&q.mode==='pan'?q.mix.pan:0;gain.connect(pan);pan.connect(ctx.destination);input.start();return ctx.startRendering()}
 const [dry,wet]=await Promise.all([variant(false),variant(true)]);
 if(q.mode==='eq'||q.mode==='compression'){const ratio=rmsStereo(dry)/rmsStereo(wet);for(let c=0;c<2;c++){const a=wet.getChannelData(c);for(let i=0;i<a.length;i++)a[i]*=ratio}}
 let peak=0;for(const b of [dry,wet])for(let c=0;c<2;c++)peak=Math.max(peak,measure(b.getChannelData(c)).peak);
 if(peak>.8)for(const b of [dry,wet])for(let c=0;c<2;c++){const a=b.getChannelData(c);for(let i=0;i<a.length;i++)a[i]*=.8/peak}
 return q.mode==='compression'&&q.mix.side==='A'?{A:wet,B:dry}:{A:dry,B:wet};
}
function valid(q){const m=q.mix;if(!m||!Number.isInteger(m.seed)||m.seed<1||m.seed>16)return false;
 if(q.mode==='eq')return Number.isFinite(m.frequency)&&m.frequency>=63&&m.frequency<=10000&&[3,6,9,-3,-6,-9].includes(m.db)&&[1,2].includes(m.q)&&q.answer===m.frequency+' Hz';
 if(q.mode==='gain')return [-6,-4,-3,-2,-1,-.5,.5,1,2,3,4,6].includes(m.db)&&q.answer===(m.db>0?'+':'')+m.db+' dB';
 if(q.mode==='compression')return ['A','B'].includes(m.side)&&q.answer===m.side&&[-28,-23,-18].includes(m.threshold)&&[10,5,3].includes(m.ratio)&&[.003,.01,.025].includes(m.attack)&&[.08,.12,.18].includes(m.release);
 if(q.mode==='pan')return Number.isFinite(m.pan)&&Math.abs(m.pan)>0&&Math.abs(m.pan)<=1&&q.answer===`${m.pan<0?'左':'右'} ${Math.round(Math.abs(m.pan)*100)}%`;
 return false;
}
root.MixingTraining={modes,meta,pools,key,sample,source,measure,render,valid};
})(globalThis);
