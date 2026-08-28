export const catalog = [
  { id:'01', title:'A Dreams A Mystery', artist:'Osama, MT', art:'albums/a-broken-dream/assets/album-cover.png', src:'albums/a-broken-dream/assets/a-dreams-a-mystery.mp3', href:'songs/song.html?track=01', seconds:20 },
  { id:'02', title:'Nightmare Fuel', artist:'Osama, MT and Adam', art:'albums/a-broken-dream/assets/Nightmare Fuel.png', src:'albums/a-broken-dream/assets/Nightmare Fuel.MP3', href:'songs/song.html?track=02', seconds:37 },
  { id:'11', title:"Nawaf's Stole Pain", artist:'Bassam', art:"albums/a-broken-dream/assets/Nawaf's Stole Pain.png", src:"albums/a-broken-dream/assets/Nawaf's Stole Pain.MP3", href:'songs/song.html?track=11', seconds:87 },
  { id:'10-20', title:'10:20', artist:'MT', art:'singles/10-20/assets/1020.png', src:'singles/10-20/assets/MT - 1020.MP3', href:'songs/song.html?track=10-20', seconds:163 }
];
export const byId = Object.fromEntries(catalog.map(item => [item.id, item]));
export function formatDuration(seconds) { const value = Math.max(0, Math.round(Number(seconds) || 0)); const hours = Math.floor(value / 3600); const minutes = Math.floor((value % 3600) / 60); return hours ? hours + 'h ' + minutes + 'm' : minutes + 'm ' + String(value % 60).padStart(2, '0') + 's'; }
export function playlistDuration(ids = []) { return ids.reduce((sum, id) => sum + (byId[id]?.seconds || 0), 0); }
export function getAchievementDefinitions() {
  const items = [
    ['First Signal','Play your first song',m=>m.plays>=1],['Five Plays','Play five songs',m=>m.plays>=5],['Ten Plays','Play ten songs',m=>m.plays>=10],['First Minute','Listen for one minute',m=>m.seconds>=60],['Five Minutes','Listen for five minutes',m=>m.seconds>=300],['First Discovery','Listen to one unique song',m=>m.unique>=1],['Two Rooms','Listen to two unique songs',m=>m.unique>=2],['Full Shelf','Listen to all four current songs',m=>m.unique>=4],['First Like','Like a song',m=>m.likes>=1],['Three Likes','Like three songs',m=>m.likes>=3],['First Signal Back','Dislike a song',m=>m.dislikes>=1],['Two-Day Run','Visit for two days',m=>m.streak>=2],['Week Run','Keep a seven-day streak',m=>m.streak>=7],['First Playlist Song','Add a song to your playlist',m=>m.playlist>=1],['Playlist Builder','Add all four songs to your playlist',m=>m.playlist>=4]
  ];
  for (let i=1;i<=20;i++) items.push(['Play Collector '+i, 'Reach '+(i*10+10)+' total plays', m=>m.plays>=i*10+10]);
  for (let i=1;i<=20;i++) items.push(['Deep Listener '+i, 'Listen for '+(i*5+10)+' minutes', m=>m.seconds>=(i*5+10)*60]);
  for (let i=1;i<=20;i++) items.push(['Catalog Explorer '+i, 'Reach '+Math.min(4,Math.ceil(i/5))+' unique songs', m=>m.unique>=Math.min(4,Math.ceil(i/5)) && i%5===0]);
  for (let i=1;i<=20;i++) items.push(['Community Voice '+i, 'Like '+Math.min(4,i)+' songs', m=>m.likes>=Math.min(4,i) && i%5===0]);
  for (let i=1;i<=5;i++) items.push(['Streak Keeper '+i, 'Reach a '+(i*7)+'-day streak', m=>m.streak>=i*7]);
  for (let i=1;i<=5;i++) items.push(['Playlist Curator '+i, 'Keep '+Math.min(4,i)+' songs in your playlist', m=>m.playlist>=Math.min(4,i) && i%4===0]);
  return items.slice(0,100).map((item,index) => ({id:index+1,title:item[0],description:item[1],test:item[2]}));
}
export function accountMetrics(account = {}, listens = [], playlist = {}) { return { plays:Number(account.plays)||0, seconds:Number(account.totalSeconds)||listens.reduce((sum,item)=>sum+(Number(item.seconds)||0),0), unique:Number(account.uniqueSongs)||listens.length, likes:Number(account.likesCount)||0, dislikes:Number(account.dislikesCount)||0, streak:Number(account.streakDays)||0, playlist:Array.isArray(playlist.trackIds)?playlist.trackIds.length:0 }; }
export function completedAchievements(account, listens, playlist, reactions = []) { const metrics=accountMetrics(account,listens,playlist); metrics.likes=Math.max(metrics.likes,reactions.filter(item=>item.type==='like').length); metrics.dislikes=Math.max(metrics.dislikes,reactions.filter(item=>item.type==='dislike').length); return getAchievementDefinitions().filter(item=>item.test(metrics)); }
