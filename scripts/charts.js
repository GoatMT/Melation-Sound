(function(){
  var engagement=window.MelationEngagement; if(!engagement)return;
  function render(target,metric,label){
    var stats=engagement.all(); var items=engagement.catalog.slice().sort(function(a,b){return (stats[b.id][metric]-stats[a.id][metric])||a.title.localeCompare(b.title);});
    var max=Math.max.apply(null,items.map(function(item){return stats[item.id][metric];}));
    target.innerHTML=items.map(function(item,index){var value=stats[item.id][metric],width=max?Math.max(8,Math.round(value/max*100)):8;return '<a class="chart-row" href="'+item.href+'"><span class="chart-rank">'+String(index+1).padStart(2,'0')+'</span><img src="'+item.art+'" alt=""><span class="chart-song"><strong>'+item.title+'</strong><small>'+item.artist+(item.private?' · Private':'')+'</small><i style="width:'+width+'%"></i></span><span class="chart-value">'+value+'<small>'+label+'</small></span></a>';}).join('');
  }
  render(document.getElementById('viewsChart'),'views','views'); render(document.getElementById('likesChart'),'likes','likes'); render(document.getElementById('dislikesChart'),'dislikes','dislikes');
}());
