// 勤怠管理アプリ - メインスクリプト

/**
 * localStorageのキー名
 */
const STORAGE_KEY = 'attendance-records';

/**
 * DOM要素の参照
 */
let elements = {};

/**
 * localStorageから記録を読み込む
 * @returns {Array} 打刻記録の配列
 */
function loadRecords() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * localStorageに記録を保存する
 * @param {Array} records - 打刻記録の配列
 */
function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

/**
 * 現在時刻を "HH:MM:SS" 形式でフォーマットする
 * @param {Date} date - 日付オブジェクト
 * @returns {string} フォーマット済みの時刻文字列
 */
function formatTime(date) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/**
 * 現在時刻の表示を更新する（1秒ごとに呼び出し）
 */
function updateCurrentTime() {
  elements.currentTime.textContent = formatTime(new Date());
}

/**
 * 打刻記録を追加する
 * @param {string} type - "clock-in" または "clock-out"
 */
function addRecord(type) {
  const records = loadRecords();

  // 連続した同じ種類の打刻を防止
  if (records.length > 0) {
    const lastRecord = records[records.length - 1];
    if (lastRecord.type === type) {
      const label = type === 'clock-in' ? '出勤' : '退勤';
      alert(`既に${label}済みです。`);
      return;
    }
  }

  // 最初の打刻が退勤の場合を防止
  if (records.length === 0 && type === 'clock-out') {
    alert('先に出勤を記録してください。');
    return;
  }

  const record = {
    type: type,
    time: new Date().toISOString()
  };

  records.push(record);
  saveRecords(records);
  renderRecords();
  updateStatus();
  updateTotalHours();
}

/**
 * 記録一覧を画面に描画する
 */
function renderRecords() {
  const records = loadRecords();
  const list = elements.recordList;
  list.innerHTML = '';

  records.forEach(function (record) {
    const item = document.createElement('div');
    item.classList.add('record-item');

    if (record.type === 'clock-in') {
      item.classList.add('record-clock-in');
      item.textContent = '🟢 出勤  ' + formatTime(new Date(record.time));
    } else {
      item.classList.add('record-clock-out');
      item.textContent = '🔴 退勤  ' + formatTime(new Date(record.time));
    }

    list.appendChild(item);
  });
}

/**
 * ステータスメッセージを更新する
 */
function updateStatus() {
  const records = loadRecords();
  const statusEl = elements.statusMessage;

  // 既存のステータスクラスを除去
  statusEl.classList.remove('status-working', 'status-off');

  if (records.length === 0) {
    statusEl.textContent = '未出勤';
    statusEl.classList.add('status-off');
    return;
  }

  const lastRecord = records[records.length - 1];

  if (lastRecord.type === 'clock-in') {
    statusEl.textContent = '勤務中';
    statusEl.classList.add('status-working');
  } else {
    statusEl.textContent = '退勤済み';
    statusEl.classList.add('status-off');
  }
}

/**
 * 合計勤務時間を計算して表示する
 */
function updateTotalHours() {
  const records = loadRecords();
  let totalMs = 0;

  for (let i = 0; i < records.length; i += 2) {
    const clockIn = new Date(records[i].time);

    if (i + 1 < records.length) {
      // 出勤・退勤のペアがある場合
      const clockOut = new Date(records[i + 1].time);
      totalMs += clockOut - clockIn;
    } else {
      // 勤務中（まだ退勤していない場合）は現在時刻までを計算
      totalMs += new Date() - clockIn;
    }
  }

  const totalSeconds = Math.floor(totalMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  elements.totalHours.textContent = `${hours}時間 ${minutes}分 ${seconds}秒`;
}

/**
 * 全記録をクリアする
 */
function clearRecords() {
  if (!confirm('記録をすべてクリアしますか？')) {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
  renderRecords();
  updateStatus();
  updateTotalHours();
}

/**
 * アプリの初期化
 */
function init() {
  // DOM要素を取得
  elements = {
    currentTime: document.getElementById('current-time'),
    btnClockIn: document.getElementById('btn-clock-in'),
    btnClockOut: document.getElementById('btn-clock-out'),
    btnClear: document.getElementById('btn-clear'),
    recordList: document.getElementById('record-list'),
    totalHours: document.getElementById('total-hours'),
    statusMessage: document.getElementById('status-message')
  };

  // イベントリスナーの登録
  elements.btnClockIn.addEventListener('click', function () {
    addRecord('clock-in');
  });

  elements.btnClockOut.addEventListener('click', function () {
    addRecord('clock-out');
  });

  elements.btnClear.addEventListener('click', clearRecords);

  // 現在時刻の表示を開始（1秒ごとに更新）
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);

  // 勤務中の場合は合計時間も1秒ごとに更新
  setInterval(updateTotalHours, 1000);

  // 保存済みの記録を復元・表示
  renderRecords();
  updateStatus();
  updateTotalHours();
}

// DOMの読み込み完了後に初期化
document.addEventListener('DOMContentLoaded', init);
