(function(){
  var STORAGE_KEY = 'melationEngagement';
  var SESSION_KEY = 'melationViewedSongs';
  var CATALOG = [
    { id:'01', title:'A Dreams A Mystery', artist:'Osama, MT', art:'albums/a-broken-dream/assets/album-cover.png', href:'songs/song.html?track=01' },
    { id:'02', title:'Nightmare Fuel', artist:'Osama, MT and Adam', art:'albums/a-broken-dream/assets/Nightmare Fuel.png', href:'songs/song.html?track=02' },
    { id:'11', title:"Nawaf's Stole Pain", artist:'Bassam', art:"albums/a-broken-dream/assets/Nawaf's Stole Pain.png", href:'songs/song.html?track=11' },
    { id:'10-20', title:'10:20', artist:'MT', art:'singles/10-20/assets/1020.png', href:'songs/song.html?track=10-20', private:true }
  ];
  function blank(){ return { views:0, likes:0, dislikes:0, reaction:null }; }
  function read(){
    var data;
    try { data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch (e) { data = {}; }
    CATALOG.forEach(function(item){ if(!data[item.id]) data[item.id]=blank(); });
    return data;
  }
  function write(data){ try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {} }
  function readViewed(){ try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}'); } catch (e) { return {}; } }
  function writeViewed(data){ try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch (e) {} }
  function recordView(id){
    var viewed=readViewed(); if(viewed[id]) return read()[id];
    var data=read(); if(!data[id]) data[id]=blank(); data[id].views+=1; write(data); viewed[id]=true; writeViewed(viewed); return data[id];
  }
  function react(id,type){
    var data=read(); if(!data[id]) data[id]=blank(); var item=data[id];
    if(item.reaction===type){ item[type+'s']-=1; item.reaction=null; }
    else { if(item.reaction) item[item.reaction+'s']-=1; item[type+'s']+=1; item.reaction=type; }
    write(data); return item;
  }
  window.MelationEngagement = { catalog:CATALOG, get:function(id){ return read()[id] || blank(); }, all:read, recordView:recordView, react:react };
}());
