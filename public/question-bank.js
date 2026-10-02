(function(root){
const levelNames=['beginner','intermediate','advanced'];
const noteNames=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
const name=midi=>noteNames[midi%12]+(Math.floor(midi/12)-1);
const intervalTypes=[
 ['小二度',1],['大二度',2],['小三度',3],['大三度',4],['完全四度',5],['三全音',6],['完全五度',7],['小六度',8],['大六度',9],['小七度',10],['大七度',11],['完全八度',12],['小九度',13],['大九度',14],['完全十一度',17],['完全十二度',19]
];
const chordTypes=[
 ['大三和弦',[0,4,7]],['小三和弦',[0,3,7]],['減三和弦',[0,3,6]],['增三和弦',[0,4,8]],
 ['大七和弦',[0,4,7,11]],['小七和弦',[0,3,7,10]],['屬七和弦',[0,4,7,10]],['半減七和弦',[0,3,6,10]],
 ['減七和弦',[0,3,6,9]],['小大七和弦',[0,3,7,11]],['增大七和弦',[0,4,8,11]],['掛四和弦',[0,5,7]]
];
const pools=Object.fromEntries(levelNames.map(l=>[l,{pitch:[],interval:[],chord:[],rhythm:[]}]))
const key=q=>q.mode+'|'+(q.presentation||'melodic')+'|'+q.notes.join(',');
for(const level of levelNames){
 const pool=pools[level];
 const highest=level==='beginner'?71:level==='intermediate'?83:95;
 for(let midi=48;midi<=highest;midi++){
  if(level!=='advanced'&&noteNames[midi%12].includes('♯'))continue;
  pool.pitch.push({mode:'pitch',level,answer:name(midi),notes:[midi],detail:`${name(midi)}：比參考音 C4 ${midi===60?'相同':midi>60?'高 '+(midi-60)+' 個半音':'低 '+(60-midi)+' 個半音'}。音名後的數字代表八度。`});
 }
 const allowed=level==='beginner'?[2,3,4,5,7]:level==='intermediate'?[1,2,3,4,5,7,8,12]:intervalTypes.map(x=>x[1]);
 const presentations=level==='beginner'?['ascending']:level==='intermediate'?['ascending','descending']:['ascending','descending','harmonic'];
 for(const [answer,distance] of intervalTypes.filter(x=>allowed.includes(x[1])))for(let midi=48;midi<=71;midi++)for(const presentation of presentations){
  const notes=presentation==='descending'?[midi+distance,midi]:[midi,midi+distance];
  pool.interval.push({mode:'interval',level,answer,notes,presentation,detail:`相距 ${distance} 個半音，${presentation==='ascending'?'由低到高':presentation==='descending'?'由高到低':'兩個音同時發聲'}。`});
 }
 const qualities=chordTypes.slice(0,level==='beginner'?2:level==='intermediate'?4:chordTypes.length);
 for(const [answer,steps] of qualities)for(let midi=48;midi<=71;midi++){
  // Symmetric diminished sevenths and suspended chords use root position.
  const inversions=level==='beginner'||answer==='減七和弦'||answer==='掛四和弦'?1:steps.length;
  for(let inversion=0;inversion<inversions;inversion++){
   const notes=steps.map((s,i)=>midi+s+(i<inversion?12:0)).sort((a,b)=>a-b);
   pool.chord.push({mode:'chord',level,answer,notes,inversion,detail:`${answer}，根音 ${name(midi)}，${inversion?`第 ${inversion} 轉位`:'原位'}。由低到高的音：${notes.map(name).join('、')}。`});
  }
 }
 pool.rhythm=root.RhythmTraining.pools[level].map(p=>({mode:'rhythm',level,answer:p.n,notes:p.s.slice(),detail:p.t}));
 for(const mode of Object.keys(pool)){const seen=new Set();pool[mode]=pool[mode].filter(q=>{const k=key(q);if(seen.has(k))return false;seen.add(k);return true})}
}
function shuffle(a,random){const copy=a.slice();for(let i=copy.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}return copy}
function decorate(q,random){
 const candidates=[...new Set(pools[q.level][q.mode].map(x=>x.answer))].filter(a=>a!==q.answer);
 // Keep pitch distractors in the same octave whenever possible.
 const near=q.mode==='pitch'?candidates.filter(a=>a.slice(-1)===q.answer.slice(-1)):candidates;
 const options=near.length>=3?near:candidates;
 return {...q,notes:q.notes.slice(),opts:shuffle([q.answer,...shuffle(options,random).slice(0,3)],random)};
}
function sample(mode,level,count,random=Math.random,recent=[]){
 const pool=pools[level][mode],rank=new Map(recent.map((k,i)=>[k,i])),fresh=shuffle(pool.filter(q=>!rank.has(key(q))),random);
 const old=pool.filter(q=>rank.has(key(q))).sort((a,b)=>rank.get(key(b))-rank.get(key(a)));
 const order=[...fresh,...old],result=[];
 while(result.length<count){for(const q of order){result.push(decorate(q,random));if(result.length===count)break}}
 return result;
}
function counts(level){return Object.fromEntries(Object.entries(pools[level]).map(([mode,questions])=>[mode,questions.length]))}
root.EarQuestionBank={pools,sample,counts,key};
})(globalThis);
