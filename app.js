/* ============================================================
 * 安心护航 · 交互逻辑
 * ============================================================ */

let state = {
  scenario: null,     // 当前场景对象
  selected: new Set(),// 选中的情况 id
  result: null        // 生成结果 { level, scoreSources, ... }
};

const $ = id => document.getElementById(id);

/* ---------- 初始化 ---------- */
function init() {
  // 场景卡片
  $('sceneGrid').innerHTML = SCENARIOS.map(s => `
    <div class="scene-card" onclick="openScenario('${s.id}')">
      <div class="scene-ico" style="background:linear-gradient(135deg,${s.grad[0]},${s.grad[1]})">${s.icon}</div>
      <div class="scene-txt"><h3>${s.name}</h3><p>${s.desc}</p></div>
      <span class="scene-arrow">›</span>
    </div>`).join('');
  $('homeFoot').innerHTML = `
    <button class="about-entry" onclick="showPage('about')">ℹ️ 关于本工具 · PFA 说明 · 版本与联系<span class="ae-arrow">›</span></button>
    <div class="foot-author">制作者：${APP_META.author.name} · 获取最新版本 / 反馈建议：<a href="tel:${APP_META.author.phone}">${APP_META.author.phone}</a>（微信同号）</div>
    <div class="foot-ver">${APP_META.version} · 更新于 ${APP_META.date}</div>
    <div style="margin-top:10px">${DISCLAIMER}</div>`;
  $('resultDisclaimer').textContent = DISCLAIMER;
  $('resultMeta').textContent = `安心护航 ${APP_META.version} · 制作者 ${APP_META.author.name} ${APP_META.author.phone}（微信同号） · 更新于 ${APP_META.date}`;
  renderAbout();
  // 填充省份下拉
  const provs = Object.keys(PROVINCES);
  $('provinceSel').innerHTML = '<option value="">— 请选择 —</option>' +
    provs.map(p => `<option value="${p}">${p}</option>`).join('');
  // 恢复上次选择的省份
  try {
    const last = localStorage.getItem('last_province');
    if (last && PROVINCES[last]) { $('provinceSel').value = last; renderLocal(last); }
  } catch (e) {}
  applyTheme();
  applyZoom();
}

/* ---------- 页面切换 ---------- */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  $('page-' + id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/* ---------- 关于本工具 / 版本 / 联系方式 ---------- */
function renderAbout() {
  const m = APP_META;
  $('aboutHero').innerHTML = `
    <span class="ver-badge">ℹ️ 版本与说明</span>
    <h2>安心护航</h2>
    <p>心理危机应急处置辅助系统 · 以 PFA 为底层框架</p>
    <div class="ver-info">
      <div class="ver-chip">当前版本<b>${m.version}</b></div>
      <div class="ver-chip">更新日期<b>${m.date}</b></div>
    </div>`;

  $('aboutContact').innerHTML = `
    <div class="cc-h">📱 联系制作者 ${m.author.name} · 获取最新版本</div>
    <div class="cc-sub">工具通过微信传播，若你手上是旧版本，或有问题与建议，欢迎联系制作者 ${m.author.name}。</div>
    <div class="contact-row">
      <div class="cr-ico">📞</div>
      <div class="cr-tx"><div class="lb">电话（点按拨打）</div><div class="val">${m.author.phone}</div></div>
      <button class="cr-btn" onclick="call('${m.author.phone}')">拨打</button>
    </div>
    <div class="contact-row">
      <div class="cr-ico">💬</div>
      <div class="cr-tx"><div class="lb">微信号（点按复制）</div><div class="val">${m.author.wechat}</div></div>
      <button class="cr-btn alt" onclick="copyText('${m.author.wechat}')">复制</button>
    </div>`;

  const P = PFA_MAP;
  const yes = r => `<tr><td class="c1">${r.tool}</td><td class="c2">${r.pfa}</td></tr>`;
  const other = r => {
    const tag = r.kind === 'not'
      ? '<span class="tag-pill tag-not">非 PFA</span>'
      : '<span class="tag-pill tag-beyond">超出</span>';
    return `<tr><td class="c1">${tag}${r.tool}</td><td class="c2">${r.pfa}</td></tr>`;
  };
  $('aboutPfa').innerHTML = `
    <h3>🩺 与心理急救（PFA）的关系</h3>
    <p>${P.intro.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</p>
    <table class="pfa-tbl">
      <thead><tr><th>本工具模块</th><th>对应 PFA 核心行动</th></tr></thead>
      <tbody>${P.pfaRows.map(yes).join('')}</tbody>
    </table>
    <p style="margin-top:13px;font-size:12px;font-weight:800;color:var(--ink)">以下部分超出或不属于 PFA，但面向专业工作者是合理的：</p>
    <table class="pfa-tbl"><tbody>${P.beyondRows.map(other).join('')}</tbody></table>
    <div class="hint" style="margin-top:12px">⚠️ ${P.note}</div>`;

  $('aboutWording').innerHTML = `
    <h3>✍️ 对外怎么表述更准确</h3>
    <div class="wording-good"><b>✓ 推荐：</b>${P.wording.good}</div>
    <div class="wording-bad"><b>✕ 不建议：</b>${P.wording.bad}</div>`;

  $('aboutCopyright').innerHTML = `
    <h3>${COPYRIGHT.title}</h3>
    ${COPYRIGHT.lines.map((l, i) => `<p style="padding-left:18px;position:relative"><span style="position:absolute;left:0;color:var(--teal);font-weight:800">${i + 1}.</span>${l}</p>`).join('')}`;

  const MR = MANDATORY_REPORT;
  $('aboutMandatory').innerHTML = `
    <h3>⚖️ 侵害未成年人案件强制报告制度</h3>
    <p><b>这是一项法定义务，不是可选项。</b>社会工作服务机构、学校/幼儿园、医疗机构、儿童福利与救助机构、居（村）委会等密切接触未成年人的组织及其从业人员，在工作中发现未成年人遭受或疑似遭受侵害、或面临侵害危险的，须立即向公安机关报案或举报。</p>
    <div class="hint" style="margin:10px 0">${MR.legal}。</div>
    <p style="font-weight:800;color:var(--ink);margin-top:12px">须立即报告的九类情形：</p>
    <ol class="mc-list" style="margin-top:6px">${MR.situations.map(x => `<li>${x}</li>`).join('')}</ol>
    <p style="margin-top:12px"><b>报告人受保护：</b>${MR.protect}</p>
    <p><b>不报有责任：</b>${MR.liability}</p>
    <p style="color:var(--muted);font-size:11.5px">${MR.note}</p>`;

  $('aboutChanges').innerHTML = `
    <h3>🕘 版本更新记录</h3>
    ${m.changes.map(c => `<div class="chg-item"><span class="chg-v">${c.v}</span><span class="chg-d">${c.d}</span></div>`).join('')}`;

  $('aboutFoot').innerHTML = `安心护航 ${m.version} · ${m.date}<br>${DISCLAIMER}`;
}

function copyText(text) {
  const ok = () => toast('已复制微信号：' + text);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(ok).catch(() => fallbackCopy(text, ok));
  } else { fallbackCopy(text, ok); }
}
function fallbackCopy(text, ok) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); ok(); } catch (e) { toast('请手动复制：' + text); }
  document.body.removeChild(ta);
}

/* ---------- 打开某场景 ---------- */
function openScenario(id) {
  state.scenario = SCENARIOS.find(s => s.id === id);
  state.selected.clear();
  $('sitTitle').textContent = state.scenario.name;
  const colors = { 1: 'var(--red)', 2: 'var(--orange)', 3: 'var(--amber)' };
  $('chipGroup').innerHTML = state.scenario.chips.map(c => `
    <div class="chip" data-id="${c.id}" onclick="toggleChip('${c.id}')">
      <div class="chip-box"><svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg></div>
      <span class="chip-label">${c.t}</span>
      <span class="lv-dot" style="background:${colors[c.lv] || 'var(--muted)'}" title="风险权重"></span>
    </div>`).join('');
  updateSelCount();
  showPage('situation');
}

function toggleChip(id) {
  if (state.selected.has(id)) state.selected.delete(id);
  else state.selected.add(id);
  const el = document.querySelector(`.chip[data-id="${id}"]`);
  el.classList.toggle('sel', state.selected.has(id));
  updateSelCount();
}

function updateSelCount() {
  const n = state.selected.size;
  $('selCount').textContent = n ? `已选 ${n} 项情况` : '请至少选择 1 项情况';
  $('genBtn').disabled = n === 0;
}

/* ---------- 风险判定 ---------- */
// 1紧急 2高危 3中危 4关注；等级数字越小越严重
function computeLevel() {
  const chips = state.scenario.chips.filter(c => state.selected.has(c.id));
  if (!chips.length) return 4;
  const minLv = Math.min(...chips.map(c => c.lv)); // 取最严重的那一项
  return minLv;
}

/* ---------- 生成方案 ---------- */
function generatePlan() {
  const level = computeLevel();
  const selectedTags = new Set();
  state.scenario.chips.filter(c => state.selected.has(c.id)).forEach(c => c.tags.forEach(t => selectedTags.add(t)));
  state.result = { level, selectedTags };
  renderResult();
  showPage('result');
}

/* ---------- 渲染结果 ---------- */
function renderResult() {
  const s = state.scenario;
  const lv = RISK_LEVELS[state.result.level];
  // 风险头图
  $('riskHero').style.background = `linear-gradient(135deg,${s.grad[0]},${s.grad[1]})`;
  $('riskHero').innerHTML = `
    <div class="meta">${s.icon} ${s.name} · 应急方案</div>
    <div class="row">
      <div class="risk-ico">${lv.icon}</div>
      <div class="risk-main"><h2>${lv.label}等级</h2><div class="lvline">建议处置优先级：${['','立即介入','当天处置','密切跟进','持续关注'][state.result.level]}</div></div>
    </div>
    <div class="risk-desc">${lv.desc}</div>`;

  // 红色警示
  if (state.result.level === 1) {
    $('redAlert').style.display = 'flex';
    $('redAlert').innerHTML = `<span class="i">🚨</span><span><b>高危警示：</b>${s.redNote}</span>`;
  } else {
    $('redAlert').style.display = 'none';
  }

  // 法定强制报告提示：涉未成年人侵害场景始终显示，不受风险等级影响
  const needReport = s.mandatory === true || state.result.selectedTags.has('mandatory');
  $('mandatoryBox').style.display = needReport ? 'block' : 'none';
  if (needReport) renderMandatory();

  // Tabs
  const tabDefs = [
    { key: 'steps', name: '⚡ 处置步骤' },
    { key: 'scripts', name: '💬 沟通话术' },
    { key: 'scales', name: '📊 风险评估' },
    { key: 'referral', name: '🏥 转诊' },
    { key: 'hotlines', name: '📞 援助热线' },
    { key: 'safety', name: '🛡 安全计划' },
    { key: 'hotels', name: '☎️ 热线汇总' }
  ];
  $('tabs').innerHTML = tabDefs.map((t, i) => `<div class="tab ${i === 0 ? 'on' : ''}" data-k="${t.key}" onclick="switchTab('${t.key}')">${t.name}</div>`).join('');
  $('panels').innerHTML = tabDefs.map((t, i) => `<div class="panel ${i === 0 ? 'on' : ''}" data-k="${t.key}" id="panel-${t.key}"></div>`).join('');

  renderSteps();
  renderScripts();
  renderScales();
  renderReferral();
  renderHotlines();
  renderSafety();
  renderAllHotlines();
}

/* ---------- 法定强制报告提示卡 ---------- */
function renderMandatory() {
  const m = MANDATORY_REPORT;
  $('mandatoryBox').innerHTML = `
    <div class="mandatory-card">
      <div class="mc-top">
        <span class="mc-badge">⚖️ 法律责任提示</span>
        <span class="mc-title">${m.title}</span>
      </div>
      <div class="mc-call">
        <div class="mc-call-h">🚨 发现即报，先报警再处置</div>
        <div>立即拨打 <b>110</b> 报案或举报，同时按主管机关要求报告备案。不得内部消化、不得等待监护人同意、不得以“先观察”为由拖延。</div>
      </div>
      <div class="mc-sec"><div class="mc-h">👥 谁是报告主体</div><div class="mc-c">${m.who}</div></div>
      <div class="mc-sec"><div class="mc-h">⏱ 报告时限与去向</div><div class="mc-c">${m.when}</div></div>
      <div class="mc-sec"><div class="mc-h">📋 须立即报告的九类情形</div>
        <ol class="mc-list">${m.situations.map(x => `<li>${x}</li>`).join('')}</ol>
      </div>
      <div class="mc-sec mc-good"><div class="mc-h">🛡 报告人保护与免责</div><div class="mc-c">${m.protect}</div></div>
      <div class="mc-sec mc-warn"><div class="mc-h">⚠️ 不报告的责任</div><div class="mc-c">${m.liability}</div></div>
      <div class="mc-legal">${m.legal}。${m.note}</div>
    </div>`;
}

function switchTab(k) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.k === k));
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('on', p.dataset.k === k));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- 处置步骤 ---------- */
function renderSteps() {
  const tags = state.result.selectedTags;
  let steps = state.scenario.steps.filter(st => st.tag === 'all' || tags.has(st.tag));
  // 紧急等级时突出 p=0；否则全部显示
  const prioColor = { 0: 'var(--red)', 1: 'var(--orange)', 2: 'var(--teal)' };
  const prioText = { 0: '立即', 1: '尽快', 2: '跟进' };
  const prioBg = { 0: 'var(--soft-red);color:var(--red)', 1: 'var(--soft-orange);color:var(--orange)', 2: 'var(--soft-teal);color:var(--teal-ink)' };
  $('panel-steps').innerHTML = `
    <div class="card">
      <div class="script-h">📋 根据所选情况自动匹配的处置步骤（共 ${steps.length} 步）</div>
      ${steps.map((st, i) => `
        <div class="step-item">
          <div class="step-n" style="background:${prioColor[st.p]}">${i + 1}</div>
          <div class="step-body">
            <h4>${st.t}<span class="prio-tag" style="background:${prioBg[st.p]}">${prioText[st.p]}</span></h4>
            <p>${st.d}</p>
          </div>
        </div>`).join('')}
    </div>
    <div class="tip-card"><span class="i">🧭</span><span>以上步骤参照 <b>Roberts 七阶段危机干预模型</b>与 <b>Gilliland 六步法</b>：先确保安全与评估致命性，再建立关系、澄清问题、处理情绪、寻找资源、制定计划并随访。</span></div>`;
}

/* ---------- 沟通话术 ---------- */
function renderScripts() {
  const s = state.scenario;
  $('panel-scripts').innerHTML = `
    <div class="card">
      <div class="script-block">
        <div class="script-h" style="color:var(--ink-green)">✅ 推荐这样说</div>
        ${s.doScripts.map(x => `<div class="script-line do-line">${x}</div>`).join('')}
      </div>
      <div class="script-block">
        <div class="script-h" style="color:var(--red)">❌ 避免这样说</div>
        ${s.dontScripts.map(x => `<div class="script-line dont-line">${x}</div>`).join('')}
      </div>
    </div>`;
}

/* ---------- 风险评估量表 ---------- */
function renderScales() {
  const s = state.scenario;
  $('panel-scales').innerHTML = `
    <div class="card">
      <div class="script-h">📊 本场景推荐量表（可现场计分）</div>
      ${s.scales.map(id => {
        const sc = SCALES[id];
        return `<div class="scale-item" onclick="openScale('${id}')">
          <div class="sh"><div class="si">📋</div>
            <div><h4>${sc.name}</h4><div class="src">${sc.desc}</div></div>
            <span class="go">›</span></div></div>`;
      }).join('')}
    </div>
    <div class="tip-card"><span class="i">ℹ️</span><span>量表结果会给出严重程度分级与处置建议，并与方案风险等级联动。<b>量表为筛查工具，不能替代临床诊断。</b></span></div>`;
}

/* ---------- 相关热线（情景化） ---------- */
function renderHotlines() {
  const s = state.scenario;
  // 根据场景挑选相关热线
  let ids;
  if (s.id === 'child') ids = ['110', '120', '12355', '12338'];
  else if (s.id === 'dv') ids = ['110', '12338', '12356', '120'];
  else if (s.id === 'campus') ids = ['12355', '12356', '110', '12338'];
  else if (s.id === 'suicide') ids = ['12356', '120', '110', '400-161-9995'];
  else if (s.id === 'trauma') ids = ['120', '12356', '110'];
  else ids = ['120', '12356', '110'];
  const list = ids.map(n => HOTLINES.find(h => h.num === n)).filter(Boolean);
  $('panel-hotlines').innerHTML = `
    <div class="script-h" style="padding:2px 4px 10px">📞 本场景建议优先联系的热线</div>
    ${list.map(h => hotlineCard(h)).join('')}`;
}

function renderAllHotlines() {
  $('panel-hotels').innerHTML = `
    <div class="script-h" style="padding:2px 4px 10px">☎️ 常用援助热线一览（点击拨打）</div>
    ${HOTLINES.map(h => hotlineCard(h)).join('')}`;
}

function hotlineCard(h) {
  return `<div class="hotline ${h.primary ? 'primary' : ''}">
    <div class="hl-ico" style="background:${h.primary ? 'var(--grad-hot-2)' : 'var(--soft-teal)'}">${h.type === 'police' ? '👮' : h.type === 'medical' ? '🚑' : h.type === 'legal' ? '⚖️' : h.type === 'youth' ? '🧒' : '💚'}</div>
    <div class="hl-txt"><h4>${h.name}</h4><div class="num">${h.num}</div><p>${h.note}</p></div>
    <button class="hl-call ${h.type === 'police' || h.type === 'medical' ? 'red' : ''}" onclick="call('${h.num}')">拨打</button>
  </div>`;
}

function call(num) {
  window.location.href = 'tel:' + num;
}

/* ---------- 安全计划 ---------- */
function renderSafety() {
  $('panel-safety').innerHTML = `
    <div class="card">
      <div class="script-h">🛡 安全计划六步法（Stanley-Brown）<span class="sec-sub">可与当事人共同填写</span></div>
      ${SAFETY_PLAN.map(p => `
        <div class="sp-item">
          <div class="sp-n">${p.n}</div>
          <div class="sp-body"><h4>${p.t}</h4>
            <textarea placeholder="${p.hint}"></textarea></div>
        </div>`).join('')}
      <div class="tip-card" style="margin-top:6px"><span class="i">💾</span><span>填写内容仅保存在本机浏览器，不会上传。建议完成后<b>打印或截图</b>交由当事人随身携带。</span></div>
    </div>`;
  // 恢复本地草稿
  const key = 'safety_' + state.scenario.id;
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    document.querySelectorAll('#panel-safety textarea').forEach((ta, i) => { if (saved[i]) ta.value = saved[i]; });
  } catch (e) {}
  document.querySelectorAll('#panel-safety textarea').forEach(ta => {
    ta.addEventListener('input', () => {
      const vals = [...document.querySelectorAll('#panel-safety textarea')].map(t => t.value);
      localStorage.setItem(key, JSON.stringify(vals));
    });
  });
}

/* ---------- 转诊板块：需要转诊断时联系谁 ---------- */
function renderReferral() {
  $('panel-referral').innerHTML = `
    <div class="card">
      <div class="script-h">🚩 什么情况需要转诊（上转指征）</div>
      <div class="script-line dont-line" style="padding-left:30px;display:block">
        ${REFERRAL.indications.map(x => '• ' + x).join('<br>')}
      </div>
    </div>
    <div class="card">
      <div class="script-h">🏥 转去哪里 · 找谁</div>
      ${REFERRAL.destinations.map(d => `
        <div class="step-item" style="padding-bottom:14px">
          <div class="step-n" style="background:var(--teal);font-size:16px">${d.icon}</div>
          <div class="step-body"><h4>${d.t}</h4><p>${d.d}</p></div>
        </div>`).join('')}
    </div>
    <div class="card">
      <div class="script-h">📋 转诊流程</div>
      ${REFERRAL.process.map((p, i) => `
        <div class="step-item">
          <div class="step-n" style="background:var(--teal-l)">${i + 1}</div>
          <div class="step-body"><p style="color:var(--ink);font-size:13px">${p}</p></div>
        </div>`).join('')}
      <div class="referral-note"><span>⚠️</span><span>${REFERRAL.note}</span></div>
    </div>
    <div class="card">
      <div class="script-h">📍 本地转诊机构（一键拨打）</div>
      <button class="btn-primary" style="padding:12px;font-size:14px" onclick="showPage('local');detectLocation()">定位并查看本地精神卫生中心 ›</button>
    </div>`;
}

/* ---------- 本地热线与定位 ---------- */
function goLocal() {
  showPage('local');
  // 手动选择为主路径：若已记住上次省市，直接带出；否则等待用户手动选。
  // 自动定位降为可选，不主动请求（浏览器要求用户手势触发，且本地文件下会被安全策略拒绝）。
  let last = null;
  try { last = localStorage.getItem('last_province'); } catch (e) {}
  if (last && PROVINCES[last]) {
    $('provinceSel').value = last;
    renderLocal(last);
    $('locStatus').innerHTML = '';
  } else {
    $('locStatus').innerHTML = '';
  }
}

// 将定位返回的省份文本归一到 PROVINCES 的键
function normalizeProvince(text) {
  if (!text) return '';
  let t = text.trim();
  if (PROVINCES[t]) return t;
  if (PROVINCE_ALIAS[t]) return PROVINCE_ALIAS[t];
  // 去掉常见后缀再匹配
  for (const key of Object.keys(PROVINCE_ALIAS)) {
    if (t.indexOf(key) === 0) return PROVINCE_ALIAS[key];
  }
  // 部分反查直接给“XX市”，尝试匹配省份关键字
  for (const p of Object.keys(PROVINCES)) {
    if (t.indexOf(p) !== -1) return p;
  }
  return '';
}

function detectLocation() {
  const box = $('locStatus');
  box.innerHTML = '<span class="spin"></span><span>正在获取你的位置…</span>';
  if (!navigator.geolocation) {
    box.innerHTML = '⚠️ 当前环境不支持定位，请在下方手动选择省市。';
    return;
  }
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude: lat, longitude: lon } = pos.coords;
    box.innerHTML = '<span class="spin"></span><span>定位成功，正在匹配当地资源…</span>';
    let prov = '';
    // 免费无 key、CORS 开放、返回中文省市的逆地理编码接口，偶发限流故重试
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`;
    for (let attempt = 0; attempt < 3 && !prov; attempt++) {
      try {
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), 9000);
        const resp = await fetch(url, { signal: ctl.signal, cache: 'no-store' });
        clearTimeout(timer);
        if (!resp.ok) continue;
        const d = await resp.json();
        prov = normalizeProvince(d.principalSubdivision || d.city || '');
      } catch (e) { /* 限流或超时，重试 */ }
    }
    if (prov) {
      $('provinceSel').value = prov;
      try { localStorage.setItem('last_province', prov); } catch (e) {}
      box.innerHTML = `📍 已定位：<b>${prov}</b>　<span class="retry" onclick="detectLocation()">重新定位</span>`;
      renderLocal(prov);
    } else {
      box.innerHTML = '⚠️ 定位到了位置，但未能匹配本地号码，请在下方手动选择省市。<span class="retry" onclick="detectLocation()">重试</span>';
    }
  }, (err) => {
    let msg = '⚠️ 定位未成功';
    if (err && err.code === 1) msg = '⚠️ 定位权限被拒绝';
    else if (err && err.code === 2) msg = '⚠️ 暂时无法获取位置';
    else if (err && err.code === 3) msg = '⚠️ 定位超时';
    const localFile = /^file:|^content:/.test(location.protocol);
    let hint;
    if (localFile) {
      hint = '检测到你正用<strong>本地文件方式</strong>打开。Edge 等浏览器会禁止本地文件获取定位，即使设置已允许也不会弹窗——这是浏览器的安全限制，非本工具故障。请改用<strong>在线网址版</strong>打开，或直接在下方手动选省市。';
    } else if (err && err.code === 1) {
      hint = '若是误点了「拒绝」，请点地址栏左侧的锁形图标→位置权限→改为「允许」，再点下方「重试」。';
    } else {
      hint = '请检查手机定位开关，或直接在下方手动选择省市。';
    }
    box.innerHTML = `${msg}。${hint}<br><span class="retry" onclick="detectLocation()">重试定位</span>`;
  }, { enableHighAccuracy: false, timeout: 9000, maximumAge: 300000 });
}

function onProvinceChange(val) {
  if (!val) { $('localContent').innerHTML = ''; return; }
  try { localStorage.setItem('last_province', val); } catch (e) {}
  renderLocal(val);
}

function renderLocal(prov) {
  const data = PROVINCES[prov];
  if (!data) return;
  const hotlineCard = h => `
    <div class="hotline ${h.type === 'psy' ? 'primary' : ''}">
      <div class="hl-ico" style="background:${h.type === 'psy' ? 'var(--grad-hot-2)' : 'var(--soft-teal)'}">${h.icon || '💚'}</div>
      <div class="hl-txt"><h4>${h.name}</h4><div class="num">${h.num}</div><p>${h.note}</p></div>
      <button class="hl-call ${h.type === 'psy' ? 'red' : ''}" onclick="call('${h.num}')">拨打</button>
    </div>`;
  const centerCard = c => `
    <div class="center-card">
      <div class="ci">🏥</div>
      <div class="ct"><h4>${c.name}</h4><p>${c.note}</p><div class="cnum">${c.num}</div></div>
      <button class="hl-call" onclick="call('${c.num}')">拨打</button>
    </div>`;
  $('localContent').innerHTML = `
    <div class="local-sec-h">📞 ${prov} · 本地心理热线</div>
    ${data.hotlines.map(hotlineCard).join('')}
    <div class="local-sec-h">🏥 ${prov} · 精神卫生中心 / 转诊机构</div>
    ${data.centers.map(centerCard).join('')}
    <div class="local-sec-h">🌐 全国通用专线</div>
    ${NATIONAL_LINES.map(hotlineCard).join('')}
    <div class="referral-note"><span>ℹ️</span><span>以上号码整理自公开资料，可能随时间调整，请以当地官方公布为准。遇即时人身危险请拨打 110 / 120。</span></div>`;
}

/* ---------- 量表弹层 ---------- */
let activeScale = null;
let scaleAnswers = [];

function openScale(id) {
  activeScale = SCALES[id];
  scaleAnswers = new Array(activeScale.items.length).fill(null);
  $('scaleName').textContent = activeScale.name;
  $('scaleSrc').textContent = activeScale.source;
  const isFreq = activeScale.type === 'freq';
  $('scaleBody').innerHTML = `<div class="scale-prog" id="scaleProg"></div>` + activeScale.items.map((item, i) => `
    <div class="q">
      <div class="q-title"><span class="qn">${i + 1}.</span>${item}</div>
      <div class="opts" data-qi="${i}">
        ${(isFreq ? activeScale.options : ['是', '否']).map((o, oi) =>
          `<div class="opt" data-v="${isFreq ? oi : (oi === 0 ? 1 : 0)}" onclick="pickOpt(${i},${isFreq ? oi : (oi === 0 ? 1 : 0)},this)">${o}</div>`
        ).join('')}
      </div>
    </div>`).join('');
  $('scaleFoot').innerHTML = `<button class="btn-primary pending" id="scoreBtn" onclick="scoreScale()">查看结果</button>`;
  $('mask').classList.add('on');
  updateScaleProgress();
}

// 作答进度提示：已完成 X / 共 N 题；完成时按钮转为可点样式
function updateScaleProgress() {
  const prog = $('scaleProg');
  const btn = $('scoreBtn');
  if (!prog || !btn) return;
  const total = scaleAnswers.length;
  const done = scaleAnswers.filter(v => v !== null).length;
  if (done === total) {
    prog.className = 'scale-prog done';
    prog.textContent = `✓ 已完成全部 ${total} 题，可以出结果了`;
    btn.classList.remove('pending');
  } else {
    prog.className = 'scale-prog';
    prog.innerHTML = `已完成 ${done} / ${total} 题 · 还有 <b>${total - done}</b> 题未作答`;
    btn.classList.add('pending');
  }
}

function pickOpt(qi, val, el) {
  scaleAnswers[qi] = val;
  el.parentElement.querySelectorAll('.opt').forEach(o => o.classList.remove('sel'));
  el.classList.add('sel');
  updateScaleProgress();
}

function scoreScale() {
  // 防呆：未答完不静默失败，明确提示并滚动高亮第一道未答题
  if (activeScale && scaleAnswers.some(v => v === null)) {
    const first = scaleAnswers.findIndex(v => v === null);
    const qs = $('scaleBody').querySelectorAll('.q');
    // 进度条用 .scale-prog，不计入 .q，故题目索引与第一道未答题索引一一对应
    const target = qs[first];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.remove('flash');
      void target.offsetWidth; // 触发重排以重启动画
      target.classList.add('flash');
      setTimeout(() => target.classList.remove('flash'), 1600);
    }
    toast('还有题目未作答，已为你跳到第一道未答题');
    return;
  }
  const r = activeScale.score(scaleAnswers);
  const lv = RISK_LEVELS[r.level];
  // 若量表判定更严重，联动提升方案风险等级（无方案上下文时跳过联动）
  if (state.result && r.risk < state.result.level) {
    state.result.level = r.risk;
    renderResult();
  }
  $('scaleBody').innerHTML = `
    <div class="result-box" style="background:${lv.bgv};border:1.5px solid ${lv.fg}55">
      <div class="rl" style="color:${lv.fg}">${lv.icon} 评估结果 · ${activeScale.name}</div>
      <div class="rs" style="color:${lv.fg}">${r.score}</div>
      <div style="font-size:15px;font-weight:800;color:${lv.fg}">${r.label}</div>
      <div class="ra">${r.advice}</div>
    </div>
    <div class="tip-card" style="margin-top:14px"><span class="i">⚠️</span><span>${activeScale.desc} 结果为筛查参考，<b>须结合专业临床访谈综合判断</b>。</span></div>`;
  $('scaleFoot').innerHTML = `
    <button class="btn-ghost" style="width:100%;border:1.5px solid var(--line);background:var(--card);border-radius:13px;padding:12px;font-weight:700;cursor:pointer" onclick="openScale('${activeScale.id}')">重新作答</button>`;
}

function closeScale() { $('mask').classList.remove('on'); }

/* ---------- 从首页查看全部热线 ---------- */
function showAllHotlines() {
  $('scaleName').textContent = '常用援助热线';
  $('scaleSrc').textContent = '遇到危机时，先打电话——总有人愿意听你说';
  $('scaleBody').innerHTML = HOTLINES.map(h => hotlineCard(h)).join('') +
    `<div class="tip-card" style="margin-top:6px"><span class="i">📞</span><span>拨打按钮将直接唤起手机拨号键盘。心理困扰可优先拨打 <b>12356</b>；人身安全受威胁请拨打 <b>110</b>。</span></div>`;
  $('scaleFoot').innerHTML = `<button class="btn-primary" onclick="closeScale()">知道了</button>`;
  $('mask').classList.add('on');
}

/* ---------- 主题（深色模式）----------
 * 三态：auto 跟随系统 / light 强制浅色 / dark 强制深色，存 localStorage。
 * auto 时移除 data-theme，让 CSS 的 prefers-color-scheme 媒体查询生效。 */
const THEME_STEPS = [
  { key: 'auto',  name: '跟随', ico: '🌗' },
  { key: 'light', name: '浅色', ico: '☀️' },
  { key: 'dark',  name: '深色', ico: '🌙' }
];
function getThemeKey() {
  let k = 'auto';
  try { k = localStorage.getItem('theme') || 'auto'; } catch (e) {}
  return THEME_STEPS.some(t => t.key === k) ? k : 'auto';
}
function applyTheme() {
  const k = getThemeKey();
  const root = document.documentElement;
  if (k === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', k);
  const t = THEME_STEPS.find(x => x.key === k);
  const btn = $('themeBtn');
  if (btn) { btn.querySelector('.th-ico').textContent = t.ico; btn.querySelector('.th-label').textContent = t.name; }
}
function cycleTheme() {
  const next = (THEME_STEPS.findIndex(t => t.key === getThemeKey()) + 1) % THEME_STEPS.length;
  try { localStorage.setItem('theme', THEME_STEPS[next].key); } catch (e) {}
  applyTheme();
  toast('主题：' + THEME_STEPS[next].name + (THEME_STEPS[next].key === 'auto' ? '（跟随系统）' : ''));
}

/* ---------- 字号 / 视口缩放 ----------
 * 两个彼此独立的缩放，务必分清：
 *   ① vp.zoom —— 视口失效补偿倍数。本地文件在微信/QQ(X5)等内核里会被按 ~980px 布局
 *      再整体缩到屏幕(约 0.4 倍)。此倍数把被缩小的画布补回真实设备宽度。
 *   ② userScale —— 用户字号偏好(标准/大/特大)，只作用于正文，与浮层无关。
 * 正文 #app 的缩放 = ①×②。悬浮按钮/弹层/toast 在 #app 外，不跟随②(否则字号调大时
 * 按钮被放大而重叠)，但必须跟随①——否则 X5 整体缩小画布时，正文被①补回、按钮却没补，
 * 就变成小圆点。给这些 fixed 元素自身设 zoom=①，其尺寸与 right/bottom 偏移会同比例
 * 放大(已实测)，既抵消画布缩小、定位又自洽。弹层 .mask 同理由 zoom=① 继承给面板与
 * 文字，但面板 max-height 的 vh 会被 zoom 二次放大，X5 场景需换成具体 px。
 * ①=1 时 zoom=1，完全无副作用。 */
const FONT_STEPS = [
  { key: 'std',  name: '标准', scale: 1 },
  { key: 'big',  name: '大',   scale: 1.18 },
  { key: 'max',  name: '特大', scale: 1.36 }
];
function getFontIdx() {
  let k = 'std';
  try { k = localStorage.getItem('fontScale') || 'std'; } catch (e) {}
  const i = FONT_STEPS.findIndex(f => f.key === k);
  return i < 0 ? 0 : i;
}
function applyZoom() {
  try {
    const vp = window.__vp || { zoom: 1, devW: 0, layoutVW: 0 };
    const userScale = FONT_STEPS[getFontIdx()].scale;
    const total = vp.zoom * userScale;
    // 只缩放正文容器 #app，不碰 body。浮层（悬浮按钮/弹层/toast）在 #app 外，
    // 因此其尺寸、fixed 定位、vh 高度全部保持真实视口值，无需任何反向补偿。
    const app = $('app');
    const layoutVW = vp.layoutVW || window.innerWidth || 0;
    if (app) {
      if (total > 1.001 && layoutVW) {
        app.style.width = (layoutVW / total).toFixed(2) + 'px';
        app.style.zoom = total.toFixed(3);
      } else {
        app.style.width = '';
        app.style.zoom = '';
      }
    }
    // 浮层只跟随「视口失效补偿倍数 vp.zoom」，不跟随用户字号。
    // 给 fixed 元素自身设 zoom：尺寸与 right/bottom 偏移会同比例放大（已实测），
    // 抵消掉 X5 内核对画布的整体缩小，又不会因字号放大而变大/重叠。vp.zoom=1 时无副作用。
    const v = (vp.zoom > 1.001) ? vp.zoom.toFixed(3) : '1';
    [['fontBtn', 18, 14], ['themeBtn', 78, 14]].forEach(function(a){
      const e = document.getElementById(a[0]);
      if (e) e.style.zoom = (vp.zoom > 1.001) ? v : '';
    });
    const ts = $('toast');
    if (ts) ts.style.zoom = (vp.zoom > 1.001) ? v : '';
    // 弹层（遮罩 + 面板）：X5 把整页画布缩小时，弹层也在 #app 外、同样被缩小，
    // 表现为「更多热线 / 量表」弹出的面板又窄字又小。给 .mask 设 zoom=vp.zoom，
    // zoom 会继承给面板及内部文字/按钮，一起被补回；fixed 遮罩 inset:0 设 zoom 后
    // 仍自动铺满视口（实测），无需锁宽高。但面板 max-height:92vh 中的 vh 会被 zoom
    // 二次放大（实测 92vh→约4624px），需在 X5 场景换成具体像素抵消，避免弹层被撑出屏幕。
    const mask = $('mask');
    if (mask) {
      mask.style.zoom = (vp.zoom > 1.001) ? v : '';
      const sheet = mask.querySelector('.sheet');
      if (sheet) {
        if (vp.zoom > 1.001) {
          const vh = window.innerHeight || 0;
          sheet.style.maxHeight = vh ? (vh * 0.92 / vp.zoom).toFixed(0) + 'px' : '';
        } else {
          sheet.style.maxHeight = '';
        }
      }
    }
    // 更新按钮显示
    const fb = $('fontBtn');
    if (fb) fb.querySelector('.ft-label').textContent = FONT_STEPS[getFontIdx()].name;
  } catch (e) {}
}
function cycleFont() {
  const next = (getFontIdx() + 1) % FONT_STEPS.length;
  try { localStorage.setItem('fontScale', FONT_STEPS[next].key); } catch (e) {}
  applyZoom();
  toast('字号已切换：' + FONT_STEPS[next].name);
}

/* ---------- Toast ---------- */
function toast(msg) {
  const t = $('toast');
  t.textContent = msg; t.classList.add('on');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), 2000);
}

/* ---------- 启动 ---------- */
init();
// 视口检测在 head 完成，最终值可能在 load 之后（源头修复要等两帧）才确定并触发 vpchange。
// 两处都重新应用一次，确保拿到最终倍数；多数情况下 zoom=1，applyZoom 走原生分支不产生副作用。
window.addEventListener('load', function(){ applyZoom(); });
window.addEventListener('vpchange', function(){ applyZoom(); });
