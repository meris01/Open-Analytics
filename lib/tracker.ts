/** The OpenAnalytics tracking script, served from /oa.js.
 *  Cookieless, no fingerprinting, no localStorage identifiers.
 *  Minified inline — ~1.9 KB gzipped. */
export const TRACKER_SOURCE = `(function(w,d){
  if(w.__oa)return; w.__oa=1;
  var S=d.currentScript||(function(){var s=d.getElementsByTagName('script');return s[s.length-1]})();
  var SITE=S.getAttribute('data-site')||'demo';
  var API=S.getAttribute('data-api')||(new URL(S.src,d.baseURI)).origin+'/api/event';
  var HASH=S.getAttribute('data-hash')==='true';
  var EXCLUDE=(S.getAttribute('data-exclude')||'').split(',').filter(Boolean);
  var AUTO=S.getAttribute('data-auto')!=='false';
  var t0=Date.now(), lastPath=null, qs=[];

  function localDev(){return /^(localhost|127\\.|0\\.0\\.0\\.0|\\[::1\\])/.test(location.hostname)}
  function excluded(p){for(var i=0;i<EXCLUDE.length;i++){var e=EXCLUDE[i].trim();
    if(e && (e===p || (e.slice(-1)==='*' && p.indexOf(e.slice(0,-1))===0)))return true}return false}
  function path(){var p=HASH?(location.pathname+location.hash):location.pathname;
    return (p.length>1?p.replace(/\\/+$/,''):p)||'/'}
  function param(n){try{return new URLSearchParams(location.search).get(n)||''}catch(e){return ''}}
  function refHost(){try{if(!d.referrer)return '';var h=new URL(d.referrer).hostname.replace(/^www\\./,'');
    return h===location.hostname?'':h}catch(e){return ''}}
  function device(){var w2=w.innerWidth||0;return w2<640?'mobile':w2<1024?'tablet':'desktop'}
  function os(){var u=navigator.userAgent;
    return /Windows/.test(u)?'Windows':/Android/.test(u)?'Android':/iPhone|iPad|iPod/.test(u)?'iOS':
           /Mac OS X/.test(u)?'macOS':/Linux/.test(u)?'Linux':'Other'}
  function browser(){var u=navigator.userAgent;
    return /Edg\\//.test(u)?'Edge':/OPR\\//.test(u)?'Opera':/Chrome\\//.test(u)?'Chrome':
           /Safari\\//.test(u)?'Safari':/Firefox\\//.test(u)?'Firefox':'Other'}

  function send(body){
    body.site=SITE; body.path=body.path||path(); body.ts=Date.now();
    if(localDev() && S.getAttribute('data-local')!=='true'){
      return (w.console&&console.info('[oa] skipped (localhost):',body.type,body.name||body.path));
    }
    var s=JSON.stringify(body);
    try{ if(navigator.sendBeacon && body.type!=='identify'){
      navigator.sendBeacon(API,new Blob([s],{type:'text/plain'})); return; } }catch(e){}
    try{ fetch(API,{method:'POST',body:s,keepalive:true,mode:'cors',
      headers:{'content-type':'text/plain'}}).catch(function(){}) }catch(e){}
  }

  function pageview(){
    var p=path(); if(p===lastPath||excluded(p))return; 
    if(lastPath!==null) flushTime();
    lastPath=p; t0=Date.now();
    send({type:'pageview',path:p,title:d.title,referrer:d.referrer||'',
      referrer_host:refHost(),
      source:param('utm_source')||param('ref')||param('source'),
      medium:param('utm_medium'), campaign:param('utm_campaign'),
      term:param('utm_term'), content:param('utm_content'),
      device:device(), os:os(), browser:browser(),
      screen_w:w.innerWidth||0, language:(navigator.language||'').slice(0,5)});
  }

  function flushTime(){
    var secs=Math.round((Date.now()-t0)/1000);
    if(lastPath && secs>1 && secs<3600) send({type:'engagement',path:lastPath,duration_s:secs});
  }

  var api={
    track:function(name,props){send({type:'event',name:String(name),props:props||{}})},
    goal:function(name,props){send({type:'conversion',name:String(name),props:props||{}})},
    revenue:function(amount,opts){opts=opts||{};
      send({type:'conversion',name:opts.name||'purchase',revenue:Number(amount)||0,
        currency:opts.currency||'USD',props:opts.props||{}})},
    identify:function(id,traits){traits=traits||{};
      send({type:'identify',external_id:String(id),email:traits.email||'',
        name_hint:traits.name||'',props:traits})},
    pageview:pageview
  };
  for(var i=0;i<qs.length;i++){}
  var pending=w.oa&&w.oa.q||[];
  w.oa=function(){var a=[].slice.call(arguments),m=a.shift();if(api[m])api[m].apply(null,a)};
  for(var j=0;j<pending.length;j++){w.oa.apply(null,pending[j])}
  w.openanalytics=api;

  if(AUTO){
    pageview();
    var ps=history.pushState, rs=history.replaceState;
    history.pushState=function(){ps.apply(this,arguments);setTimeout(pageview,0)};
    history.replaceState=function(){rs.apply(this,arguments);setTimeout(pageview,0)};
    w.addEventListener('popstate',function(){setTimeout(pageview,0)});
    w.addEventListener('hashchange',function(){if(HASH)setTimeout(pageview,0)});
    d.addEventListener('visibilitychange',function(){if(d.visibilityState==='hidden')flushTime()});
    w.addEventListener('pagehide',flushTime);
    d.addEventListener('click',function(e){
      var a=e.target&&e.target.closest&&e.target.closest('[data-oa-event]');
      if(a)api.track(a.getAttribute('data-oa-event'),
        {label:a.getAttribute('data-oa-label')||a.textContent.trim().slice(0,60)});
    },true);
  }
})(window,document);`;
