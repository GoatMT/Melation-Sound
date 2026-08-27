(function(){
  var tracks = {
    '01': { title:'A Dreams A Mystery', type:'Album track', artist:'Osama, MT', release:'A Broken Dream', date:'August 24, 2026', back:'album.html', art:'album-cover.png', audio:'a-dreams-a-mystery.mp3', length:'00:00:20', bitrate:'192kbps', sampleRate:'44.100 kHz', status:'Available now', lyrics:'Lyrics have not been published for this track yet.' },
    '02': { title:'Nightmare Fuel', type:'Album track', artist:'Osama, MT and Adam', release:'A Broken Dream', date:'August 27, 2026', back:'album.html', art:'Nightmare Fuel.png', audio:'Nightmare Fuel.MP3', length:'00:00:37', bitrate:'192kbps', sampleRate:'44.100 kHz', status:'Available now', lyrics:'Lyrics have not been added for this track yet.' },
    '03': { title:'6 Feet Under', type:'Album track', artist:'Osama, MT', release:'A Broken Dream', date:'Not posted', back:'album.html', art:'album-cover.png', status:'Out Dec 20, 2026', lyrics:'Lyrics will be available when this track is released.' },
    '04': { title:'Fake Smile', type:'Album track', artist:'Osama, MT', release:'A Broken Dream', date:'Not posted', back:'album.html', art:'album-cover.png', status:'Out Dec 20, 2026', lyrics:'Lyrics will be available when this track is released.' },
    '05': { title:'Ghost in the Mirror', type:'Album track', artist:'Osama, MT', release:'A Broken Dream', date:'Not posted', back:'album.html', art:'album-cover.png', status:'Out Dec 20, 2026', lyrics:'Lyrics will be available when this track is released.' },
    '06': { title:'No More Tears', type:'Album track', artist:'Osama, MT', release:'A Broken Dream', date:'Not posted', back:'album.html', art:'album-cover.png', status:'Out Dec 20, 2026', lyrics:'Lyrics will be available when this track is released.' },
    '07': { title:'Static', type:'Album track', artist:'Osama, MT', release:'A Broken Dream', date:'Not posted', back:'album.html', art:'album-cover.png', status:'Out Dec 20, 2026', lyrics:'Lyrics will be available when this track is released.' },
    '08': { title:'Empty Rooms', type:'Album track', artist:'Osama, MT', release:'A Broken Dream', date:'Not posted', back:'album.html', art:'album-cover.png', status:'Out Dec 20, 2026', lyrics:'Lyrics will be available when this track is released.' },
    '09': { title:'Doomsday', type:'Album track', artist:'Osama, MT', release:'A Broken Dream', date:'Not posted', back:'album.html', art:'album-cover.png', status:'Out Dec 20, 2026', lyrics:'Lyrics will be available when this track is released.' },
    '10': { title:'A Broken Dream (Outro)', type:'Album track', artist:'Osama, MT', release:'A Broken Dream', date:'Not posted', back:'album.html', art:'album-cover.png', status:'Out Dec 20, 2026', lyrics:'Lyrics will be available when this track is released.' },
    '11': { title:"Nawaf's Stole Pain", type:'Album bonus track', artist:'Bassam', release:'A Broken Dream', date:'August 26, 2026', back:'album.html', art:"Nawaf's Stole Pain.png", audio:"Nawaf's Stole Pain.MP3", length:'00:01:27', bitrate:'192kbps', sampleRate:'44.100 kHz', status:'Available now', lyrics:'Lyrics are available in the original release notes for this bonus track.' },
    '10-20': { title:'10:20', type:'Single', artist:'MT', release:'Melation Sound single', date:'August 24, 2026', back:'1020.html', art:'1020.png', audio:'MT - 1020.MP3', length:'00:02:43', bitrate:'192kbps', sampleRate:'44.100 kHz', status:'Private release', private:true, lyrics:`(Yea)
(Yea)
10:20
(Yea)
Ayy, ayy

Get this lil' nigga out my face (fahaase)
On some lawyer shit, I just won this case (cahaase)
Tell yo momma don't worry, it's just a phase (phaase)
Put the money in stacks, I count it in racks
Put these niggas in a cell, turn the volume up max
Play some Carti in this whip—nah, we playing Drizzy tracks
10-20, where you at? Yeah, I know you need them snacks
Who's that? Billy my cat, now we speaking facts
Seen some niggas attack, had to send 'em right back
Running track, counting stacks, gaining racks
Broke that nigga's back yea I’m comming right back

Posted up downtown, gotta take a nap
Headed eastbound, that's your 10-20, no cap
Your dad's not around, nigga come sit on my lap
10-20, where you at? Im looking at the map
At timmies i know you want an ice cap

Got a couple boys asking how I get paid (dd)
Headed to your crib right now, I'm on my way (yy)
With females, I'll never look at the same (ee)
Too much on my mind, I don't know what to say

(Yea) I know you hear that
(Yea) where you at?
10-20, hit me back
If it's up, it's like that
(Yea) don't talk too much
(Yea) you ain't saying much
Big boy, better back it up
Whole squad, we coming up
(Yea) where you at?
10-20, hit me back
(Yea) where you at?
Tell 'em put it on the map
10-20, 10-20
Yeah, you know where I'm at
10-20, 10-20

Get this lil' nigga out my face (fahaase)
On some lawyer shit, I just won this case (cahaase)
Tell yo momma don't worry, it's just a phase (phaase)
Put the money in stacks, I count it in racks
Put these niggas in a cell, turn the volume up max
Play some Carti in this whip—nah, we playing Drizzy tracks
10-20, where you at? Yeah, I know you need them snacks

416 when I land, everybody know it's getting late
One confirmed, two on the way, that's the way it gets made
Album on the way, tell 'em wait, niggas getting paid
Nigga, you almost 19 asking 'bout some damn grades
262 days in your year, all I see is gaining weight
Downtown after dark, you know what time it is
Hold up, wait, I'm hearing a plot twist
416 when I land, you dropped in the six-side
Told us they like you, but obviously they lied
Talking all this shit, but the game's still tied
Mitchy in the 6ix, this shit going nationwide

(Yea)
10-20, where you at?
(Yea)
10-20, hit me back
(Yea)
Whole city know the track
10-20, that's a wrap
10-20
(Yea)
10-20
(Yea)
10-20` }
  };
  var params = new URLSearchParams(window.location.search);
  var key = params.get('track') || '01';
  if (key === '10:20' || key === '1020') key = '10-20';
  var track = tracks[key] || tracks['01'];
  var $ = function(id){ return document.getElementById(id); };
  var labelTrackIndex = track.audio ? (track.private ? 0 : ({'01':0,'02':1,'11':2}[key] || 0)) : -1;
  var labelMount = $('label-player-mount');
  if (labelMount) { labelMount.setAttribute('data-label-start', labelTrackIndex); labelMount.setAttribute('data-song-track', labelTrackIndex); }
  var privateKey = 'melation1020Unlocked';
  function formatTime(value){ if(!isFinite(value)||value<0) return '0:00'; var m=Math.floor(value/60),s=Math.floor(value%60); return m+':'+(s<10?'0':'')+s; }
  function hasPrivateAccess(){ try{return sessionStorage.getItem(privateKey)==='yes';}catch(e){return false;} }
  function hash(value){ return crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)).then(function(bytes){return Array.from(new Uint8Array(bytes)).map(function(byte){return byte.toString(16).padStart(2,'0');}).join('');}); }
  function engagementStats(){ return window.MelationEngagement ? window.MelationEngagement.get(key) : {views:0,likes:0,dislikes:0,reaction:null}; }
  function updateEngagement(){ var stats=engagementStats(); $('songViewCount').textContent=stats.views; $('songLikeCount').textContent=stats.likes; $('songDislikeCount').textContent=stats.dislikes; $('songLike').setAttribute('aria-pressed',stats.reaction==='like'); $('songDislike').setAttribute('aria-pressed',stats.reaction==='dislike'); $('songLike').classList.toggle('is-active',stats.reaction==='like'); $('songDislike').classList.toggle('is-active',stats.reaction==='dislike'); }
  function startEngagement(){ if(window.MelationCommunity && window.MelationCommunity.recordView){ window.MelationCommunity.recordView(key); updateEngagement(); } else if(window.MelationEngagement){ window.MelationEngagement.recordView(key); updateEngagement(); } }
  function render(){
    $('songType').textContent=track.type; $('songTitle').textContent=track.title; $('songArtist').textContent=track.artist; $('songRelease').textContent=track.release; $('songBack').href=track.back; $('songArt').src=track.art; $('songArt').alt=track.title+' artwork'; $('songTrackNumber').textContent=key==='10-20'?'Single':'Track '+key;
    document.title=track.title+' · Melation Sound'; $('lyricsStatus').textContent=track.private?'Private song':track.status; $('songLyrics').textContent=track.lyrics; $('songLyrics').classList.toggle('is-empty',!track.audio); $('songDetails').innerHTML=''; [['Release type',track.type],['Artist',track.artist],['Release',track.release],['Date posted',track.date],['Status',track.status],['Length',track.length||'Not available'],['Bit rate',track.bitrate||'Not available'],['Audio sample rate',track.sampleRate||'Not available']].forEach(function(item){var cell=document.createElement('div'),label=document.createElement('small'),value=document.createElement('strong');label.textContent=item[0];value.textContent=item[1];cell.append(label,value);$('songDetails').appendChild(cell);});
    $('songPlayTop').disabled=!track.audio; if(!track.audio){$('songPlayTop').textContent='Not released';}
  }
  function unlock(){ document.body.classList.remove('private-song-locked');$('privateGate').hidden=true;try{sessionStorage.setItem(privateKey,'yes');}catch(e){} if(window.melationPreparePrivateAudio) window.melationPreparePrivateAudio(); startEngagement(); }
  render();
  if(track.private) document.body.classList.add('private-single-page');
  if(track.private && !hasPrivateAccess()){document.body.classList.add('private-song-locked');$('privateGate').hidden=false;}
  if(!track.private || hasPrivateAccess()) startEngagement();
  $('privateGateForm').addEventListener('submit',function(event){event.preventDefault();hash($('privateGatePassword').value).then(function(value){if(value==='fcfd078f912f086bda4b4caa4cb792aafc28735c70f24d70e87978908cbdd2a3'){unlock();$('privateGateError').textContent='';}else{$('privateGateError').textContent='That password is not correct.';$('privateGatePassword').select();}});});
  function reactOnPage(type){ var service=window.MelationCommunity || window.MelationEngagement; if(!service || !service.react)return; var result=service.react(key,type); if(result && typeof result.then==='function')result.then(updateEngagement); else updateEngagement(); }
  $('songLike').addEventListener('click',function(){reactOnPage('like');});
  $('songDislike').addEventListener('click',function(){reactOnPage('dislike');});
}());
