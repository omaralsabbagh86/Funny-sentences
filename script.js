let currentLang = 'ar';
let globalStorage = { girls: [], verbs: [], bodyParts: [], boys: [] };
let generatedSentences = [];

const presets = {
    ar: {
        girls: ["هناء", "فاطمة", "سارة", "ريم", "ليلى", "نور"],
        verbs: ["غسل", "أكل", "رأى", "أمسك", "حرك", "نظف"],
        bodyParts: ["يد", "وجه", "قدم", "عين", "رأس", "أنف"],
        boys: ["محمد", "أحمد", "علي", "خالد", "يوسف", "عمر"]
    },
    en: {
        girls: ["Emma", "Olivia", "Sophia", "Ava", "Mia"],
        verbs: ["wash", "eat", "see", "touch", "move"],
        bodyParts: ["hand", "face", "foot", "eye", "head"],
        boys: ["John", "Alex", "James", "Ryan", "Leo"]
    }
};

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
            title: "مكوّن الجمل العشوائي القواعدي 🎲", game: "اللعب والادخال", io: "الرفع والتنزيل",
            girls: "👧 5 أسماء بنات", verbs: "⚡ 5 أفعال (جذر مذكر)", body: "💪 5 أعضاء جسم", boys: "👦 5 أسماء شباب",
            mixCurr: "توزيع عشوائي (هذه الجولة) 🔀", mixAll: "إعادة التوزيع للكل 🔄", clear: "مسح كافة النتائج والمدخلات 🗑️",
            upTitle: "رفع كلمات مسبقة المضمون (.xlsx, .txt)", downTitle: "تنزيل المستندات النهائية المتولدة",
            resDefault: "الجمل المتولدة ستظهر هنا..."
        },
        en: {
            title: "Grammar Sentence Generator 🎲", game: "Play & Input", io: "Upload & Download Docs",
            girls: "👧 5 Girl Names", verbs: "⚡ 5 Verbs (Base/Male)", body: "💪 5 Body Parts", boys: "👦 5 Boy Names",
            mixCurr: "Randomize (This Round) 🔀", mixAll: "Re-Randomize All 🔄", clear: "Clear Everything 🗑️",
            upTitle: "Upload preset words (.xlsx, .txt)", downTitle: "Download Generated Output Documents",
            resDefault: "Generated sentences will appear here..."
        }
    }[currentLang];

    document.getElementById('main-title').innerText = tr.title;
    document.getElementById('tab-game').innerText = tr.game;
    document.getElementById('tab-io').innerText = tr.io;
    document.getElementById('lbl-girls').innerText = tr.girls;
    document.getElementById('lbl-verbs').innerText = tr.verbs;
    document.getElementById('lbl-body').innerText = tr.body;
    document.getElementById('lbl-boys').innerText = tr.boys;
    document.getElementById('btn-mix-curr').innerText = tr.mixCurr;
    document.getElementById('btn-mix-all').innerText = tr.mixAll;
    document.getElementById('btn-clear').innerText = tr.clear;
    document.getElementById('lbl-upload-title').innerText = tr.upTitle;
    document.getElementById('lbl-download-title').innerText = tr.downTitle;
    if(generatedSentences.length === 0) {
        document.getElementById('result-title').innerText = tr.resDefault;
    }
}

function populatePresets() {
    const p = presets[currentLang];
    setupSelect('girl-sel', p.girls, currentLang === 'ar' ? '-- قوائم منسدلة للبنات --' : '-- Girls Dropdown --');
    setupSelect('verb-sel', p.verbs, currentLang === 'ar' ? '-- قوائم منسدلة للأفعال --' : '-- Verbs Dropdown --');
    setupSelect('body-sel', p.bodyParts, currentLang === 'ar' ? '-- قوائم منسدلة للأعضاء --' : '-- Body Dropdown --');
    setupSelect('boy-sel', p.boys, currentLang === 'ar' ? '-- قوائم منسدلة للشباب --' : '-- Boys Dropdown --');
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

function applySelectValue(selectElem, inputClass) {
    if(!selectElem.value) return;
    const columnBox = selectElem.closest('.column-box');
    const inputs = columnBox.querySelectorAll(`.${inputClass}`);
    for(let input of inputs) {
        if(input.value.trim() === "") {
            input.value = selectElem.value;
            break;
        }
    }
    selectElem.value = "";
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
        if (baseVerb.startsWith('ي')) {
            return 'ت' + baseVerb.substring(1);
        } else if (!baseVerb.startsWith('ت')) {
            return 'ت' + baseVerb; 
        }
        return baseVerb;
    } else {
        if (baseVerb.endsWith('sh') || baseVerb.endsWith('ch') || baseVerb.endsWith('s') || baseVerb.endsWith('x')) {
            return baseVerb + 'es';
        }
        return baseVerb + 's';
    }
}

function getFormInputs() {
    const fetch = (cls) => Array.from(document.querySelectorAll(`.${cls}`)).map(i => i.value.trim()).filter(v => v !== "");
    return { girls: fetch('girl-in'), verbs: fetch('verb-in'), bodyParts: fetch('body-in'), boys: fetch('boy-in') };
}

function updateStats() {
    if(currentLang === 'ar') {
        document.getElementById('stats').innerText = `المخزون الحالي: ${globalStorage.girls.length} بنات | ${globalStorage.verbs.length} أفعال | ${globalStorage.bodyParts.length} أعضاء جسم | ${globalStorage.boys.length} شباب`;
    } else {
        document.getElementById('stats').innerText = `Current Storage: ${globalStorage.girls.length} Girls | ${globalStorage.verbs.length} Verbs | ${globalStorage.bodyParts.length} Body | ${globalStorage.boys.length} Boys`;
    }
}

function mixCurrentRound() {
    const inp = getFormInputs();
    if(inp.girls.length === 0 || inp.verbs.length === 0 || inp.bodyParts.length === 0 || inp.boys.length === 0) {
        alert(currentLang === 'ar' ? "الرجاء إدخال الكلمات لتوليد الجمل!" : "Please fill words in the fields!");
        return;
    }

    globalStorage.girls.push(...inp.girls);
    globalStorage.verbs.push(...inp.verbs);
    globalStorage.bodyParts.push(...inp.bodyParts);
    globalStorage.boys.push(...inp.boys);
    updateStats();

    let sg = shuffle([...inp.girls]), sv = shuffle([...inp.verbs]), sb = shuffle([...inp.bodyParts]), sy = shuffle([...inp.boys]);
    let count = Math.min(sg.length, sv.length, sb.length, sy.length);
    
    buildSentences(sg, sv, sb, sy, count);
    document.querySelectorAll('input').forEach(i => i.value = "");
}

function mixAllStorage() {
    if(globalStorage.girls.length === 0) return;
    let sg = shuffle([...globalStorage.girls]), sv = shuffle([...globalStorage.verbs]), sb = shuffle([...globalStorage.bodyParts]), sy = shuffle([...globalStorage.boys]);
    let count = Math.min(sg.length, sv.length, sb.length, sy.length);
    buildSentences(sg, sv, sb, sy, count);
}

function buildSentences(g, v, b, y, count) {
    const list = document.getElementById('results-list');
    list.innerHTML = "";
    generatedSentences = [];
    document.getElementById('result-title').innerText = currentLang === 'ar' ? "الجمل الناتجة القواعدية ✨" : "Generated Grammatical Sentences ✨";

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

function clearAll() {
    globalStorage = { girls: [], verbs: [], bodyParts: [], boys: [] };
    generatedSentences = [];
    document.querySelectorAll('input').forEach(i => i.value = "");
    document.getElementById('results-list').innerHTML = "";
    updateStats();
}

function handleUniversalUpload(event) {
    const file = event.target.files[0];
    const target = document.getElementById('upload-target').value;
    if (!file) return;

    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            const words = json.flat().map(w => String(w).trim()).filter(w => w && w !== "undefined" && w !== "");
            injectWords(target, words);
        };
        reader.readAsArrayBuffer(file);
    } else if (fileExtension === 'txt') {
        const reader = new FileReader();
        reader.onload = function(e) {
            const lines = e.target.result.split('\n').map(l => l.trim()).filter(l => l !== "");
            injectWords(target, lines);
        };
        reader.readAsText(file);
    }
}

function injectWords(target, wordsArr) {
    globalStorage[target].push(...wordsArr);
    updateStats();
    alert(currentLang === 'ar' ? "تمت إضافة الكلمات للمخزن!" : "Words added!");
    document.getElementById('file-uploader').value = "";
}

function downloadTXT() {
    if(generatedSentences.length === 0) return;
    let blob = new Blob([generatedSentences.join('\n')], {type: 'text/plain;charset=utf-8'});
    saveAs(blob, 'sentences.txt');
}

function downloadExcel() {
    if(generatedSentences.length === 0) return;
    let ws = XLSX.utils.aoa_to_sheet([["No.", "Sentence"], ...generatedSentences.map((s, i) => [i+1, s])]);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sentences");
    XLSX.writeFile(wb, 'sentences.xlsx');
}

function downloadWord() {
    if(generatedSentences.length === 0) return;
    const doc = new docx.Document({
        sections: [{
            children: [
                new docx.Paragraph({
                    children: [new docx.TextRun({ text: "Generated Sentences", bold: true, size: 32 })],
                    spacing: { after: 200 }
                }),
                ...generatedSentences.map((s, i) => new docx.Paragraph({
                    children: [new docx.TextRun({ text: `${i+1}. ${s}`, size: 24 })],
                    spacing: { after: 120 }
                }))
            ]
        }]
    });
    docx.Packer.toBlob(doc).then(blob => saveAs(blob, "sentences.docx"));
}

window.onload = () => { setLanguage('ar'); };