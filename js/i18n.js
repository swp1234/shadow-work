// i18n IIFE - wrapped in try-catch to prevent loader freeze
try {
(function() {
    'use strict';

    var SUPPORTED = ['ko', 'en', 'ja', 'zh', 'es', 'pt', 'id', 'tr', 'de', 'fr', 'hi', 'ru'];

    function I18n() {
        this.translations = {};
        this.supportedLanguages = SUPPORTED;
        this.currentLang = this.detectLanguage();
        this.isLoading = false;
    }

    I18n.prototype.detectLanguage = function() {
        var saved = localStorage.getItem('preferredLanguage');
        if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
        var browser = (navigator.language || '').split('-')[0].toLowerCase();
        if (SUPPORTED.indexOf(browser) !== -1) return browser;
        return 'ko';
    };

    I18n.prototype.loadTranslations = function(lang) {
        var self = this;
        if (self.isLoading) return Promise.resolve();
        self.isLoading = true;
        if (self.translations[lang]) {
            self.isLoading = false;
            return Promise.resolve(self.translations[lang]);
        }
        return fetch('js/locales/' + lang + '.json')
            .then(function(res) {
                if (!res.ok) throw new Error('Failed: ' + lang);
                return res.json();
            })
            .then(function(data) {
                self.translations[lang] = data;
                self.isLoading = false;
                return data;
            })
            .catch(function(e) {
                console.error('i18n load error:', e);
                self.isLoading = false;
                if (lang !== 'ko') return self.loadTranslations('ko');
            });
    };

    I18n.prototype.t = function(key) {
        var keys = key.split('.');
        var val = this.translations[this.currentLang];
        if (!val) return key;
        for (var i = 0; i < keys.length; i++) {
            if (val && typeof val === 'object' && keys[i] in val) {
                val = val[keys[i]];
            } else {
                return key;
            }
        }
        return val || key;
    };

    I18n.prototype.setLanguage = function(lang) {
        if (SUPPORTED.indexOf(lang) === -1) return Promise.resolve();
        this.currentLang = lang;
        localStorage.setItem('preferredLanguage', lang);
        var self = this;
        return this.loadTranslations(lang).then(function() {
            self.updateUI();
            self.updateLangButtons();
        });
    };

    I18n.prototype.updateUI = function() {
        var self = this;
        document.querySelectorAll('[data-i18n]').forEach(function(el) {
            var key = el.getAttribute('data-i18n');
            var text = self.t(key);
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                if (el.placeholder !== undefined) el.placeholder = text;
            } else if (el.tagName === 'META') {
                el.setAttribute('content', text);
            } else {
                el.textContent = text;
            }
        });
    };

    I18n.prototype.updateLangButtons = function() {
        var lang = this.currentLang;
        document.querySelectorAll('.lang-option').forEach(function(btn) {
            var isActive = btn.getAttribute('data-lang') === lang;
            if (isActive) btn.classList.add('active');
            else btn.classList.remove('active');
        });
    };

    I18n.prototype.getCurrentLanguage = function() { return this.currentLang; };

    I18n.prototype.init = function() {
        var self = this;
        return this.loadTranslations(this.currentLang).then(function() {
            self.updateUI();
            self.updateLangButtons();
        });
    };

    window.i18n = new I18n();
})();
} catch (e) {
    console.error('i18n IIFE error:', e);
}
