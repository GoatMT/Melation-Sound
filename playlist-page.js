import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { catalog, byId, formatDuration, playlistDuration } from './community-data.js';

const config = window.MELATION_FIREBASE_CONFIG || {};
const ROOT = 'melationSound';
const ROOT_ID = 'main';
const SESSION_KEY = 'melationSoundAccount';
let db = null;
let accounts = null;
let accountKey = '';
let accountData = null;
let playlist = { name:'Listener\'s Playlist', trackIds:[], updatedAtMs:0 };
let listens = [];
let pendingPlaylistImage = '';
let pendingProfileImage = '';

function sessionUser() { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch (error) { return null; } }
function escapeHtml(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function setText(id, value) { const element=document.getElementById(id); if(element) element.textContent=value; }
function normalize(value) { return String(value || '').trim().toLowerCase().replace(/\s+/g, '-'); }
function formatWhen(value) { return value ? new Date(value).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}) : 'Not updated yet'; }
function playlistValue(value, displayName) { return { name:String(value?.name || (displayName || 'Listener') + "'s Playlist").slice(0,50), trackIds:Array.isArray(value?.trackIds) ? value.trackIds.filter(id=>byId[id]) : [], imageData:String(value?.imageData || ''), updatedAtMs:Number(value?.updatedAtMs)||0 }; }
function setStatus(value, error=false) { const element=document.getElementById('playlistPageStatus'); if(element){element.textContent=value;element.style.color=error?'#ffadad':'';} }
async function initDb() { if(!config.apiKey || !config.projectId || !config.appId) return; const app=getApps().find(item=>item.name==='playlistPage') || initializeApp(config,'playlistPage'); db=getFirestore(app); accounts=collection(db,ROOT,ROOT_ID,'accounts'); }
async function loadAccount() {
  const requested=new URLSearchParams(location.search).get('uid');
  const session=sessionUser();
  accountKey=normalize(requested || session?.usernameKey || '');
  if(!accountKey) { document.getElementById('playlistState').textContent='Sign in or open a public playlist link to view a playlist.'; return false; }
  if(!db) { const local=JSON.parse(localStorage.getItem('melationCommunityDemo')||'null'); accountData=local; playlist=playlistValue(local?.playlist,local?.displayName); listens=Object.values(local?.songs||{}); return true; }
  const snapshot=await getDoc(doc(accounts,accountKey));
  if(!snapshot.exists()) { document.getElementById('playlistState').textContent='This listener playlist does not exist yet.'; return false; }
  accountData=snapshot.data();
  playlist=playlistValue(accountData.playlist,accountData.displayName||accountData.username||accountKey);
  const listenSnapshot=await getDocs(collection(accounts,accountKey,'listens'));
  listens=listenSnapshot.docs.map(item=>({...item.data(),songId:item.id})).sort((a,b)=>(b.updatedAtMs||0)-(a.updatedAtMs||0));
  return true;
}
function render() {
  const owner=sessionUser()?.usernameKey===accountKey;
  const cover=document.getElementById('playlistCover');
  if(playlist.imageData) { cover.src=playlist.imageData; cover.alt=playlist.name+' artwork'; }
  setText('playlistTitle',playlist.name); setText('playlistOwner','@'+(accountData?.username||accountKey)); setText('playlistUpdated','Updated '+formatWhen(playlist.updatedAtMs));
  setText('playlistTrackCount',playlist.trackIds.length); setText('playlistDuration',formatDuration(playlistDuration(playlist.trackIds))); setText('playlistPlayCount',accountData?.plays||0); setText('playlistStreak',accountData?.streakDays||0);
  const list=document.getElementById('playlistPageList');
  list.innerHTML=playlist.trackIds.length ? playlist.trackIds.map((id,index)=>{const item=byId[id];return '<li class="playlist-page-row" draggable="'+owner+'" data-index="'+index+'"><span class="playlist-page-number">'+String(index+1).padStart(2,'0')+'</span><img src="'+escapeHtml(item.art)+'" alt=""><span class="playlist-page-copy"><strong>'+escapeHtml(item.title)+'</strong><small>'+escapeHtml(item.artist)+'</small></span><span class="playlist-page-duration">'+formatDuration(item.seconds)+'</span><button type="button" class="playlist-page-play" data-play-index="'+index+'">Play</button>'+(owner?'<button type="button" class="playlist-remove" data-playlist-remove="'+index+'">Remove</button>':'')+'</li>';}).join('') : '<li class="playlist-empty">This playlist is empty.</li>';
  const recent=document.getElementById('playlistRecentList');
  recent.innerHTML=listens.length ? listens.slice(0,8).map(item=>{const song=byId[item.songId]||byId[item.id]; if(!song)return '';return '<div class="playlist-recent-item"><img src="'+escapeHtml(song.art)+'" alt=""><span class="playlist-recent-copy"><strong>'+escapeHtml(song.title)+'</strong><small>'+escapeHtml(song.artist)+' · '+formatWhen(item.updatedAtMs)+'</small></span></div>';}).join('') : '<p class="playlist-empty">No listening history yet.</p>';
  document.getElementById('playlistEditor').hidden=!owner;
  if(owner){ const input=document.getElementById('playlistPageName'); if(document.activeElement!==input) input.value=playlist.name; populateAdd(); }
  setText('playlistProfileName',accountData?.displayName||accountData?.username||accountKey); setText('playlistProfileBio',accountData?.profileBio||'No profile bio yet.'); setText('playlistFavorite',accountData?.favoriteSong ? 'Favorite song · '+(byId[accountData.favoriteSong]?.title||accountData.favoriteSong) : 'No favorite song selected.');
  const avatar=document.getElementById('playlistAvatar'); if(accountData?.profileImage) avatar.src=accountData.profileImage;
  document.getElementById('playlistHero').hidden=false; document.getElementById('playlistContent').hidden=false; document.getElementById('playlistState').hidden=true;
  bindRows(owner);
}
function populateAdd(){const select=document.getElementById('playlistPageAdd'); if(!select)return; select.innerHTML=catalog.map(item=>'<option value="'+item.id+'">'+escapeHtml(item.title)+' · '+escapeHtml(item.artist)+'</option>').join('');}
function queue(){return playlist.trackIds.map(id=>({...byId[id],name:byId[id].title,page:byId[id].href}));}
function playIndex(index){if(window.melationSetQueue)window.melationSetQueue(queue());if(window.melationPlayTrack)window.melationPlayTrack(index);}
function bindRows(owner){const list=document.getElementById('playlistPageList');list.querySelectorAll('[data-play-index]').forEach(button=>button.addEventListener('click',()=>playIndex(Number(button.dataset.playIndex))));if(!owner)return;list.querySelectorAll('[data-playlist-remove]').forEach(button=>button.addEventListener('click',async()=>{playlist.trackIds.splice(Number(button.dataset.playlistRemove),1);await savePlaylist();}));let dragged=null;list.querySelectorAll('.playlist-page-row').forEach(row=>{row.addEventListener('dragstart',()=>{dragged=Number(row.dataset.index);row.classList.add('dragging');});row.addEventListener('dragend',()=>row.classList.remove('dragging'));row.addEventListener('dragover',event=>event.preventDefault());row.addEventListener('drop',async event=>{event.preventDefault();const target=Number(row.dataset.index);if(dragged===null||dragged===target)return;const moved=playlist.trackIds.splice(dragged,1)[0];playlist.trackIds.splice(target,0,moved);dragged=null;await savePlaylist();});});}
async function saveAccount(fields){if(!db){const data=JSON.parse(localStorage.getItem('melationCommunityDemo')||'{}');Object.assign(data,fields);localStorage.setItem('melationCommunityDemo',JSON.stringify(data));accountData={...accountData,...fields};return;}await setDoc(doc(accounts,accountKey),fields,{merge:true});accountData={...accountData,...fields};}
async function savePlaylist(){if(sessionUser()?.usernameKey!==accountKey)return;playlist.updatedAtMs=Date.now();if(pendingPlaylistImage)playlist.imageData=pendingPlaylistImage;try{await saveAccount({playlist});pendingPlaylistImage='';setStatus('Playlist saved.');render();}catch(error){setStatus('Could not save playlist. Publish the current Firestore rules and try again.',true);}}
async function readImage(file,requiredSize,maxOutput){return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file);const image=new Image();image.onload=()=>{URL.revokeObjectURL(url);if(requiredSize&&(image.naturalWidth!==requiredSize||image.naturalHeight!==requiredSize)){reject(new Error('Please choose an exactly '+requiredSize+' × '+requiredSize+' pixel image.'));return;}const size=Math.min(maxOutput,image.naturalWidth);const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;canvas.getContext('2d').drawImage(image,0,0,size,size);resolve(canvas.toDataURL('image/jpeg',.82));};image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('That image could not be read.'));};image.src=url;});}
function bind(){document.getElementById('playlistPlayAll').addEventListener('click',()=>playlist.trackIds.length&&playIndex(0));document.getElementById('playlistCopyLink').addEventListener('click',async()=>{const url=new URL('playlist.html',location.href);url.searchParams.set('uid',accountKey);try{await navigator.clipboard.writeText(url.href);setStatus('Playlist link copied.');}catch(error){setStatus(url.href);}});document.getElementById('playlistPageSave').addEventListener('click',savePlaylist);document.getElementById('playlistPageAddButton').addEventListener('click',()=>{const id=document.getElementById('playlistPageAdd').value;if(id&&!playlist.trackIds.includes(id)){playlist.trackIds.push(id);savePlaylist();}});document.getElementById('playlistPageImage').addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;try{pendingPlaylistImage=await readImage(file,3000,900);document.getElementById('playlistCover').src=pendingPlaylistImage;setStatus('Artwork ready. Click Save playlist.');}catch(error){event.target.value='';setStatus(error.message,true);}});}
async function start(){try{await initDb();if(await loadAccount()){render();bind();}}catch(error){document.getElementById('playlistState').textContent='Playlist data is temporarily unavailable.';}}
start();
