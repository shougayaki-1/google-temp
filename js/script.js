/* js/script.js - v2.1 */

const STORAGE_KEY_PREFIX = 'study_app_v2_';
let timerInterval;
let seconds = 0;
let isTimerRunning = false;

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    restoreProgress();
    setupGlobalEvents();
});

function setupGlobalEvents() {
    // 虫食いクリック
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('cloze')) {
            e.target.classList.add('revealed');
        }
    });

    // キーボードショートカット
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            const activeTab = document.querySelector('.tab-content.active');
            if (activeTab) {
                activeTab.querySelectorAll('.cloze').forEach(el => el.classList.add('revealed'));
                activeTab.querySelectorAll('.answer-content').forEach(el => el.classList.add('visible'));
                activeTab.querySelectorAll('.btn-toggle-answer').forEach(btn => {
                    if (!btn.onclick.toString().includes('markAsMastered')) {
                        btn.textContent = '解答を隠す ▲';
                    }
                });
            }
        }
        if (e.key === 'r' || e.key === 'R') {
            toggleRedSheet();
        }
    });
}

/* --- 機能: 虫食いリセット (New!) --- */
function resetCloze() {
    // 現在アクティブなタブ内の虫食いだけをリセット
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab) {
        const revealedItems = activeTab.querySelectorAll('.cloze.revealed');
        revealedItems.forEach(el => {
            el.classList.remove('revealed');
        });

        // ついでに解答エリアも閉じると親切かもしれません（お好みでコメントアウト解除）
        /*
        activeTab.querySelectorAll('.answer-content.visible').forEach(el => el.classList.remove('visible'));
        activeTab.querySelectorAll('.btn-toggle-answer').forEach(btn => {
             if(!btn.onclick.toString().includes('markAsMastered')) {
                btn.textContent = '解答を表示 ▼';
            }
        });
        */

        // リセットしたことを視覚的に通知（オプション）
        // alert('穴埋めをリセットしました'); 
    }
}

/* --- 機能: タブ切り替え --- */
function switchTab(tabId) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    document.getElementById('btn-' + tabId).classList.add('active');
    document.getElementById('content-' + tabId).classList.add('active');
    window.scrollTo(0, 0);
}

/* --- 機能: 解答エリアの開閉 --- */
function toggleAnswer(btn) {
    const content = btn.nextElementSibling;
    content.classList.toggle('visible');

    if (content.classList.contains('visible')) {
        btn.textContent = '解答を隠す ▲';
    } else {
        btn.textContent = '解答を表示 ▼';
    }
}

/* --- 機能: 「覚えた」進捗管理 --- */
function markAsMastered(btn) {
    const card = btn.closest('.card');
    if (!card) return;

    const pageId = window.location.pathname;
    const cards = Array.from(document.querySelectorAll('.card'));
    const index = cards.indexOf(card);
    const uniqueId = `${pageId}_idx_${index}`;

    if (card.classList.contains('mastered')) {
        // 解除
        card.classList.remove('mastered');
        localStorage.removeItem(STORAGE_KEY_PREFIX + uniqueId);
        btn.textContent = '覚えた！';
        // ★修正点: opacity操作を削除
    } else {
        // 登録
        card.classList.add('mastered');
        localStorage.setItem(STORAGE_KEY_PREFIX + uniqueId, 'true');
        btn.textContent = '復習へ戻す';
        // ★修正点: opacity操作を削除
    }
}

function restoreProgress() {
    const pageId = window.location.pathname;
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        const uniqueId = `${pageId}_idx_${index}`;
        if (localStorage.getItem(STORAGE_KEY_PREFIX + uniqueId) === 'true') {
            card.classList.add('mastered');
            const btn = card.querySelector('button[onclick="markAsMastered(this)"]');
            if (btn) {
                btn.textContent = '復習へ戻す';
            }
        }
    });
}

/* --- 機能: ダークモード & 赤シート --- */
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem(STORAGE_KEY_PREFIX + 'darkmode', isDark);
}

function loadSettings() {
    if (localStorage.getItem(STORAGE_KEY_PREFIX + 'darkmode') === 'true') {
        document.body.classList.add('dark-mode');
    }
}

function toggleRedSheet() {
    document.body.classList.toggle('red-sheet-active');
    if (document.body.classList.contains('red-sheet-active')) {
        document.querySelectorAll('.cloze').forEach(el => el.classList.add('revealed'));
    }
}

/* --- 機能: ストップウォッチ --- */
function toggleTimer() {
    const display = document.getElementById('timer-display');
    if (isTimerRunning) {
        clearInterval(timerInterval);
        isTimerRunning = false;
        display.style.opacity = '0.5';
    } else {
        isTimerRunning = true;
        display.style.opacity = '1';
        timerInterval = setInterval(() => {
            seconds++;
            const m = Math.floor(seconds / 60).toString().padStart(2, '0');
            const s = (seconds % 60).toString().padStart(2, '0');
            display.textContent = `${m}:${s}`;
        }, 1000);
    }
}

/* --- 以下、index.html (ポータル) 用のスクリプト --- */

// ダッシュボードの統計読み込み
function loadDashboardStats() {
    const totalCountElement = document.getElementById('total-mastered');
    if (!totalCountElement) return; // ポータル画面でなければ終了

    let count = 0;
    // LocalStorageの全キーを走査
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // このアプリの保存データ かつ "true" (覚えた) のものをカウント
        if (key.startsWith(STORAGE_KEY_PREFIX) && localStorage.getItem(key) === 'true') {
            // 設定データ（darkmodeなど）は除外する
            if (!key.includes('darkmode')) {
                count++;
            }
        }
    }

    // カウントアップアニメーション
    animateValue(totalCountElement, 0, count, 1000);
}

// 数字をパラパラとカウントアップさせる演出
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
});