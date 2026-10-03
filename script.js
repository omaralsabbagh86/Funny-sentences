const CURRENT_VERSION = "V6";
let currentLang = 'ar';
let globalStorage = { girls: [], verbs: [], bodyParts: [], boys: [] };
let generatedSentences = [];
let deferredPrompt;
let userScore = 0;
let userLevel = 1;

const presets = {
    ar: {
        girls: ["هناء", "فاطمة", "سارة", "ريم", "ليلى"],
        verbs: ["غسل", "أكل", "رأى", "أمسك", "حرك"],
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

function playSoundEffect(type) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        if (type === 'success') {
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime);
            oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.3);
        } else if (type === 'clear') {
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
            oscillator.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.2);
        }
    } catch (e) {}
}

function updateScore(points) {
    userScore += points;
    userLevel = Math.floor(userScore / 150) + 1;
    document.getElementById('score-badge').innerText = currentLang === 'ar' ? `🏆 النقاط: ${userScore} | مستوى: ${userLevel}` : `🏆 Score: ${userScore} | Lvl: ${userLevel}`;
}

function toggleTheme() {
    const root = document.getElementById('html-root');
    const currentTheme = root.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    document.getElementById('btn-theme').innerText = newTheme === 'dark' ? '☀️ الوضع الفاتح' : '🌙 الوضع الداكن';
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.getElementById('html-root').setAttribute('data-theme', savedTheme);
    document.getElementById('btn-theme').innerText = savedTheme === 'dark' ? '☀️ الوضع الفاتح' : '🌙 الوضع الداكن';
}

function setLanguage(lang) {
    currentLang = lang;
    const root = document.getElementById('html-root');
    if(lang === 'ar') {
        root.setAttribute('dir', 'rtl');
        root.setAttribute('lang', 'ar');
        document.getElementById('btn-ar').classList.add('active');
        document.getElementById('btn-en').classList.remove('active');
    } else {
        root.setAttribute('dir', 'ltr');
        root.setAttribute('lang', 'en');
        document.getElementById('btn-en').classList.add('active');
        document.getElementById('btn-ar').classList.remove('active');
    }
    localizeUI();
    populatePresets();
    updateStats();
}

function localizeUI() {
    const tr = {
        ar: {
            title: "مكوّن الجمل العشوائي القواعدي 🎲", game: "اللعب والادخال", io: "الرفع وإدارة الملفات النموذجية",
            girls: "👧 أسماء بنات", verbs: "⚡ أفعال (جذر مذكر)", body: "💪 أعضاء جسم", boys: "👦 أسماء شباب",
            mixCurr: "توزيع عشوائي للمخرجات 🔀", mixAll: "إعادة التوزيع الشامل للمخزن 🔄", clear: "إعادة تعيين ومسح كافة المدخلات والمخزن 🗑️"
        },
        en: {
            title: "Grammar Sentence Generator 🎲", game: "Play & Input", io: "Upload & Templates Management",
            girls: "👧 Girl Names", verbs: "⚡ Verbs (Base Form)", body: "💪 Body Parts", boys: "👦 Boy Names",
            mixCurr: "Randomize Output 🔀", mixAll: "Re-Randomize Storage 🔄", clear: "Reset & Clear All Storage 🗑️"
        }
    }[currentLang];

    document.getElementById('main-title').innerText = tr.title;
    document.getElementById('lbl-girls').innerText = tr.girls;
    document.getElementById('lbl-verbs').innerText = tr.verbs;
    document.getElementById('lbl-body').innerText = tr.body;
    document.getElementById('lbl-boys').innerText = tr.boys;
    document.getElementById('btn-mix-curr').innerText = tr.mixCurr;
    document.getElementById('btn-mix-all').innerText = tr.mixAll;
    document.getElementById('btn-clear').innerText = tr.clear;
    document.getElementById('version-badge').innerText = `إصدار ${CURRENT_VERSION}`;
    updateScore(0);
}

function populatePresets() {
    const p = presets[currentLang];
    globalStorage.girls = [...new Set([...globalStorage.girls, ...p.girls])];
    globalStorage.verbs = [...new Set([...globalStorage.verbs, ...p.verbs])];
    globalStorage.bodyParts = [...new Set([...globalStorage.bodyParts, ...p.bodyParts])];
    globalStorage.boys = [...new Set([...globalStorage.boys, ...p.boys])];
    updateDropdownsOnly();
}

function updateDropdownsOnly() {
    setupSelect('girl-sel', globalStorage.girls, '-- القائمة المنسدلة للبنات --');
    setupSelect('verb-sel', globalStorage.verbs, '-- القائمة المنسدلة للأفعال --');
    setupSelect('body-sel', globalStorage.bodyParts, '-- القائمة المنسدلة للأعضاء --');
    setupSelect('boy-sel', globalStorage.boys, '-- القائمة المنسدلة للشباب --');
}

function setupSelect(id, arr, defaultText) {
    const sel = document.getElementById(id);
    sel.innerHTML = `<option value="">${defaultText}</option>`;
    arr.forEach(item => {
        let opt = document.createElement('option');
        opt.value = item; opt.innerText = item;
        sel.appendChild(opt);
    });
}

function addSingleManual(inputId, storageKey) {
    const inputElem = document.getElementById(inputId);
    const value = inputElem.value.trim();
    if(!value) return alert("يرجى كتابة الكلمة في الحقل أولاً!");

    if(globalStorage[storageKey].includes(value)) {
        alert("هذه الكلمة موجودة مسبقاً (تجنب التكرار)!");
        return;
    }

    globalStorage[storageKey].push(value);
    updateDropdownsOnly();
    updateStats();
    inputElem.value = "";
    playSoundEffect('success');
    updateScore(10);
}

function applySelectValue(selectElem, inputId) {
    if(!selectElem.value) return;
    document.getElementById(inputId).value = selectElem.value;
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    document.getElementById(`content-${tab}`).classList.add('active');
}

function shuffle(array) {
    return array.map(value => ({ value, sort: Math.random() })).sort((a, b) => a.sort - b.sort).map(({ value }) => value);
}

function applyGrammarRules(girl, baseVerb) {
    if (currentLang === 'ar') {
        if (baseVerb.startsWith('ي')) return 'ت' + baseVerb.substring(1);
        if (!baseVerb.startsWith('ت')) return 'ت' + baseVerb; 
        return baseVerb;
    } else {
        if (baseVerb.endsWith('sh') || baseVerb.endsWith('ch') || baseVerb.endsWith('s')) return baseVerb + 'es';
        return baseVerb + 's';
    }
}

function updateStats() {
    document.getElementById('stats').innerText = `المخزون الحالي دون تكرار (${CURRENT_VERSION}): ${globalStorage.girls.length} بنات | ${globalStorage.verbs.length} أفعال | ${globalStorage.bodyParts.length} أعضاء جسم | ${globalStorage.boys.length} شباب`;
}

function mixCurrentRound() {
    let sg = shuffle([...globalStorage.girls]), sv = shuffle([...globalStorage.verbs]), sb = shuffle([...globalStorage.bodyParts]), sy = shuffle([...globalStorage.boys]);
    let count = Math.min(sg.length, sv.length, sb.length, sy.length);
    if(count === 0) return alert("المخزن فارغ!");
    buildSentences(sg, sv, sb, sy, count);
    playSoundEffect('success');
    updateScore(50);
}

function mixAllStorage() {
    mixCurrentRound();
}

function buildSentences(g, v, b, y, count) {
    const list = document.getElementById('results-list');
    list.innerHTML = "";
    generatedSentences = [];
    document.getElementById('result-title').innerText = `الجمل الناتجة القواعدية الفريدة - ${CURRENT_VERSION} ✨`;

    for(let i=0; i<count; i++) {
        let girl = g[i], rawVerb = v[i], body = b[i], boy = y[i];
        let verb = applyGrammarRules(girl, rawVerb);
        let sentence = currentLang === 'ar' ? `${girl} ${verb} ${body} ${boy}.` : `${girl} ${verb} ${boy}'s ${body}.`;
        
        generatedSentences.push(sentence);
        let div = document.createElement('div');
        div.className = 'sentence-card';
        div.innerText = sentence;
        list.appendChild(div);
    }
}

function clearAllData() {
    if(confirm("هل أنت متأكد من مسح جميع المدخلات والقوائم كلياً؟")) {
        globalStorage = { girls: [], verbs: [], bodyParts: [], boys: [] };
        generatedSentences = [];
        userScore = 0;
        document.querySelectorAll('input').forEach(i => i.value = "");
        document.getElementById('results-list').innerHTML = "";
        updateDropdownsOnly();
        updateStats();
        playSoundEffect('clear');
    }
}

function downloadSampleExcel(type) {
    let headers = { girls: ["أسماء البنات (Girls)"], verbs: ["الأفعال الجذعية (Verbs)"], bodyParts: ["أعضاء الجسم (Body Parts)"], boys: ["أسماء الشباب (Boys)"] }[type];
