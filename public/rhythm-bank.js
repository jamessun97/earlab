(function(root){
function pattern(notes,subdivision){
 const groups=Array.from({length:4},(_,beat)=>Array.from({length:subdivision},(_,i)=>notes.includes(beat+i/subdivision)?'●':'·').join(' '));
 const detail=groups.map((_,beat)=>{const count=notes.filter(n=>n>=beat&&n<beat+1).length;return `第${['一','二','三','四'][beat]}拍${count?`發聲 ${count} 次`:'休止'}`}).join('，')+'。';
 return {n:groups.join('｜'),s:notes.slice(),t:detail};
}
const beginner=[
 [0,1,2,3],[0,2],[0,1,3],[0,2,3],[0,1,2],[0,1,2,3,3.5],
 [0,.5,1,2,3],[0,1,1.5,2,3],[0,1,2,2.5,3],[0,.5,1,2,2.5,3],[0,1,1.5,2,3,3.5],[0,.5,1,1.5,2,2.5,3,3.5]
].map(n=>pattern(n,2));
const intermediate=[...beginner,...[
 [0,.5,1.5,2,3],[0,1,1.5,2.5,3.5],[0,.5,1.5,2.5,3],[0,1.5,2.5,3.5],
 [0,.5,1,2.5,3],[0,1.5,2,3.5],[0,.5,2,2.5],[0,.5,1.5,3.5]
].map(n=>pattern(n,2))];
const advanced=[];
const templates=[[0,.25,.5,.75],[0,.5,.75],[0,.75],[0,.25,.75],[0,.25,.5],[0,.25]];
for(let template=0;template<templates.length;template++)for(let beat=0;beat<4;beat++){
 const notes=[];for(let i=0;i<4;i++)notes.push(...(i===beat?templates[template]:i===(beat+2)%4?[0,.5]:[0]).map(t=>i+t));advanced.push(pattern(notes,4));
}
const pools={beginner,intermediate,advanced};
function sequence(level,count,random=Math.random){const pool=pools[level],out=[];let previous=-1;
 while(out.length<count){const bag=pool.map((_,i)=>i);for(let i=bag.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]]}
  if(bag[0]===previous&&bag.length>1)[bag[0],bag[1]]=[bag[1],bag[0]];
  for(const i of bag){out.push(pool[i]);previous=i;if(out.length===count)break}
 }
 return out;
}
root.RhythmTraining={pools,sequence};
})(globalThis);
