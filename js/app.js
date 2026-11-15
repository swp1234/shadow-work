(function(){
  'use strict';

  var TOTAL=8;
  var ICONS=['💬','🎤','💔','💼','🕰️','🌊','📝','🌙'];
  var PATTERNS=[
    {key:'appease',emoji:'🤝'},
    {key:'perfect',emoji:'◆'},
    {key:'control',emoji:'🧭'},
    {key:'withdraw',emoji:'🌫️'},
    {key:'assert',emoji:'🔥'},
    {key:'caretake',emoji:'💜'}
  ];
  var SURFACES=['direct','en_jung_shadow_primary','shadow_trigger_reset','shadow_quiz_guide','clarity_board'];
  var PRIVATE_KEYS=['answer','answers','score','scores','result','result_type','type','pattern','percentile'];

  function t(key,fallback){
    var value=window.i18n&&window.i18n.t?window.i18n.t(key):key;
    return value===key?(fallback||key):value;
  }
  function show(screen){
    document.querySelectorAll('.screen').forEach(function(node){node.classList.remove('active')});
    screen.classList.add('active');
    window.scrollTo(0,0);
  }
  function normalizeSurface(value){return SURFACES.indexOf(value)>-1?value:'direct'}
  function track(name,params){
    var payload=Object.assign({},params||{});
    PRIVATE_KEYS.forEach(function(key){delete payload[key]});
    if(typeof window.gtag==='function') window.gtag('event',name,payload);
  }
  function context(surface){
    return {entry_surface:normalizeSurface(surface),language:window.i18n?window.i18n.currentLang:'en',app_version:'shadow_reflection_v3'};
  }
  function launchParams(){
    var params=new URLSearchParams(window.location.search||'');
    return {surface:normalizeSurface(params.get('surface')||'direct'),auto:params.get('start')==='1'};
  }
  function replace(text,values){
    return Object.keys(values).reduce(function(output,key){return output.replace('{'+key+'}',values[key])},text);
  }

  async function init(){
    var startScreen=document.getElementById('start-screen');
    var questionScreen=document.getElementById('question-screen');
    var resultScreen=document.getElementById('result-screen');
    var startBtn=document.getElementById('start-btn');
    var restartBtn=document.getElementById('restart-btn');
    var downloadCardBtn=document.getElementById('download-card-btn');
    var shareBtn=document.getElementById('share-btn');
    var relatedCta=document.getElementById('related-cta');
    var evidence=document.getElementById('evidence-details');
    var langSelect=document.getElementById('lang-select');
    var themeToggle=document.getElementById('theme-toggle');
    var questionText=document.getElementById('question-text');
    var questionIcon=document.getElementById('question-icon');
    var questionCounter=document.getElementById('question-counter');
    var progressFill=document.getElementById('progress-fill');
    var optionsContainer=document.getElementById('options-container');
    var toast=document.getElementById('toast');
    var launch=launchParams();
    var current=0,answers=[],currentResult=null,autoConsumed=false,evidenceTracked=false,busy=false;

    try{await window.i18n.init()}catch(error){console.warn('Shadow reflection locale fallback',error)}

    function updateRelated(){
      var lang=window.i18n?window.i18n.currentLang:'en';
      var url=new URL('/future-self/',window.location.origin);
      url.searchParams.set('lang',lang);
      url.searchParams.set('source','shadow_work');
      url.searchParams.set('surface','shadow_reflection_result');
      if (relatedCta) {
        relatedCta.href=url.pathname+'?'+url.searchParams.toString();
        if (!relatedCta.dataset.trackedCta) {
          relatedCta.dataset.trackedCta = 'true';
          relatedCta.addEventListener('click', function() {
            track('content_cta_click', {
              cta_surface: 'shadow_work_hero',
              destination: relatedCta.getAttribute('href'),
              source: 'shadow_work',
              lang: lang
            });
          });
        }
      }

      document.querySelectorAll('.related-grid a').forEach(function(link) {
        var baseHref = link.getAttribute('data-base-href') || link.getAttribute('href');
        try {
          var u = new URL(baseHref, window.location.origin);
          u.searchParams.set('lang', lang);
          u.searchParams.set('source', 'shadow_work_result');
          link.href = u.pathname + u.search;
        } catch (_) {}
        if (!link.dataset.trackedCta) {
          link.dataset.trackedCta = 'true';
          link.addEventListener('click', function() {
            track('content_cta_click', {
              cta_surface: 'shadow_work_related',
              destination: link.getAttribute('href'),
              source: 'shadow_work',
              lang: lang
            });
          });
        }
      });

      var stores = { de: 'www.amazon.de', fr: 'www.amazon.fr', es: 'www.amazon.es', ja: 'www.amazon.co.jp', ko: 'www.amazon.com' };
      var host = stores[lang] || 'www.amazon.com';
      var curatedUrls = {
        manAndHisSymbols: 'https://' + host + '/dp/0440351839?tag=dopabrain-20',
        meetingTheShadow: 'https://' + host + '/dp/087477618X?tag=dopabrain-20'
      };
      document.querySelectorAll('#curated-resources-card .curated-item').forEach(function(link) {
        var key = link.getAttribute('data-curated-key');
        if (curatedUrls[key]) link.setAttribute('href', curatedUrls[key]);
        if (!link.dataset.trackedCurated) {
          link.dataset.trackedCurated = 'true';
          link.addEventListener('click', function() {
            var activeLang = window.i18n ? window.i18n.currentLang : lang;
            track('curated_resource_click', {
              app_name: 'shadow-work',
              resource_key: key,
              content_locale: activeLang,
              cta_surface: 'curated_resources'
            });
            track('content_cta_click', {
              cta_type: 'curated_book',
              destination: link.getAttribute('href'),
              source: 'shadow_work'
            });
          });
        }
      });
    }
    function renderQuestion(){
      var n=current+1;
      questionCounter.textContent=n+' / '+TOTAL;
      progressFill.style.width=(n/TOTAL*100)+'%';
      questionIcon.textContent=ICONS[current];
      questionText.textContent=t('question.'+current,'Question '+n);
      optionsContainer.innerHTML='';
      ['a','b','c','d','e','f'].forEach(function(letter,index){
        var button=document.createElement('button');
        button.type='button';
        button.className='option-btn';
        button.textContent=t('question.'+current+letter,'Option '+(index+1));
        button.addEventListener('click',function(){choose(index)});
        optionsContainer.appendChild(button);
      });
    }
    function start(origin){
      current=0;answers=[];currentResult=null;busy=false;
      show(questionScreen);renderQuestion();
      track('shadow_reflection_start',Object.assign(context(launch.surface),{start_origin:origin}));
    }
    function choose(index){
      if(busy)return;
      busy=true;answers[current]=index;
      if(current<TOTAL-1){current+=1;renderQuestion();busy=false;return}
      currentResult=calculate();renderResult();show(resultScreen);busy=false;
      track('shadow_reflection_complete',Object.assign(context(launch.surface),{scenario_count:TOTAL}));
    }
    function calculate(){
      var counts=[0,0,0,0,0,0];
      answers.forEach(function(index){if(index>=0&&index<PATTERNS.length)counts[index]+=1});
      var winner=0;
      counts.forEach(function(count,index){if(count>counts[winner])winner=index});
      return {index:winner,count:counts[winner]};
    }
    function renderResult(){
      if(!currentResult)return;
      var pattern=PATTERNS[currentResult.index];
      document.getElementById('result-emoji').textContent=pattern.emoji;
      document.getElementById('result-title').textContent=t('pattern.'+pattern.key,pattern.key);
      document.getElementById('result-count').textContent=replace(t('result.count','{count} of 8 answers'),{count:String(currentResult.count)});
      updateRelated();
    }
    function neutralUrl(){
      var url=new URL('https://dopabrain.com/shadow-work/');
      url.searchParams.set('lang',window.i18n.currentLang||'en');
      return url.toString();
    }
    function announce(message){
      toast.textContent=message;toast.classList.add('show');
      window.setTimeout(function(){toast.classList.remove('show')},1800);
    }
    function copied(){announce(t('result.copied','Link copied'));track('shadow_reflection_share',Object.assign(context('direct'),{method:'copy'}))}
    function fallbackCopy(value){
      var input=document.createElement('textarea');input.value=value;input.setAttribute('readonly','');document.body.appendChild(input);input.select();
      var ok=false;try{ok=document.execCommand('copy')}catch(error){ok=false}input.remove();if(ok)copied();
    }
    function downloadStoryCard(){
      if(!currentResult)return;
      var item=PATTERNS[currentResult.index];
      var label=t('pattern.'+item.key,item.key);
      var countLine=replace(t('result.count','{count} of 8 answers'),{count:String(currentResult.count)});
      var summaryText=t('result.summary','This names only the answer column you chose most often in these eight scenarios.');
      var canvas=document.createElement('canvas');
      canvas.width=1080;canvas.height=1920;
      var ctx=canvas.getContext('2d');
      var grad=ctx.createLinearGradient(0,0,1080,1920);
      grad.addColorStop(0,'#0c0b16');grad.addColorStop(0.55,'#211c35');grad.addColorStop(1,'#171426');
      ctx.fillStyle=grad;ctx.fillRect(0,0,1080,1920);
      ctx.fillStyle='rgba(167,139,250,0.16)';ctx.beginPath();ctx.arc(540,560,320,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#a78bfa';ctx.font='bold 34px sans-serif';ctx.textAlign='center';
      ctx.fillText('DOPABRAIN · SHADOW REFLECTION',540,210);
      ctx.font='180px sans-serif';ctx.fillText(item.emoji,540,610);
      ctx.fillStyle='#ffffff';ctx.font='bold 64px sans-serif';ctx.fillText(label,540,790);
      ctx.fillStyle='#a78bfa';ctx.font='bold 36px sans-serif';ctx.fillText(countLine,540,870);
      ctx.fillStyle='#cbd5e1';ctx.font='32px sans-serif';
      var words=summaryText.split(' '),line='',y=980;
      for(var i=0;i<words.length;i++){
        var test=line?(line+' '+words[i]):words[i];
        if(ctx.measureText(test).width>860&&line){ctx.fillText(line,540,y);line=words[i];y+=48;if(y>1520)break;}else{line=test;}
      }
      if(line&&y<=1560)ctx.fillText(line,540,y);
      ctx.fillStyle='#94a3b8';ctx.font='bold 30px sans-serif';ctx.fillText('dopabrain.com/shadow-work/',540,1760);
      try{var a=document.createElement('a');a.download='shadow-reflection.png';a.href=canvas.toDataURL('image/png');a.click();}catch(_){}
      track('save_image',Object.assign(context('direct'),{save_surface:'result_story_1080x1920'}));
    }

    startBtn.addEventListener('click',function(){start('intro_button')});
    restartBtn.addEventListener('click',function(){track('shadow_reflection_restart',context('direct'));show(startScreen)});
    if(downloadCardBtn)downloadCardBtn.addEventListener('click',downloadStoryCard);
    shareBtn.addEventListener('click',function(){
      var value=neutralUrl();
      if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(value).then(copied).catch(function(){fallbackCopy(value)});
      else fallbackCopy(value);
    });
    relatedCta.addEventListener('click',function(){
      track('shadow_reflection_related_click',Object.assign(context('direct'),{target_slug:'emotion-iceberg'}));
      if(typeof gtag==='function'){
        gtag('event','content_cta_click',{
          link_id:'shadow_reflection_related_emotion_iceberg',
          link_text:(relatedCta.textContent||'').trim().slice(0,40),
          target_url:relatedCta.href||'',
          source_page:'shadow_work'
        });
      }
    });
    evidence.addEventListener('toggle',function(){if(evidence.open&&!evidenceTracked){evidenceTracked=true;track('shadow_reflection_evidence_open',context('direct'))}});
    themeToggle.addEventListener('click',function(){
      var next=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';
      document.documentElement.setAttribute('data-theme',next);localStorage.setItem('shadow_reflection_theme',next);
    });
    langSelect.value=window.i18n.currentLang;
    langSelect.addEventListener('change',async function(){
      await window.i18n.setLanguage(this.value);updateRelated();
      if(questionScreen.classList.contains('active'))renderQuestion();
      if(resultScreen.classList.contains('active'))renderResult();
    });

    var savedTheme=localStorage.getItem('shadow_reflection_theme');
    if(savedTheme==='light'||savedTheme==='dark')document.documentElement.setAttribute('data-theme',savedTheme);
    updateRelated();
    var loader=document.getElementById('app-loader');if(loader)loader.classList.add('hidden');
    window.setTimeout(function(){if(document.visibilityState==='visible')track('shadow_reflection_view',context(launch.surface))},500);
    if(launch.auto)window.setTimeout(function(){if(!autoConsumed&&startScreen.classList.contains('active')){autoConsumed=true;start(launch.surface)}},250);
  }

  init().catch(function(error){
    console.error('Shadow reflection init error',error);
    var loader=document.getElementById('app-loader');if(loader)loader.classList.add('hidden');
  });
})();
