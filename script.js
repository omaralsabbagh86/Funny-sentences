const CURRENT_VERSION = "V8";
const KEYS = ['girls', 'verbs', 'bodyParts', 'boys'];
const COLUMNS = [
    { key: 'girls',     title: 'girls', ph: 'phName' },
    { key: 'verbs',     title: 'verbs', ph: 'phVerb' },
    { key: 'bodyParts', title: 'body',  ph: 'phBody' },
    { key: 'boys',      title: 'boys',  ph: 'phName' }
];
const LS_KEY = 'sgb_state_v7';
const MAX_CHIPS = 300;
const LIBS = {
    XLSX: 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
    docx: 'https://cdn.jsdelivr.net/npm/docx@7.8.2/build/index.js',
    JSZip: 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'
};

let currentLang = 'ar';
let generatedSentences = [];
let deferredPrompt = null;
let userScore = 0;
let userLevel = 1;
let soundOn = true;
let audioCtx = null;

// كل لغة لها مخزنها الخاص حتى لا تختلط الكلمات العربية بالإنجليزية
const presets = {
    ar: {
        girls: ["هناء", "فاطمة", "سارة", "ريم", "ليلى"],
        verbs: ["يغسل", "يأكل", "يرى", "يمسك", "يحرك"],   // مضارع مذكر -> يتحول تلقائياً للمؤنث
        bodyParts: ["يد", "وجه", "قدم", "عين", "رأس"],
        boys: ["محمد", "أحمد", "علي", "خالد", "يوسف"]
    },
    en: {
        girls: ["Emma", "Olivia", "Sophia", "Ava", "Mia"],
        verbs: ["wash", "eat", "see", "touch", "move"],
        bodyParts: ["hand", "face", "foot", "eye", "head"],
        boys: ["John", "Alex", "James", "Ryan", "Leo"]
    }
};

const SHEET_HEADERS = {
    ar: { girls: "أسماء البنات (Girls)", verbs: "الأفعال الجذعية (Verbs)", bodyParts: "أعضاء الجسم (Body Parts)", boys: "أسماء الشباب (Boys)" },
    en: { girls: "Girls", verbs: "Verbs", bodyParts: "Body Parts", boys: "Boys" }
};

const storage = { ar: {}, en: {} };
function resetToPresets() {
    ['ar', 'en'].forEach(l => KEYS.forEach(k => { storage[l][k] = [...presets[l][k]]; }));
}
resetToPresets();
const S = () => storage[currentLang];

const I18N = {
    ar: {
        version: v => `إصدار ${v}`,
        pageTitle: v => `مكوّن الجمل الذكي - ${v}`,
        score: (s, l) => `🏆 النقاط: ${s} | مستوى: ${l}`,
        levelUp: l => `🎉 مبروك! وصلت إلى المستوى ${l}`,
        title: "مكوّن الجمل العشوائي القواعدي 🎲",
        tabGame: "اللعب والإدخال", tabIo: "الملفات والتصدير",
        hint: "اكتب كلمة واضغط Enter للإضافة — أو الصق عدة كلمات مفصولة بفاصلة أو سطر جديد.",
        girls: "👧 أسماء بنات", verbs: "⚡ أفعال (مضارع مذكر)", body: "💪 أعضاء جسم", boys: "👦 أسماء شباب",
        phName: "اسم جديد", phVerb: "فعل جديد (مثل: يكتب)", phBody: "عضو جديد",
        add: "إضافة ➕", emptyList: "لا توجد كلمات بعد", moreChips: n => `… و${n} كلمة أخرى`,
        remove: w => `حذف ${w}`,
        mixCurr: "🎲 ولّد جملاً جديدة", mixAll: "إعادة التوزيع الشامل 🔄", copyAll: "نسخ كل الجمل 📋",
        clear: "مسح كل المدخلات 🗑️",
        sampleTitle: "تنزيل ملف Excel نموذجي للمدخلات",
        sampleGirls: "نموذج البنات 👧", sampleVerbs: "نموذج الأفعال ⚡", sampleBody: "نموذج الأعضاء 💪", sampleBoys: "نموذج الشباب 👦",
        uploadTitle: "رفع قائمة كلمات جاهزة",
        uploadHint: "اختر القائمة المستهدفة ثم ارفع ملف Excel أو نصي (كلمة في كل سطر). التكرار يُتجاهل تلقائياً.",
        optGirls: "أسماء البنات (Girls)", optVerbs: "الأفعال (Verbs)", optBody: "أعضاء الجسم (Body Parts)", optBoys: "أسماء الشباب (Boys)",
        downloadTitle: "تنزيل الجمل والتحديثات",
        dlTxt: "ملف نصي TXT 📄", dlExcel: "ملف إكسل Excel 📊", dlWord: "ملف وورد Word 📝",
        dlAll: "⬇️ تنزيل كل الملفات دفعة واحدة (ZIP)", allDone: "تم تنزيل كل الملفات ✅",
        update: "التحقق من التحديثات وتحديث الصفحة 🔄",
        apk: "تثبيت كتطبيق 📱",
        themeDark: "🌙 داكن", themeLight: "☀️ فاتح",
        resultsEmpty: "اضغط «ولّد جملاً جديدة» لتظهر الجمل هنا...",
        resultsTitle: (v, n) => `الجمل الناتجة (${n}) - ${v} ✨`,
        tapToCopy: "اضغط على أي جملة لنسخها",
        copied: "تم نسخ الجملة ✅", copiedAll: "تم نسخ كل الجمل ✅", copyFail: "تعذر النسخ",
        wordTitle: "الجمل المتولدة", sheetName: "الجمل", sheetCol: "الجملة",
        duplicate: "هذه الكلمة موجودة مسبقاً",
        added: n => `تمت إضافة ${n} كلمة ✅`,
        removed: w => `تم حذف «${w}»`,
        storageEmpty: "إحدى القوائم فارغة! أضف كلمة واحدة على الأقل في كل قائمة.",
        cleared: "تم مسح كل المدخلات", undo: "تراجع", undone: "تمت الاستعادة ✅",
        nothingToExport: "لا توجد جمل بعد. اضغط «ولّد جملاً جديدة» أولاً.",
        libMissing: "تعذر تحميل المكتبة المطلوبة. تحقق من الإنترنت وحاول مجدداً.",
        loading: "جارٍ التحميل…",
        uploadDone: (a, s) => `أضيفت ${a} كلمة جديدة، وتم تجاهل ${s} (مكررة أو فارغة).`,
        uploadEmpty: "لم يتم العثور على كلمات صالحة في الملف.",
        uploadErr: "تعذرت قراءة الملف. تأكد من أنه ملف Excel أو نصي صحيح.",
        installHelp: "للتثبيت: افتح قائمة المتصفح (⋮) ثم اختر «إضافة إلى الشاشة الرئيسية» أو «تثبيت التطبيق».",
        newVersion: v => `يوجد إصدار أحدث (${v}). هل تريد التحديث الآن؟`,
        upToDate: "أنت تستخدم أحدث إصدار ✅",
        updateFail: "تعذر الاتصال بالسيرفر للتحقق من التحديثات."
    },
    en: {
        version: v => `Version ${v}`,
        pageTitle: v => `Smart Sentence Builder - ${v}`,
        score: (s, l) => `🏆 Score: ${s} | Lvl: ${l}`,
        levelUp: l => `🎉 Level up! You reached level ${l}`,
        title: "Grammar Sentence Generator 🎲",
        tabGame: "Play & Input", tabIo: "Files & Export",
        hint: "Type a word and press Enter to add it — or paste several words separated by commas or new lines.",
        girls: "👧 Girl Names", verbs: "⚡ Verbs (base form)", body: "💪 Body Parts", boys: "👦 Boy Names",
        phName: "New name", phVerb: "New verb (e.g. write)", phBody: "New body part",
        add: "Add ➕", emptyList: "No words yet", moreChips: n => `… and ${n} more`,
        remove: w => `Remove ${w}`,
        mixCurr: "🎲 Generate new sentences", mixAll: "Re-Randomize Everything 🔄", copyAll: "Copy all sentences 📋",
        clear: "Clear all inputs 🗑️",
        sampleTitle: "Download sample Excel input files",
        sampleGirls: "Girls template 👧", sampleVerbs: "Verbs template ⚡", sampleBody: "Body parts template 💪", sampleBoys: "Boys template 👦",
        uploadTitle: "Upload a ready word list",
        uploadHint: "Pick the target list, then upload an Excel or text file (one word per line). Duplicates are skipped automatically.",
        optGirls: "Girl names (Girls)", optVerbs: "Verbs (Verbs)", optBody: "Body parts (Body Parts)", optBoys: "Boy names (Boys)",
        downloadTitle: "Download sentences & updates",
        dlTxt: "Text file TXT 📄", dlExcel: "Excel file 📊", dlWord: "Word file 📝",
        dlAll: "⬇️ Download all files at once (ZIP)", allDone: "All files downloaded ✅",
        update: "Check for updates & refresh 🔄",
        apk: "Install as app 📱",
        themeDark: "🌙 Dark", themeLight: "☀️ Light",
        resultsEmpty: "Press “Generate new sentences” and they will appear here...",
        resultsTitle: (v, n) => `Generated sentences (${n}) - ${v} ✨`,
        tapToCopy: "Tap any sentence to copy it",
        copied: "Sentence copied ✅", copiedAll: "All sentences copied ✅", copyFail: "Copy failed",
        wordTitle: "Generated sentences", sheetName: "Sentences", sheetCol: "Sentence",
        duplicate: "This word already exists",
        added: n => `Added ${n} word(s) ✅`,
        removed: w => `Removed “${w}”`,
        storageEmpty: "One of the lists is empty! Add at least one word to every list.",
        cleared: "All inputs cleared", undo: "Undo", undone: "Restored ✅",
        nothingToExport: "No sentences yet. Press “Generate new sentences” first.",
        libMissing: "Couldn't load a required library. Check your internet and try again.",
        loading: "Loading…",
        uploadDone: (a, s) => `Added ${a} new word(s), skipped ${s} (duplicate or empty).`,
        uploadEmpty: "No valid words were found in the file.",
        uploadErr: "Could not read the file. Make sure it is a valid Excel or text file.",
        installHelp: "To install: open the browser menu (⋮) and choose “Add to Home screen” or “Install app”.",
        newVersion: v => `A newer version (${v}) is available. Update now?`,
        upToDate: "You are on the latest version ✅",
        updateFail: "Couldn't reach the server to check for updates."
    }
};

function t(key, ...args) {
    const v = I18N[currentLang][key];
    return typeof v === 'function' ? v(...args) : v;
}
const $ = id => document.getElementById(id);

/* ---------- الحفظ التلقائي ---------- */
let saveTimer = null;
function saveState() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify({ lang: currentLang, score: userScore, sound: soundOn, storage }));
        } catch (e) {}
    }, 250);
}

function loadState() {
    try {
        const d = JSON.parse(localStorage.getItem(LS_KEY));
        if (!d) return;
        ['ar', 'en'].forEach(l => KEYS.forEach(k => {
            const arr = d.storage && d.storage[l] && d.storage[l][k];
            if (Array.isArray(arr)) storage[l][k] = arr.filter(x => typeof x === 'string');
        }));
        userScore = Number(d.score) || 0;
        soundOn = d.sound !== false;
        if (d.lang === 'en') currentLang = 'en';
    } catch (e) {}
}

/* ---------- إشعارات صغيرة بدل alert ---------- */
let toastTimer = null;
function showToast(msg, action, ms = 3200) {
    const el = $('toast');
    el.textContent = '';
    const span = document.createElement('span');
    span.textContent = msg;
    el.appendChild(span);
    if (action) {
        const b = document.createElement('button');
        b.textContent = action.label;
        b.onclick = () => { action.fn(); el.classList.remove('show'); };
        el.appendChild(b);
    }
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), action ? Math.max(ms, 7000) : ms);
}

/* ---------- الصوت ---------- */
function playSoundEffect(type) {
    if (!soundOn) return;
    try {
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        gain.gain.setValueAtTime(0.08, now);
        const dur = type === 'success' ? 0.3 : 0.2;
        if (type === 'success') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, now);
            osc.frequency.setValueAtTime(659.25, now + 0.1);
            osc.frequency.setValueAtTime(783.99, now + 0.2);
        } else {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.linearRampToValueAtTime(100, now + 0.2);
        }
        gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        osc.start(now);
        osc.stop(now + dur);
    } catch (e) {}
}

function updateSoundButton() {
    $('btn-sound').textContent = soundOn ? '🔊' : '🔇';
}
function toggleSound() {
    soundOn = !soundOn;
    updateSoundButton();
    saveState();
    if (soundOn) playSoundEffect('success');
}

/* ---------- النقاط والمظهر ---------- */
function updateScoreBadge() {
    userLevel = Math.floor(userScore / 150) + 1;
    $('score-badge').textContent = t('score', userScore, userLevel);
}

function updateScore(points) {
    const before = Math.floor(userScore / 150) + 1;
    userScore += points;
    updateScoreBadge();
    if (userLevel > before) showToast(t('levelUp', userLevel));
    saveState();
}

function updateThemeButton() {
    const dark = $('html-root').getAttribute('data-theme') === 'dark';
    $('btn-theme').textContent = dark ? t('themeLight') : t('themeDark');
}

function toggleTheme() {
    const root = $('html-root');
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    updateThemeButton();
}

function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem('theme'); } catch (e) {}
    if (!saved) saved = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    $('html-root').setAttribute('data-theme', saved);
}

/* ---------- الواجهة واللغة ---------- */
function buildColumns() {
    const frag = document.createDocumentFragment();
    COLUMNS.forEach(c => {
        const box = document.createElement('div');
        box.className = 'column-box';
        box.innerHTML = `
            <h3><span data-i18n="${c.title}"></span><span class="count" id="count-${c.key}">0</span></h3>
            <div class="add-row">
                <input type="text" id="in-${c.key}" data-i18n-placeholder="${c.ph}" autocomplete="off" enterkeyhint="done">
                <button class="btn-add" data-add="${c.key}" data-i18n="add"></button>
            </div>
            <div class="chips" id="chips-${c.key}"></div>`;
        frag.appendChild(box);
    });
    $('columns').appendChild(frag);

    // تفويض الأحداث: مستمع واحد بدل عشرات المستمعات
    $('columns').addEventListener('click', e => {
        const add = e.target.closest('[data-add]');
        if (add) return addFromInput(add.dataset.add);
        const del = e.target.closest('[data-del]');
        if (del) removeWord(del.dataset.del, Number(del.dataset.i));
    });
    $('columns').addEventListener('keydown', e => {
        if (e.key === 'Enter' && e.target.matches('input[type="text"]')) {
            e.preventDefault();
            addFromInput(e.target.id.replace('in-', ''));
        }
    });
}

function setLanguage(lang) {
    currentLang = lang;
    const root = $('html-root');
    root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    root.setAttribute('lang', lang);
    $('btn-ar').classList.toggle('active', lang === 'ar');
    $('btn-en').classList.toggle('active', lang === 'en');
    generatedSentences = [];
    $('results-list').textContent = '';
    localizeUI();
    autoGenerate();
    saveState();
}

function localizeUI() {
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
    $('version-badge').textContent = t('version', CURRENT_VERSION);
    document.title = t('pageTitle', CURRENT_VERSION);
    updateThemeButton();
    updateSoundButton();
    updateScoreBadge();
    KEYS.forEach(renderChips);
    updateResultTitle();
}

function updateResultTitle() {
    $('result-title').textContent = generatedSentences.length
        ? t('resultsTitle', CURRENT_VERSION, generatedSentences.length)
        : t('resultsEmpty');
}

function renderChips(key) {
    const list = S()[key];
    $(`count-${key}`).textContent = list.length;
    const box = $(`chips-${key}`);
    const frag = document.createDocumentFragment();

    if (!list.length) {
        const n = document.createElement('span');
        n.className = 'empty-note';
        n.textContent = t('emptyList');
        frag.appendChild(n);
    }
    list.slice(0, MAX_CHIPS).forEach((word, i) => {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.append(word);
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = '×';
        b.dataset.del = key;
        b.dataset.i = i;
        b.setAttribute('aria-label', t('remove', word));
        chip.appendChild(b);
        frag.appendChild(chip);
    });
    if (list.length > MAX_CHIPS) {
        const more = document.createElement('span');
        more.className = 'more-note';
        more.textContent = t('moreChips', list.length - MAX_CHIPS);
        frag.appendChild(more);
    }
    box.replaceChildren(frag);
}

/* ---------- إدارة الكلمات ---------- */
const norm = w => String(w).trim().toLocaleLowerCase();
const splitWords = text => String(text).split(/[\r\n,،;\t]+/).map(w => w.trim()).filter(Boolean);

function addUnique(storageKey, words) {
    const list = S()[storageKey];
    const seen = new Set(list.map(norm));
    let added = 0, skipped = 0;
    words.forEach(w => {
        const clean = String(w).trim();
        if (!clean || seen.has(norm(clean))) { skipped++; return; }
        seen.add(norm(clean));
        list.push(clean);
        added++;
    });
    return { added, skipped };
}

function addFromInput(key) {
    const input = $(`in-${key}`);
    const words = splitWords(input.value);
    if (!words.length) { input.focus(); return; }

    const { added } = addUnique(key, words);
    if (!added) { showToast(t('duplicate')); input.select(); return; }

    renderChips(key);
    input.value = '';
    input.focus();
    showToast(t('added', added));
    playSoundEffect('success');
    updateScore(10 * added);
}

function removeWord(key, index) {
    const list = S()[key];
    const [word] = list.splice(index, 1);
    if (word === undefined) return;
    renderChips(key);
    saveState();
    showToast(t('removed', word), {
        label: t('undo'),
        fn: () => { list.splice(index, 0, word); renderChips(key); saveState(); }
    });
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => {
        const on = b.id === `tab-${tab}`;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', on);
    });
    document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === `content-${tab}`));
    if (tab === 'io') loadLib('XLSX').catch(() => {}); // تحميل مسبق في الخلفية
}

/* ---------- القواعد وتوليد الجمل ---------- */
function shuffle(array) {
    const a = [...array];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function applyGrammarRules(girl, baseVerb) {
    const verb = baseVerb.trim();
    if (currentLang === 'ar') {
        if (verb.startsWith('ي')) return 'ت' + verb.substring(1);
        if (!verb.startsWith('ت')) return 'ت' + verb;
        return verb;
    }
    if (/[^aeiou]y$/i.test(verb)) return verb.slice(0, -1) + 'ies';
    if (/(s|x|z|ch|sh|o)$/i.test(verb)) return verb + 'es';
    return verb + 's';
}

function buildSentences(lists, count) {
    const frag = document.createDocumentFragment();
    generatedSentences = [];
    for (let i = 0; i < count; i++) {
        const [girl, rawVerb, body, boy] = lists.map(l => l[i % l.length]);
        const verb = applyGrammarRules(girl, rawVerb);
        const sentence = currentLang === 'ar'
            ? `${girl} ${verb} ${body} ${boy}.`
            : `${girl} ${verb} ${boy}'s ${body}.`;
        generatedSentences.push(sentence);
        const div = document.createElement('div');
        div.className = 'sentence-card';
        div.textContent = sentence;
        div.title = t('tapToCopy');
        frag.appendChild(div);
    }
    $('results-list').replaceChildren(frag);
    updateResultTitle();
}

const listsReady = () => KEYS.every(k => S()[k].length > 0);

// عرض جمل جاهزة عند فتح الصفحة (بلا نقاط ولا صوت)
function autoGenerate() {
    if (!listsReady()) return;
    buildSentences(KEYS.map(k => shuffle(S()[k])), Math.min(...KEYS.map(k => S()[k].length)));
}

function mixCurrentRound() {
    if (!listsReady()) return showToast(t('storageEmpty'));
    autoGenerate();
    playSoundEffect('success');
    updateScore(50);
}

function mixAllStorage() {
    if (!listsReady()) return showToast(t('storageEmpty'));
    const s = S();
    KEYS.forEach(k => { s[k] = shuffle(s[k]); renderChips(k); });
    buildSentences(KEYS.map(k => s[k]), Math.max(...KEYS.map(k => s[k].length)));
    playSoundEffect('success');
    updateScore(50);
}

function clearAllData() {
    const snapshot = JSON.stringify({ storage, score: userScore });
    ['ar', 'en'].forEach(l => KEYS.forEach(k => { storage[l][k] = []; }));
    generatedSentences = [];
    userScore = 0;
    document.querySelectorAll('input[type="text"]').forEach(i => { i.value = ''; });
    $('file-uploader').value = '';
    $('results-list').textContent = '';
    KEYS.forEach(renderChips);
    updateScoreBadge();
    updateResultTitle();
    saveState();
    playSoundEffect('clear');
    showToast(t('cleared'), {
        label: t('undo'),
        fn: () => {
            const d = JSON.parse(snapshot);
            ['ar', 'en'].forEach(l => KEYS.forEach(k => { storage[l][k] = d.storage[l][k]; }));
            userScore = d.score;
            KEYS.forEach(renderChips);
            updateScoreBadge();
            autoGenerate();
            saveState();
            showToast(t('undone'));
        }
    });
}

/* ---------- النسخ ---------- */
async function copyText(text, okMsg) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
        }
        showToast(okMsg);
    } catch (e) { showToast(t('copyFail')); }
}

function copyAll() {
    if (!generatedSentences.length) return showToast(t('nothingToExport'));
    copyText(generatedSentences.join('\n'), t('copiedAll'));
}

/* ---------- المكتبات (تُحمَّل عند الحاجة فقط) ---------- */
const libPromises = {};
function loadLib(name) {
    if (window[name]) return Promise.resolve(window[name]);
    if (!libPromises[name]) {
        libPromises[name] = new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = LIBS[name];
            s.onload = () => resolve(window[name]);
            s.onerror = () => { delete libPromises[name]; reject(new Error('lib')); };
            document.head.appendChild(s);
        });
    }
    return libPromises[name];
}

async function withLib(name, fn) {
    if (!window[name]) showToast(t('loading'), null, 8000);
    let lib;
    try { lib = await loadLib(name); } catch (e) { return showToast(t('libMissing')); }
    return fn(lib);
}

/* ---------- الملفات ---------- */
function saveBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const stamp = () => new Date().toISOString().slice(0, 10);

function downloadSampleExcel(type) {
    withLib('XLSX', XLSX => {
        const rows = [[SHEET_HEADERS[currentLang][type]], ...presets[currentLang][type].map(w => [w])];
        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws['!cols'] = [{ wch: 28 }];
        const wb = XLSX.utils.book_new();
        wb.Workbook = { Views: [{ RTL: currentLang === 'ar' }] };
        XLSX.utils.book_append_sheet(wb, ws, 'Sample');
        XLSX.writeFile(wb, `sample_${type}.xlsx`);
    });
}

function readFileAsWords(file, XLSX) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error);
        const isExcel = /\.(xlsx|xls)$/i.test(file.name);

        reader.onload = () => {
            try {
                let words;
                if (isExcel) {
                    const wb = XLSX.read(reader.result, { type: 'array' });
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });
                    words = rows.map(r => (r[0] === undefined ? '' : String(r[0]).trim())).filter(Boolean);
                } else {
                    words = splitWords(String(reader.result).replace(/^\uFEFF/, ''));
                }
                const headers = new Set(['ar', 'en'].flatMap(l => Object.values(SHEET_HEADERS[l])).map(norm));
                if (words.length && headers.has(norm(words[0]))) words.shift();
                resolve(words);
            } catch (err) { reject(err); }
        };
        if (isExcel) reader.readAsArrayBuffer(file);
        else reader.readAsText(file, 'UTF-8');
    });
}

async function handleUniversalUpload(event) {
    const input = event.target;
    const file = input.files && input.files[0];
    if (!file) return;
    try {
        const isExcel = /\.(xlsx|xls)$/i.test(file.name);
        let XLSX = null;
        if (isExcel) {
            showToast(t('loading'), null, 8000);
            try { XLSX = await loadLib('XLSX'); } catch (e) { return showToast(t('libMissing')); }
        }
        const words = await readFileAsWords(file, XLSX);
        if (!words.length) return showToast(t('uploadEmpty'));
        const target = $('upload-target').value;
        const { added, skipped } = addUnique(target, words);
        renderChips(target);
        if (added) { playSoundEffect('success'); updateScore(added * 5); }
        showToast(t('uploadDone', added, skipped), null, 5000);
    } catch (err) {
        showToast(t('uploadErr'));
    } finally {
        input.value = '';
    }
}

function requireSentences() {
    if (!generatedSentences.length) { showToast(t('nothingToExport')); return false; }
    return true;
}

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const blobToBuffer = blob => new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(fr.error);
    fr.readAsArrayBuffer(blob);
});

function txtBlob() {
    return new Blob(['\uFEFF' + generatedSentences.join('\r\n')], { type: 'text/plain;charset=utf-8' });
}

function xlsxBlob(XLSX) {
    const rows = [['#', t('sheetCol')], ...generatedSentences.map((s, i) => [i + 1, s])];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 5 }, { wch: 50 }];
    const wb = XLSX.utils.book_new();
    wb.Workbook = { Views: [{ RTL: currentLang === 'ar' }] };
    XLSX.utils.book_append_sheet(wb, ws, t('sheetName'));
    return new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: XLSX_MIME });
}

function docxBlob(docx) {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;
    const rtl = currentLang === 'ar';
    const children = [
        new Paragraph({
            heading: HeadingLevel.HEADING_1,
            bidirectional: rtl,
            children: [new TextRun({ text: t('wordTitle'), rightToLeft: rtl })]
        }),
        ...generatedSentences.map((s, i) => new Paragraph({
            bidirectional: rtl,
            spacing: { after: 120 },
            children: [new TextRun({ text: `${i + 1}. ${s}`, rightToLeft: rtl, size: 28 })]
        }))
    ];
    return Packer.toBlob(new Document({ sections: [{ children }] }));
}

function downloadTXT() {
    if (!requireSentences()) return;
    saveBlob(txtBlob(), `sentences_${stamp()}.txt`);
}

function downloadExcel() {
    if (!requireSentences()) return;
    withLib('XLSX', XLSX => saveBlob(xlsxBlob(XLSX), `sentences_${stamp()}.xlsx`));
}

function downloadWord() {
    if (!requireSentences()) return;
    withLib('docx', docx => docxBlob(docx).then(b => saveBlob(b, `sentences_${stamp()}.docx`)));
}

// تنزيل TXT + Excel + Word دفعة واحدة داخل ملف ZIP واحد
async function downloadAll() {
    if (!requireSentences()) return;
    showToast(t('loading'), null, 10000);
    try {
        const [XLSX, docx] = await Promise.all([loadLib('XLSX'), loadLib('docx')]);
        const d = stamp();
        const files = [
            [`sentences_${d}.txt`, txtBlob()],
            [`sentences_${d}.xlsx`, xlsxBlob(XLSX)],
            [`sentences_${d}.docx`, await docxBlob(docx)]
        ];
        let JSZip = null;
        try { JSZip = await loadLib('JSZip'); } catch (e) {}

        if (JSZip) {
            const zip = new JSZip();
            for (const [name, blob] of files) zip.file(name, await blobToBuffer(blob));
            saveBlob(await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' }), `sentences_${d}.zip`);
        } else {
            // خطة بديلة: تنزيل الملفات واحداً تلو الآخر
            for (const [name, blob] of files) { saveBlob(blob, name); await sleep(400); }
        }
        showToast(t('allDone'));
    } catch (e) {
        showToast(t('libMissing'));
    }
}

/* ---------- التثبيت والتحديث ---------- */
window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
});
window.addEventListener('appinstalled', () => { deferredPrompt = null; });

async function installAsAPK() {
    if (!deferredPrompt) return showToast(t('installHelp'), null, 7000);
    deferredPrompt.prompt();
    try { await deferredPrompt.userChoice; } catch (e) {}
    deferredPrompt = null;
}

async function hardReload() {
    try {
        if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map(k => caches.delete(k)));
        }
        if (navigator.serviceWorker) {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map(r => r.unregister()));
        }
    } catch (e) {}
    location.reload();
}

async function checkForLatestUpdates() {
    try {
        const res = await fetch(`script.js?nocache=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(res.status);
        const match = (await res.text()).match(/const CURRENT_VERSION\s*=\s*"([^"]+)"/);
        const latest = match ? match[1] : null;
        if (latest && latest !== CURRENT_VERSION) {
            if (confirm(t('newVersion', latest))) await hardReload();
        } else {
            showToast(t('upToDate'));
        }
    } catch (e) {
        showToast(t('updateFail'));
    }
}

/* ---------- التشغيل ---------- */
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadState();
    buildColumns();
    setLanguage(currentLang);
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    }
});
