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
      var url=new URL('/emotion-iceberg/',window.location.origin);
      url.searchParams.set('lang',window.i18n.currentLang||'en');
      url.searchParams.set('surface','shadow_reflection_result');
      relatedCta.href=url.pathname+'?'+url.searchParams.toString();
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

    startBtn.addEventListener('click',function(){start('intro_button')});
    restartBtn.addEventListener('click',function(){track('shadow_reflection_restart',context('direct'));show(startScreen)});
    shareBtn.addEventListener('click',function(){
      var value=neutralUrl();
      if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(value).then(copied).catch(function(){fallbackCopy(value)});
      else fallbackCopy(value);
    });
    relatedCta.addEventListener('click',function(){track('shadow_reflection_related_click',Object.assign(context('direct'),{target_slug:'emotion-iceberg'}))});
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
