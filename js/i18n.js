(function(){
  'use strict';
  var SUPPORTED=['ko','en','zh','hi','ru','ja','es','pt','id','tr','de','fr'];
  function I18n(){this.translations={};this.supportedLanguages=SUPPORTED;this.currentLang=this.detectLanguage()}
  I18n.prototype.detectLanguage=function(){
    try{var urlLang=new URLSearchParams(window.location.search||'').get('lang');if(SUPPORTED.indexOf(urlLang)>-1)return urlLang}catch(error){}
    var saved=localStorage.getItem('shadow_reflection_language');if(SUPPORTED.indexOf(saved)>-1)return saved;
    var browser=(navigator.language||'en').split('-')[0].toLowerCase();return SUPPORTED.indexOf(browser)>-1?browser:'en';
  };
  I18n.prototype.load=function(lang){
    var self=this;if(self.translations[lang])return Promise.resolve(true);
    return fetch('js/locales/'+lang+'.json').then(function(response){if(!response.ok)throw new Error('locale '+lang);return response.json()}).then(function(data){self.translations[lang]=data;return true}).catch(function(error){if(lang!=='en')return self.load('en').then(function(){self.currentLang='en';return false});throw error});
  };
  I18n.prototype.t=function(key){
    var value=this.translations[this.currentLang]||this.translations.en;var parts=key.split('.');
    for(var i=0;i<parts.length;i++){if(value&&typeof value==='object'&&Object.prototype.hasOwnProperty.call(value,parts[i]))value=value[parts[i]];else return key}
    return typeof value==='string'?value:key;
  };
  I18n.prototype.updateUI=function(){
    var self=this;document.documentElement.lang=this.currentLang;
    document.querySelectorAll('[data-i18n]').forEach(function(node){var value=self.t(node.getAttribute('data-i18n'));if(value!==node.getAttribute('data-i18n'))node.textContent=value});
    document.querySelectorAll('[data-i18n-aria]').forEach(function(node){var value=self.t(node.getAttribute('data-i18n-aria'));if(value!==node.getAttribute('data-i18n-aria'))node.setAttribute('aria-label',value)});
    var title=this.t('meta.title');if(title!=='meta.title')document.title=title;
    var description=document.querySelector('meta[name="description"]');var copy=this.t('meta.description');if(description&&copy!=='meta.description')description.content=copy;
  };
  I18n.prototype.init=function(){var self=this;return self.load(self.currentLang).then(function(){self.updateUI();return true})};
  I18n.prototype.setLanguage=function(lang){
    var self=this;if(SUPPORTED.indexOf(lang)===-1)return Promise.resolve(false);
    return self.load(lang).then(function(){self.currentLang=lang;localStorage.setItem('shadow_reflection_language',lang);self.updateUI();return true});
  };
  window.i18n=new I18n();
})();
