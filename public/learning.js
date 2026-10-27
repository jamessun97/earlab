(function(root){
const names={pitch:'音高',interval:'音程',chord:'和弦',rhythm:'節奏',eq:'EQ 頻段',gain:'音量差',compression:'壓縮動態',pan:'聲像定位'};
const date=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
function report(events,now=new Date()){
 const answers=events.filter(e=>e.kind==='answer');const recent={};for(const mode of Object.keys(names)){const attempts=answers.filter(e=>e.question.mode===mode).sort((a,b)=>b.at-a.at).slice(0,40);recent[mode]={total:attempts.length,correct:attempts.filter(e=>e.correct).length}}
 const days=Array.from({length:7},(_,i)=>{const d=new Date(now);d.setDate(d.getDate()-6+i);const key=date(d),attempts=answers.filter(e=>e.date===key);return {date:key,total:attempts.length,correct:attempts.filter(e=>e.correct).length}});
 const observed=Object.keys(names).filter(m=>recent[m].total>=5).sort((a,b)=>(recent[a].correct+1)/(recent[a].total+2)-(recent[b].correct+1)/(recent[b].total+2));
 const unexplored=Object.keys(names).filter(m=>recent[m].total<5).sort((a,b)=>recent[a].total-recent[b].total);
 return {days,recent,priority:[...observed,...unexplored],recommendation:observed[0]||unexplored[0],hasEvidence:observed.length>0};
}
function focusPlan(events){const r=report(events);return r.priority.slice(0,3).flatMap((m,i)=>Array([6,4,2][i]).fill(m))}
const cards=[
 {mode:'pitch',title:'音名、八度與參考音',body:'音名後的數字是八度：C4 與 C5 相距一個八度。十二平均律中，每升高一個半音，頻率乘以 2 的 1/12 次方；升高一個八度，頻率加倍。',table:[['C4','約 261.63 Hz'],['A4','440 Hz'],['C5','約 523.25 Hz']],tip:'先聽 C4 參考音，在心中唱出音階，再辨認音名與八度。此工具主要訓練相對音高，不代表絕對音感測試。'},
 {mode:'interval',title:'用半音理解音程',body:'音程是兩個音的距離。上行與下行改變方向，不改變相距的半音數；同時發聲則更需要注意兩個音的融合感。',table:[['小二／大二度','1／2 半音'],['小三／大三度','3／4 半音'],['完全四度／三全音／完全五度','5／6／7 半音'],['小六／大六度','8／9 半音'],['小七／大七度','10／11 半音'],['完全八度','12 半音']],tip:'先判斷寬窄，再分辨大小。不要只背某首歌的開頭，也要練習不同起音與方向。'},
 {mode:'chord',title:'和弦組成與轉位',body:'和弦的種類由音程組成決定。轉位改變最低音，但保留和弦音的音級集合；不能只靠最低音判斷種類。下表以根音為 0，單位為半音。',table:[['大三／小三和弦','0–4–7／0–3–7'],['減三／增三和弦','0–3–6／0–4–8'],['大七／屬七和弦','0–4–7–11／0–4–7–10'],['小七／半減七和弦','0–3–7–10／0–3–6–10']],tip:'先聽三度的色彩，再留意五度與七度。明亮、柔和等詞只是記憶輔助，實際感受也受音域與配器影響。'},
 {mode:'rhythm',title:'拍、細分與休止',body:'一拍可以分成兩個八分音符，或四個十六分音符。題目中每個「｜」分隔一拍，● 是發聲，· 是該位置沒有新的發聲；符號主要表示起音位置。',table:[['● ·','一拍中只在拍頭發聲'],['● ●','兩個八分起音'],['● · ● ●','拍頭、半拍與最後四分之一拍起音'],['· ·','一整拍沒有起音']],tip:'高音的四拍是預備拍，低音鼓才是題目。先保持穩定數拍，再記住每拍的細分。'},
 {mode:'eq',title:'頻率、增益與 Q',body:'EQ 改變特定頻率附近的能量。Hz 表示中心頻率，dB 表示提升或衰減量；Q 越大，影響的頻帶通常越窄。以下頻段只作聽辨參考。',table:[['約 60–150 Hz','低頻重量與低音基礎'],['約 200–500 Hz','厚度與混濁感'],['約 1–4 kHz','存在感與清晰度'],['約 6–10 kHz','明亮度與高頻細節']],tip:'比較 A／B 的音色變化。本站 EQ 題匹配 RMS 平均能量，避免只憑音量作答；頻率詞彙不等於固定的混音處方。'},
 {mode:'gain',title:'分貝與音量比較',body:'對同一段訊號，增益的 dB 與振幅比例關係是 20 × log10（振幅比）。振幅加倍約是 +6 dB，主觀感受到多大聲則還受頻率、內容與播放音量影響。',table:[['+6 dB','約 2 倍振幅'],['+3 dB','約 1.41 倍振幅'],['−3 dB','約 0.71 倍振幅'],['−6 dB','約 0.50 倍振幅']],tip:'正值表示 B 比 A 大聲，負值表示 B 較小聲。練習時固定裝置音量，不要把振幅倍數誤當成感知響度倍數。'},
 {mode:'compression',title:'壓縮器在改變什麼？',body:'Threshold 是開始壓縮的閾值，Ratio 是超出閾值後的壓縮比。Attack 決定增益衰減建立的速度，Release 決定衰減恢復的速度。',table:[['4:1 比率','超出閾值 4 dB，理想靜態情況輸出只多 1 dB'],['較快 Attack','通常更明顯地壓住起音瞬態'],['較慢 Release','衰減持續較久，可能影響下一個鼓點'],['Makeup gain','補償整體音量，並非恢復原始動態']],tip:'本站以 RMS 匹配 A／B 的平均能量。請聽強弱差與鼓點衝擊；RMS 匹配不等同 LUFS 感知響度完全一致。'},
 {mode:'pan',title:'左右定位與聆聽條件',body:'聲像控制聲音在左右聲道的相對分布。本站採等功率聲像；中央同時出現在左右，完全偏左或偏右則主要出現在單邊。',table:[['左 100%','完全偏左'],['左／右 50%','位於中央與該側之間'],['中央參考 A','左右聲道相同']],tip:'使用立體聲耳機並關閉單聲道播放。檢查左右聲道有沒有戴反；此練習訓練左右定位，不是音場寬度測量。'}
];
root.LearningInsights={names,report,focusPlan,cards};
})(globalThis);
