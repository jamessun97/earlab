(function(root){
function pattern(notes,subdivision){
 const groups=Array.from({length:4},(_,beat)=>Array.from({length:subdivision},(_,i)=>notes.includes(beat+i/subdivision)?'●':'·').join(' '));
 const detail=groups.map((_,beat)=>{const count=notes.filter(n=>n>=beat&&n<beat+1).length;return `第${['一','二','三','四'][beat]}拍${count?`發聲 ${count} 次`:'休止'}`}).join('，')+'。';
 return {n:groups.join('｜'),s:notes.slice(),t:detail};
}
function combinations(templates,subdivision,filter){const result=[];
 for(const a of templates)for(const b of templates)for(const c of templates)for(const d of templates){
  const notes=[a,b,c,d].flatMap((part,beat)=>part.map(t=>beat+t));if(notes[0]!==0||!filter(notes))continue;result.push(pattern(notes,subdivision));
 }
 return result;
}
const beginner=combinations([[],[0],[0,.5]],2,n=>n.length>=2&&n.length<=6);
const intermediate=combinations([[],[0],[.5],[0,.5]],2,n=>n.length>=2);
const advanced=combinations([[],[0],[0,.5],[0,.25,.5,.75],[0,.75],[0,.5,.75],[0,.25,.75],[0,.25,.5],[.25,.75]],4,n=>n.length>=3&&n.length<=12&&n.some(t=>t%0.5!==0));
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
