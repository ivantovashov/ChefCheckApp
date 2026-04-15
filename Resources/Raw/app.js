// Данные чек-листа
const checklistData = [
    { id: 1, section: "📌 ОБЩЕЕ СОСТОЯНИЕ", text: "Станция чистая (холодильники, полки, ножки холодильников, стены)" },
    { id: 2, section: "📌 ОБЩЕЕ СОСТОЯНИЕ", text: "Отсутствие повреждений рабочего оборудования" },
    { id: 3, section: "📌 ОБЩЕЕ СОСТОЯНИЕ", text: "Инвентарь промаркирован по цветовой/буквенной кодировке" },
    { id: 4, section: "📌 ОБЩЕЕ СОСТОЯНИЕ", text: "Наличие термометра и ведение температурного журнала" },
    { id: 5, section: "📌 ОБЩЕЕ СОСТОЯНИЕ", text: "В холодильниках отсутствует наледь" },
    { id: 6, section: "📌 ОБЩЕЕ СОСТОЯНИЕ", text: "Мусорка чистая, промаркирована по цеху" },
    { id: 7, section: "🧑‍🍳 ГИГИЕНА", text: "Униформа чистая, волосы убраны, нет украшений, ногти подстрижены" },
    { id: 8, section: "🧑‍🍳 ГИГИЕНА", text: "Используются перчатки при работе с готовым продуктом" },
    { id: 9, section: "📦 ХРАНЕНИЕ", text: "Отсутствие посторонних вещей на рабочем месте" },
    { id: 10, section: "📦 ХРАНЕНИЕ", text: "Отсутствует продукция с истекшим сроком годности" },
    { id: 11, section: "📦 ХРАНЕНИЕ", text: "Нет незакрытых продуктов/полуфабрикатов в холодильниках" },
    { id: 12, section: "📦 ХРАНЕНИЕ", text: "Маркировка в формате (дата/время начала и конца срока)" },
    { id: 13, section: "📦 ХРАНЕНИЕ", text: "Отсутствие двойных маркировок" },
    { id: 14, section: "📦 ХРАНЕНИЕ", text: "Сохранена заводская этикетка" },
    { id: 15, section: "📦 ХРАНЕНИЕ", text: "Продукция не хранится на полу" },
    { id: 16, section: "📦 ХРАНЕНИЕ", text: "Сырьё не хранится в транспортной таре" },
    { id: 17, section: "📦 ХРАНЕНИЕ", text: "Соблюдение товарного соседства" },
    { id: 18, section: "📦 ХРАНЕНИЕ", text: "П/ф в закрытых контейнерах, гастроёмкости чистые" },
    { id: 19, section: "📦 ХРАНЕНИЕ", text: "В гастроёмкостях нет ложек" },
    { id: 20, section: "📦 ХРАНЕНИЕ", text: "На вскрытых упаковках — даты вскрытия и годности" },
    { id: 21, section: "📦 ХРАНЕНИЕ", text: "Разные категории продуктов не в одном контейнере" },
    { id: 22, section: "🔍 КАЧЕСТВО", text: "Нет признаков порчи (плесень, гниль)" },
    { id: 23, section: "🔍 КАЧЕСТВО", text: "Отсутствие инородных тел в продуктах" },
    { id: 24, section: "🥄 ИНВЕНТАРЬ", text: "Чистый инвентарь в промаркированном гастрике" }
];

// Глобальные переменные
let checks = {};
let notes = {};
let currentFilter = 'all';

// Функции для работы с мостом
function saveToNative(id, status, note) {
    if (window.saveToDatabase) {
        window.saveToDatabase(id, status, note);
    }
}

function loadFromNative() {
    if (window.loadFromDatabase) {
        window.loadFromDatabase();
    }
}

function saveReportToNative(inspector, total, passed, failed, percent, details) {
    if (window.saveReportToDatabase) {
        window.saveReportToDatabase(inspector, total, passed, failed, percent, details);
    }
}

function exportToNative(html) {
    if (window.exportToPdf) {
        window.exportToPdf(html);
    }
}

function loadHistoryFromNative() {
    if (window.loadHistoryFromDatabase) {
        window.loadHistoryFromDatabase();
    }
}

function showNativeMessage(msg) {
    if (window.showMessage) {
        window.showMessage(msg);
    } else {
        alert(msg);
    }
}

// Функции UI
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

async function saveNote(id, value) {
    if (value && value.trim() !== '') {
        notes[id] = value.trim();
    } else {
        delete notes[id];
    }
    saveToNative(id, checks[id] || null, notes[id] || null);
    localStorage.setItem('notes', JSON.stringify(notes));
}

async function toggleStatus(id) {
    if (checks[id] === null || checks[id] === undefined) {
        checks[id] = '+';
    } else if (checks[id] === '+') {
        checks[id] = '-';
    } else if (checks[id] === '-') {
        checks[id] = null;
    }

    saveToNative(id, checks[id], notes[id] || null);
    localStorage.setItem('checks', JSON.stringify(checks));
    render();
    updateStats();

    const statusText = checks[id] === '+' ? '✅ Выполнено' : (checks[id] === '-' ? '❌ Нарушение' : '⚪ Не проверено');
    showToast(statusText);
    analyzeWeakSpots();
}

function updateStats() {
    const total = checklistData.length;
    const plus = Object.values(checks).filter(v => v === '+').length;
    const minus = Object.values(checks).filter(v => v === '-').length;
    const percent = total > 0 ? Math.round((plus / total) * 100) : 0;

    const totalEl = document.getElementById('totalCount');
    const plusEl = document.getElementById('plusCount');
    const minusEl = document.getElementById('minusCount');
    const percentEl = document.getElementById('percentCount');
    const progressFill = document.getElementById('progressFill');

    if (totalEl) totalEl.innerText = total;
    if (plusEl) plusEl.innerText = plus;
    if (minusEl) minusEl.innerText = minus;
    if (percentEl) percentEl.innerText = percent + '%';
    if (progressFill) progressFill.style.width = percent + '%';
}

function analyzeWeakSpots() {
    const sections = {};
    checklistData.forEach(item => {
        if (checks[item.id] === '-') {
            sections[item.section] = (sections[item.section] || 0) + 1;
        }
    });

    for (const [section, count] of Object.entries(sections)) {
        if (count > 3) {
            showToast(`⚠️ В секции "${section}" ${count} нарушений`);
        }
    }
}

function filterByStatus(status) {
    currentFilter = status;
    render();

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`.filter-btn[data-filter="${status}"]`);
    if (activeBtn) activeBtn.classList.add('active');
}

function render() {
    const container = document.getElementById('checklistContainer');
    if (!container) return;

    let currentSection = '';
    let html = '';

    checklistData.forEach((item) => {
        const status = checks[item.id];

        if (currentFilter !== 'all') {
            if (currentFilter === 'plus' && status !== '+') return;
            if (currentFilter === 'minus' && status !== '-') return;
            if (currentFilter === 'null' && status !== null && status !== undefined) return;
        }

        if (item.section !== currentSection) {
            if (currentSection !== '') html += `</div>`;
            currentSection = item.section;

            const sectionItems = checklistData.filter(i => i.section === currentSection);
            const sectionMinus = sectionItems.filter(i => checks[i.id] === '-').length;

            html += `<div class="section">
                        <div class="section-title">
                            ${currentSection}
                            ${sectionMinus > 0 ? `<span class="section-badge">⚠️ ${sectionMinus}</span>` : ''}
                        </div>`;
        }

        const note = notes[item.id] || '';
        let buttonSymbol = '○';
        let buttonClass = '';
        if (status === '+') {
            buttonSymbol = '✓';
            buttonClass = 'plus';
        } else if (status === '-') {
            buttonSymbol = '✗';
            buttonClass = 'minus';
        }

        html += `
            <div class="check-item" data-id="${item.id}">
                <div class="check-text">
                    ${escapeHtml(item.text)}
                    <input type="text" class="note-input ${note ? 'show' : ''}" id="note_${item.id}" 
                           placeholder="Примечание..." value="${escapeHtml(note)}" 
                           onchange="saveNote(${item.id}, this.value)">
                </div>
                <button class="status-btn ${buttonClass}" onclick="toggleStatus(${item.id})">
                    ${buttonSymbol}
                </button>
            </div>
        `;
    });

    if (currentSection !== '') html += `</div>`;
    container.innerHTML = html;
}

function resetToday() {
    if (confirm('Сбросить все отметки за сегодня?')) {
        checklistData.forEach(item => {
            checks[item.id] = null;
            delete notes[item.id];
            saveToNative(item.id, null, null);
        });

        localStorage.setItem('checks', JSON.stringify(checks));
        localStorage.setItem('notes', JSON.stringify(notes));
        render();
        updateStats();
        showToast('✅ Чек-лист сброшен');
    }
}

function saveReport() {
    const userName = localStorage.getItem('userName') || 'Аноним';
    const results = [];
    let total = 0, plus = 0, minus = 0;

    checklistData.forEach(item => {
        const status = checks[item.id];
        const note = notes[item.id] || '';
        total++;
        if (status === '+') plus++;
        if (status === '-') minus++;
        results.push({ text: item.text, status: status || '—', note });
    });

    const percent = total > 0 ? Math.round((plus / total) * 100) : 0;
    const details = JSON.stringify(results);

    saveReportToNative(userName, total, plus, minus, percent, details);
    showToast(`✅ Отчёт сохраняется... (${plus}/${total} выполнено)`);
}

function exportToPDF() {
    showToast('📄 Подготовка PDF...');

    const userName = localStorage.getItem('userName') || 'Аноним';
    const plus = Object.values(checks).filter(v => v === '+').length;
    const minus = Object.values(checks).filter(v => v === '-').length;
    const percent = checklistData.length > 0 ? Math.round((plus / checklistData.length) * 100) : 0;

    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>ChefCheck Отчёт</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #2c3e50; }
                .stats { display: flex; gap: 20px; margin: 20px 0; flex-wrap: wrap; }
                .stat { background: #f5f5f5; padding: 10px; border-radius: 8px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: top; }
                th { background: #2c3e50; color: white; }
                .passed { color: green; font-weight: bold; }
                .failed { color: red; font-weight: bold; }
                .note { color: #666; font-size: 12px; }
                @media print {
                    body { margin: 0; padding: 10px; }
                }
            </style>
        </head>
        <body>
            <h1>🍽 ChefCheck - Отчёт о проверке кухни</h1>
            <p><strong>Дата:</strong> ${new Date().toLocaleString('ru-RU')}</p>
            <p><strong>Инспектор:</strong> ${escapeHtml(userName)}</p>
            <div class="stats">
                <div class="stat">✅ Выполнено: ${plus}</div>
                <div class="stat">❌ Нарушения: ${minus}</div>
                <div class="stat">📊 Готовность: ${percent}%</div>
                <div class="stat">📋 Всего пунктов: ${checklistData.length}</div>
            </div>
            <table>
                <thead>
                    <tr><th>#</th><th>Пункт</th><th>Статус</th><th>Примечание</th></tr>
                </thead>
                <tbody>
    `;

    checklistData.forEach((item, index) => {
        const status = checks[item.id];
        const note = notes[item.id] || '';
        const statusText = status === '+' ? '✅ Выполнено' : (status === '-' ? '❌ Нарушение' : '⚪ Не проверено');
        const statusClass = status === '+' ? 'passed' : (status === '-' ? 'failed' : '');

        html += `<tr>
                    <td>${index + 1}</td>
                    <td>${escapeHtml(item.text)}</td>
                    <td class="${statusClass}">${statusText}</td>
                    <td class="note">${escapeHtml(note)}</td>
                 </tr>`;
    });

    html += `</tbody>
            </table>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">
                <em>Отчёт сгенерирован автоматически в ChefCheck</em>
            </p>
        </body>
        </html>`;

    exportToNative(html);
}

function showSettings() {
    document.getElementById('userName').value = localStorage.getItem('userName') || '';
    document.getElementById('darkThemeToggle').checked = localStorage.getItem('theme') === 'dark';
    document.getElementById('settingsModal').classList.add('show');
}

function closeSettings() {
    document.getElementById('settingsModal').classList.remove('show');
}

function saveSettings() {
    localStorage.setItem('userName', document.getElementById('userName').value);
    localStorage.setItem('theme', document.getElementById('darkThemeToggle').checked ? 'dark' : 'light');
    closeSettings();
    applyTheme();
    showToast('⚙️ Настройки сохранены');
}

function applyTheme() {
    const isDark = localStorage.getItem('theme') === 'dark';
    if (isDark) {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
}

function showHistory() {
    loadHistoryFromNative();
}

function closeHistory() {
    document.getElementById('historyModal').classList.remove('show');
}

function displayHistory(history) {
    const historyList = document.getElementById('historyList');
    if (!history || history.length === 0) {
        historyList.innerHTML = '<p style="text-align:center;">Нет сохранённых проверок</p>';
    } else {
        historyList.innerHTML = history.map((report, index) => `
            <div class="history-item" onclick="viewReportDetails(${index})">
                <strong>${report.date || report.Date}</strong><br>
                👤 ${escapeHtml(report.inspector || report.Inspector)} | 
                ✅ ${report.passed || report.Passed}/${report.totalItems || report.TotalItems} (${report.percent || report.Percent}%)
            </div>
        `).join('');
    }
    document.getElementById('historyModal').classList.add('show');
}

function viewReportDetails(index) {
    const history = window.currentHistory || [];
    const report = history[index];
    let details = `📋 Детали проверки от ${report.date || report.Date}\n\n`;

    try {
        const results = JSON.parse(report.detailsJson || report.DetailsJson || '[]');
        const violations = results.filter(r => r.status === '-');

        if (violations.length === 0) {
            details += '🎉 Все пункты выполнены! Отлично!\n';
        } else {
            details += `⚠️ Нарушения (${violations.length}):\n\n`;
            violations.forEach((item, i) => {
                details += `${i + 1}. ${item.text}\n`;
                if (item.note) details += `   📝 ${item.note}\n`;
                details += '\n';
            });
        }
    } catch (e) {
        details += 'Ошибка загрузки деталей';
    }

    alert(details);
}

function setupHotkeys() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveReport();
        }
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            resetToday();
        }
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            exportToPDF();
        }
    });
}

function setupEventListeners() {
    document.getElementById('settingsBtn')?.addEventListener('click', showSettings);
    document.getElementById('historyBtn')?.addEventListener('click', showHistory);
    document.getElementById('saveReportBtn')?.addEventListener('click', saveReport);
    document.getElementById('pdfBtn')?.addEventListener('click', exportToPDF);
    document.getElementById('resetBtn')?.addEventListener('click', resetToday);
    document.getElementById('saveSettingsBtn')?.addEventListener('click', saveSettings);
    document.getElementById('closeSettingsBtn')?.addEventListener('click', closeSettings);
    document.getElementById('closeHistoryBtn')?.addEventListener('click', closeHistory);
    document.getElementById('darkThemeToggle')?.addEventListener('change', applyTheme);

    document.querySelectorAll('.stat-item').forEach(item => {
        item.addEventListener('click', () => {
            const filter = item.getAttribute('data-filter');
            if (filter) filterByStatus(filter);
        });
    });
}

// Callback функции для моста
window.onDataLoaded = function (data) {
    checks = {};
    notes = {};
    for (const [id, item] of Object.entries(data)) {
        checks[id] = item.Status || item.status;
        if (item.Note || item.note) notes[id] = item.Note || item.note;
    }
    render();
    updateStats();
    analyzeWeakSpots();
};

window.onHistoryLoaded = function (data) {
    window.currentHistory = data;
    displayHistory(data);
};

// Инициализация
function init() {
    // Загружаем из localStorage как резервную копию
    const savedChecks = localStorage.getItem('checks');
    if (savedChecks) {
        const tempChecks = JSON.parse(savedChecks);
        if (Object.keys(checks).length === 0) checks = tempChecks;
    }

    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
        const tempNotes = JSON.parse(savedNotes);
        if (Object.keys(notes).length === 0) notes = tempNotes;
    }

    setupEventListeners();
    setupHotkeys();
    applyTheme();

    // Загружаем данные из нативной БД
    loadFromNative();
}

// Запуск
init();