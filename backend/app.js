const navItems = [
  { id: "dashboard", label: "管理工作台", icon: "⌂" },
  { id: "courses", label: "课程管理", icon: "▣" },
  { id: "enrollments", label: "报名审核", icon: "□" },
  { id: "schedule", label: "日程管理", icon: "◷" },
  { id: "feedback", label: "反馈中心", icon: "★" },
  { id: "resources", label: "资源管理", icon: "▤" },
  { id: "community", label: "社区管理", icon: "◌" },
  { id: "attendance", label: "签到 / 证书", icon: "✓" },
];

const defaultCourses = [
  { id: 1, title: "太阳能小车实验营", icon: "☼", date: "8月20日 09:00-16:30", place: "市青少年科技中心", seats: 32, price: "399 元", status: "报名中" },
  { id: 2, title: "城市微光观察课", icon: "⌁", date: "8月24日 14:00-18:00", place: "滨江科普步道", seats: 24, price: "199 元", status: "报名中" },
  { id: 3, title: "未来通信与光纤实验", icon: "⌘", date: "8月28日 10:00-15:30", place: "光电实验教室 A", seats: 20, price: "299 元", status: "草稿" },
];

const initialNotices = ["还有报名等待审核。", "活动安全须知建议在课程开始前再次发布。"];

const state = {
  active: "dashboard",
  serverOnline: false,
  wjxEnrollUrl: localStorage.getItem("guandian-wjx-enroll-url") || "",
  config: {
    publicBaseUrl: location.origin,
    enrollUrl: `${location.origin}/mobile/?mode=enroll`,
    checkinUrl: `${location.origin}/mobile/?mode=checkin`,
    statusUrl: `${location.origin}/mobile/?mode=status`,
  },
  courses: [...defaultCourses],
  enrollments: [
    { id: 1, name: "林一诺", course: "太阳能小车实验营", role: "学生", phone: "138****1024", status: "pending", source: "手动录入" },
    { id: 2, name: "周明轩", course: "城市微光观察课", role: "学生", phone: "136****5588", status: "approved", source: "手动录入" },
    { id: 3, name: "陈可", course: "未来通信与光纤实验", role: "学生", phone: "139****7731", status: "pending", source: "手动录入" },
  ],
  schedule: [
    { time: "09:00", title: "集合签到", detail: "教师核验名单，学生领取任务卡。", tag: "签到" },
    { time: "10:00", title: "光伏原理小课", detail: "用模型理解光能、电能和效率。", tag: "课程" },
    { time: "13:30", title: "太阳能小车制作", detail: "小组完成搭建、测试和优化。", tag: "实践" },
    { time: "16:00", title: "展示与反馈", detail: "提交作品记录，完成课程反馈。", tag: "反馈" },
  ],
  feedback: [
    { name: "家长 王女士", course: "太阳能小车实验营", score: 5, text: "流程很清楚，孩子回家后一直在讲太阳能小车。" },
    { name: "学生 周明轩", course: "城市微光观察课", score: 4, text: "观察任务很有意思，希望下次增加动手时间。" },
  ],
  resources: [
    { title: "太阳能小车任务卡.pdf", type: "文档", size: "1.8 MB" },
    { title: "活动安全须知.docx", type: "通知", size: "420 KB" },
    { title: "往期作品照片.zip", type: "图片", size: "12 MB" },
  ],
  posts: [
    { id: 1, author: "教师 小夏", title: "本周光电营准备清单", comments: 6, status: "待处理" },
    { id: 2, author: "学生 林一诺", title: "太阳能小车可以加装彩灯吗？", comments: 3, status: "正常" },
  ],
  checkins: [
    { id: 1, name: "林一诺", course: "太阳能小车实验营", status: "done", time: "08:55", source: "手动录入" },
    { id: 2, name: "周明轩", course: "太阳能小车实验营", status: "done", time: "08:58", source: "手动录入" },
    { id: 3, name: "陈可", course: "太阳能小车实验营", status: "pending", time: "--", source: "名单导入" },
  ],
  notices: [...initialNotices],
};

const $ = (selector) => document.querySelector(selector);
const modal = $("#actionModal");
const toast = $("#toast");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function statusLabel(status) {
  return { pending: "待审核", approved: "已通过", rejected: "已拒绝", done: "已签到" }[status] || status;
}

function statusClass(status) {
  return { pending: "pending", approved: "approved", rejected: "rejected", done: "done" }[status] || "info";
}

function cardShell(title, subtitle, action = "") {
  return `<div class="section-head"><div><h2>${title}</h2><p>${subtitle}</p></div>${action}</div>`;
}

function qrUrl(targetUrl, size = 190) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(targetUrl)}`;
}

function enrollTargetUrl() {
  return state.wjxEnrollUrl || state.config.enrollUrl;
}

function webhookUrl() {
  return `${state.config.publicBaseUrl}/api/wjx-webhook`;
}

function renderQrCard(title, detail, targetUrl, actionId) {
  const onlineLabel = state.serverOnline ? "互动服务在线" : "需要启动互动服务";
  return `
    <article class="card qr-card">
      <div class="meta-row" style="justify-content:space-between">
        <span class="state ${state.serverOnline ? "done" : "pending"}">${onlineLabel}</span>
        <button class="tiny-button" data-action="${actionId}">复制链接</button>
      </div>
      <h3>${title}</h3>
      <p>${detail}</p>
      <img class="qr-image" src="${qrUrl(targetUrl)}" alt="${title}二维码" />
      <a class="qr-link" href="${targetUrl}" target="_blank" rel="noreferrer">${targetUrl}</a>
    </article>
  `;
}

function renderScanPanel() {
  return `
    <div class="grid qr-grid">
      ${renderQrCard(state.wjxEnrollUrl ? "问卷星报名二维码" : "扫码报名二维码", state.wjxEnrollUrl ? "家长或学生扫码后进入问卷星填写基础信息。" : "家长或学生扫码填写报名信息，提交后会进入报名审核列表。", enrollTargetUrl(), "copy-enroll-url")}
      ${renderQrCard("现场签到二维码", "活动现场学生扫码签到，提交后会进入签到列表。", state.config.checkinUrl, "copy-checkin-url")}
      ${renderQrCard("报名状态查询二维码", "用户输入报名手机号后，可以查看审核结果和课程通知。", state.config.statusUrl, "copy-status-url")}
    </div>
  `;
}

function renderDashboard() {
  const pending = state.enrollments.filter((item) => item.status === "pending").length;
  const done = state.checkins.filter((item) => item.status === "done").length;
  const scanCount = state.enrollments.filter((item) => item.source === "扫码报名").length + state.checkins.filter((item) => item.source === "扫码签到").length;
  return `${cardShell("管理工作台", "今日重点事项、扫码入口和运营数据。")}
    <div class="grid stats-grid">
      <article class="card stat-card"><strong>${state.courses.length}</strong><span>课程总数</span></article>
      <article class="card stat-card"><strong>${pending}</strong><span>待审核报名</span></article>
      <article class="card stat-card"><strong>${done}/${state.checkins.length}</strong><span>签到进度</span></article>
      <article class="card stat-card"><strong>${scanCount}</strong><span>外部扫码记录</span></article>
    </div>
    <div style="margin-top:14px">${renderScanPanel()}</div>
    <div class="grid two-grid" style="margin-top:14px">
      <section class="card"><h3>待办事项</h3><div class="list"><div class="list-item"><strong>审核报名</strong><span class="muted">还有 ${pending} 位学生等待确认</span><div class="action-row"><button class="primary-button" data-action="go-enrollments">立即审核</button></div></div><div class="list-item"><strong>现场签到</strong><span class="muted">把签到二维码展示给学生扫描</span><div class="action-row"><button class="ghost-button" data-action="go-attendance">查看签到</button></div></div></div></section>
      <section class="card"><h3>最新通知</h3><div class="list">${state.notices.slice(0, 5).map((notice) => `<div class="list-item">${notice}</div>`).join("")}</div></section>
    </div>`;
}

function renderCourses() {
  return `${cardShell("课程管理", "创建、编辑、发布或下线研学课程。", '<button class="primary-button" data-action="create-course">发布课程</button>')}
    <div class="grid card-grid">${state.courses.map((course) => `<article class="card"><div class="course-cover">${course.icon}</div><span class="state ${course.status === "报名中" ? "approved" : "info"}">${course.status}</span><h3>${course.title}</h3><p>${course.date} · ${course.place}</p><div class="meta-row"><span>名额 ${course.seats}</span><span>费用 ${course.price}</span></div><div class="action-row"><button class="tiny-button" data-action="edit-course" data-id="${course.id}">编辑</button><button class="ghost-button" data-action="toggle-course" data-id="${course.id}">${course.status === "已下线" ? "重新发布" : "下线"}</button></div></article>`).join("")}</div>`;
}

function renderEnrollmentItem(item) {
  const details = [
    item.parentName ? `家长：${item.parentName}` : "",
    item.school ? `学校：${item.school}` : "",
    item.grade ? `年级：${item.grade}` : "",
    item.emergencyPhone ? `紧急联系人：${item.emergencyPhone}` : "",
  ].filter(Boolean);

  return `
    <div class="list-item">
      <div class="meta-row">
        <strong>${item.name}</strong>
        <span>${item.role}</span>
        <span>${item.phone}</span>
        <span class="tag">${item.source || "手动录入"}</span>
      </div>
      <span>${item.course}</span>
      ${details.length ? `<div class="survey-details">${details.map((detail) => `<span>${detail}</span>`).join("")}</div>` : ""}
      ${item.note ? `<span class="muted">备注：${item.note}</span>` : ""}
      <div class="action-row">
        <span class="state ${statusClass(item.status)}">${statusLabel(item.status)}</span>
        ${item.status === "pending" ? `<button class="tiny-button" data-action="approve" data-id="${item.id}">通过</button><button class="ghost-button" data-action="reject" data-id="${item.id}">拒绝</button>` : ""}
      </div>
    </div>
  `;
}

function renderEnrollments() {
  const scanList = state.enrollments.filter((item) => item.source === "扫码报名");
  return `${cardShell("报名审核", "逐条确认家长和学生提交的报名信息，扫码报名会自动进入这里。", '<button class="ghost-button" data-action="refresh-external">刷新扫码数据</button>')}
    <div class="grid two-grid">
      <section class="card">
        <h3>报名列表</h3>
        <div class="list">${state.enrollments.map(renderEnrollmentItem).join("")}</div>
      </section>
      <section class="card">
        <h3>扫码报名入口</h3>
        <p>${state.wjxEnrollUrl ? "当前报名二维码已连接问卷星。问卷星填写结果需要通过导出或数据推送同步。" : "把二维码发给家长或展示在现场，手机提交后此页面会自动刷新。"}</p>
        ${renderWjxSettings()}
        ${renderQrCard(state.wjxEnrollUrl ? "问卷星报名" : "家长 / 学生报名", `当前已收到 ${scanList.length} 条扫码报名。`, enrollTargetUrl(), "copy-enroll-url")}
      </section>
    </div>`;
}

function renderWjxSettings() {
  return `
    <div class="form-card embedded-panel">
      <h3>问卷星连接</h3>
      <label>问卷星发布链接<input id="wjxUrlInput" value="${state.wjxEnrollUrl}" placeholder="粘贴问卷星问卷链接，例如 https://www.wjx.cn/vm/xxxx.aspx" /></label>
      <div class="action-row">
        <button class="primary-button" data-action="save-wjx-url">保存问卷星链接</button>
        <button class="ghost-button" data-action="clear-wjx-url">恢复内置问卷</button>
      </div>
      <label>数据推送地址<input value="${webhookUrl()}" readonly /></label>
      <p>普通问卷星可先用链接收集信息；若账号支持数据推送/API，可把上面的地址填到问卷星推送配置里。</p>
      <label>导入问卷星文件<input id="wjxFileInput" type="file" accept=".csv,.txt,.tsv,.xlsx,.xls,.docx,.pdf" /></label>
      <div class="action-row">
        <button class="tiny-button" data-action="import-wjx-file">导入报名数据</button>
      </div>
      <p>支持 Excel .xlsx/.xls、CSV、文本、Word .docx、PDF 和扫描 PDF OCR。</p>
    </div>
  `;
}

function renderSchedule() {
  return `${cardShell("日程管理", "维护活动流程，变更后统一通知报名用户。", '<button class="primary-button" data-action="update-schedule">发布变更</button>')}
    <div class="grid two-grid"><section class="card"><h3>太阳能小车实验营 · 8月20日</h3><div class="timeline">${state.schedule.map((item) => `<div class="timeline-item"><strong>${item.time} ${item.title}</strong><span class="muted">${item.detail}</span><span class="tag">${item.tag}</span></div>`).join("")}</div></section><section class="card"><h3>通知预览</h3><p>日程变更会进入站内通知，并模拟发送短信。</p><div class="list">${state.notices.slice(0, 5).map((notice) => `<div class="list-item">${notice}</div>`).join("")}</div></section></div>`;
}

function renderFeedback() {
  const average = (state.feedback.reduce((sum, item) => sum + item.score, 0) / state.feedback.length).toFixed(1);
  return `${cardShell("反馈中心", "查看课程结束后的家长和学生评价，沉淀改进方向。")}
    <div class="grid two-grid"><section class="card"><h3>总体评分</h3><div class="stat-card"><strong>${average} / 5</strong><span>来自 ${state.feedback.length} 条反馈</span></div><div class="list" style="margin-top:16px"><div class="list-item"><strong>高频关键词</strong><span class="muted">动手实践、流程清晰、希望增加时间</span></div></div></section><section class="card"><h3>最新反馈</h3><div class="list">${state.feedback.map((item) => `<div class="list-item"><strong>${item.name} · ${item.course}</strong><span>${"★".repeat(item.score)} · ${item.text}</span></div>`).join("")}</div></section></div>`;
}

function renderResources() {
  return `${cardShell("资源管理", "上传课程资料、图片和活动通知。", '<button class="primary-button" data-action="upload-resource">上传资源</button>')}
    <div class="grid card-grid">${state.resources.map((item) => `<article class="card"><span class="tag">${item.type}</span><h3>${item.title}</h3><p>${item.size}</p><div class="action-row"><button class="tiny-button" data-action="download">预览</button><button class="ghost-button" data-action="delete-resource">删除</button></div></article>`).join("")}</div>`;
}

function renderCommunity() {
  return `${cardShell("社区管理", "查看全员社区动态，处理待关注内容。")}
    <section class="card"><div class="list">${state.posts.map((post) => `<div class="list-item"><div class="meta-row"><strong>${post.title}</strong><span class="state ${post.status === "待处理" ? "pending" : "approved"}">${post.status}</span></div><span class="muted">${post.author} · ${post.comments} 条评论</span><div class="action-row"><button class="tiny-button" data-action="feature-post" data-id="${post.id}">${post.status === "待处理" ? "标记已处理" : "推荐"}</button><button class="ghost-button" data-action="hide-post" data-id="${post.id}">隐藏</button></div></div>`).join("")}</div></section>`;
}

function renderAttendance() {
  const done = state.checkins.filter((item) => item.status === "done").length;
  const scanDone = state.checkins.filter((item) => item.source === "扫码签到").length;
  return `${cardShell("签到 / 证书", "现场核验学生到达情况，活动结束后生成结课证书。", '<button class="primary-button" data-action="refresh-external">刷新扫码数据</button>')}
    <div class="grid two-grid">
      <section class="card"><h3>签到进度 · ${done}/${state.checkins.length}</h3><div class="list">${state.checkins.map((item, index) => `<div class="list-item"><div class="meta-row"><strong>${item.name}</strong><span>${item.course}</span><span class="state ${statusClass(item.status)}">${statusLabel(item.status)}</span><span>${item.time}</span><span class="tag">${item.source || "手动录入"}</span></div><div class="action-row">${item.status !== "done" ? `<button class="tiny-button" data-action="checkin-one" data-id="${index}">设为已签到</button>` : ""}</div></div>`).join("")}</div></section>
      <section class="card">
        <h3>现场扫码签到</h3>
        <p>学生到场后扫码提交姓名，管理端会自动显示“已签到”。当前扫码签到 ${scanDone} 人。</p>
        ${renderQrCard("现场签到", "适合投屏或打印在签到台。", state.config.checkinUrl, "copy-checkin-url")}
      </section>
    </div>
    <div class="grid two-grid" style="margin-top:14px"><section class="card certificate"><p class="eyebrow">Certificate Center</p><h3>证书批量生成</h3><p>已完成签到和反馈的学生可以生成结课证书。</p><strong>${done} 位学生符合生成条件</strong><div class="action-row" style="justify-content:center"><button class="primary-button" data-action="generate-cert">生成证书</button></div></section><section class="card"><h3>外部交互说明</h3><p>二维码地址来自本机互动服务。手机需要和电脑连接同一个 Wi-Fi，扫码提交后会写入数据文件，学校端自动轮询显示。</p></section></div>`;
}

const views = { dashboard: renderDashboard, courses: renderCourses, enrollments: renderEnrollments, schedule: renderSchedule, feedback: renderFeedback, resources: renderResources, community: renderCommunity, attendance: renderAttendance };

function renderNav() {
  const markup = navItems.map((item) => `<button class="nav-item ${state.active === item.id ? "active" : ""}" data-nav="${item.id}" title="${item.label}"><span class="nav-icon">${item.icon}</span><span class="nav-label">${item.label}</span></button>`).join("");
  $("#desktopNav").innerHTML = markup;
  $("#mobileNav").innerHTML = markup;
  document.querySelectorAll("[data-nav]").forEach((button) => button.addEventListener("click", () => {
    state.active = button.dataset.nav;
    render();
  }));
}

function openModal(title, body, onSubmit) {
  $("#modalTitle").textContent = title;
  $("#modalBody").innerHTML = body;
  $("#modalSubmit").onclick = (event) => {
    event.preventDefault();
    onSubmit?.();
    modal.close();
  };
  modal.showModal();
}

function render() {
  renderNav();
  $("#pageTitle").textContent = navItems.find((item) => item.id === state.active)?.label || "管理工作台";
  $("#contentArea").innerHTML = views[state.active]();
  document.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => handleAction(button.dataset.action, button.dataset)));
}

function mergeExternalData(store) {
  const localEnrollmentIds = new Set(state.enrollments.map((item) => String(item.id)));
  for (const item of store.enrollments || []) {
    const existing = state.enrollments.find((enrollment) => String(enrollment.id) === String(item.id));
    if (existing) {
      Object.assign(existing, item);
    } else if (!localEnrollmentIds.has(String(item.id))) {
      state.enrollments.unshift({ ...item, source: item.source || "扫码报名" });
    }
  }

  for (const item of store.checkins || []) {
    const existing = state.checkins.find((checkin) => checkin.name === item.name && checkin.course === item.course);
    if (existing) {
      Object.assign(existing, item, { status: "done", source: item.source || "扫码签到" });
    } else {
      state.checkins.unshift({ ...item, status: "done", source: item.source || "扫码签到" });
    }
  }

  state.notices = [...(store.notices || []), ...initialNotices].slice(0, 8);
}

async function loadServerConfig() {
  try {
    const response = await fetch("/api/config", { cache: "no-store" });
    if (!response.ok) throw new Error("config failed");
    state.config = await response.json();
    state.serverOnline = true;
  } catch {
    state.serverOnline = false;
  }
}

async function syncExternalData(showMessage = false) {
  try {
    const response = await fetch("/api/state", { cache: "no-store" });
    if (!response.ok) throw new Error("state failed");
    mergeExternalData(await response.json());
    state.serverOnline = true;
    if (!modal.open) render();
    if (showMessage) showToast("扫码数据已刷新");
  } catch {
    state.serverOnline = false;
    if (showMessage) showToast("未连接到互动服务，请先启动 server.js");
    if (!modal.open) render();
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("链接已复制");
  } catch {
    openModal("扫码链接", `<div class="form-card"><label>请手动复制<input value="${text}" readonly /></label></div>`);
  }
}

function parseDelimitedText(text) {
  const rows = [];
  let current = "";
  let row = [];
  let quoted = false;
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  const delimiter = firstLine.includes("\t") ? "\t" : ",";

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(current.trim());
      current = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }
  row.push(current.trim());
  if (row.some(Boolean)) rows.push(row);

  const headers = (rows.shift() || []).map((header) => header.replace(/^\uFEFF/, "").trim());
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
}

function pickField(row, names) {
  const entries = Object.entries(row);
  const found = entries.find(([key]) => names.some((name) => key.includes(name)));
  return found ? found[1] : "";
}

function normalizeTableRows(rows) {
  return rows.map((row) => ({
    name: pickField(row, ["学生姓名", "姓名"]),
    parentName: pickField(row, ["家长姓名"]),
    phone: pickField(row, ["联系电话", "手机号", "手机", "电话"]),
    school: pickField(row, ["所在学校", "学校"]),
    grade: pickField(row, ["年级班级", "年级", "班级"]),
    course: pickField(row, ["报名课程", "课程"]),
    emergencyPhone: pickField(row, ["紧急联系人", "备用电话"]),
    note: pickField(row, ["补充说明", "备注"]),
  })).filter((row) => row.name || row.phone);
}

async function readExcelRows(file) {
  if (!window.XLSX) throw new Error("Excel 解析库未加载");
  const workbook = window.XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = window.XLSX.utils.sheet_to_json(sheet, { defval: "" });
  return normalizeTableRows(rows);
}

function extractTextField(text, labels) {
  for (const label of labels) {
    const pattern = new RegExp(`${label}\\s*[:：]?\\s*([^\\n\\r，,;；]+)`, "i");
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

function guessChineseName(text) {
  const blocked = ["报名", "课程", "学校", "年级", "班级", "电话", "手机", "联系人", "紧急", "备注", "姓名", "家长", "学生", "问卷", "活动", "信息"];
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const exact = lines.find((line) => /^[\u4e00-\u9fa5]{2,5}$/.test(line) && !blocked.some((word) => line.includes(word)));
  if (exact) return exact;
  const match = text.match(/(?:^|[\s：:，,])([\u4e00-\u9fa5]{2,4})(?=\s*(?:1[3-9]\d{9}|$|[\s，,]))/);
  return match?.[1] && !blocked.some((word) => match[1].includes(word)) ? match[1] : "";
}

function guessSchool(text) {
  return text.match(/([\u4e00-\u9fa5]{2,24}(?:学校|中学|小学|大学|学院))/)?.[1] || "";
}

function guessGrade(text) {
  return text.match(/((?:初|高)[一二三123]\s*(?:\d{1,2}\s*)?班?|[一二三四五六123456]\s*年级\s*(?:\d{1,2}\s*)?班?)/)?.[1] || "";
}

function buildTextRow(section) {
  const phoneMatch = section.match(/1[3-9]\d{9}/);
  return {
    name: extractTextField(section, ["学生姓名", "姓名"]) || guessChineseName(section),
    parentName: extractTextField(section, ["家长姓名", "家长"]),
    phone: extractTextField(section, ["联系电话", "手机号", "手机", "电话"]) || phoneMatch?.[0] || "",
    school: extractTextField(section, ["所在学校", "学校"]) || guessSchool(section),
    grade: extractTextField(section, ["年级班级", "年级", "班级"]) || guessGrade(section),
    course: extractTextField(section, ["报名课程", "课程"]),
    emergencyPhone: extractTextField(section, ["紧急联系人", "备用电话"]),
    note: extractTextField(section, ["补充说明", "备注"]),
  };
}

function parseSurveyText(text) {
  const cleaned = text.replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").trim();
  const phoneMatches = [...cleaned.matchAll(/1[3-9]\d{9}/g)];
  let candidates = cleaned.split(/\n\s*\n+/).filter(Boolean);
  if (phoneMatches.length > 1) {
    candidates = phoneMatches.map((match) => cleaned.slice(Math.max(0, match.index - 160), Math.min(cleaned.length, match.index + 180)));
  }
  if (!candidates.length) candidates = [cleaned];
  return candidates.map(buildTextRow).filter((row) => row.name || row.phone);
}

async function readPdfText(file) {
  if (!window.pdfjsLib) throw new Error("PDF 解析库未加载");
  const workerUrl = "../shared/vendor/pdf.worker.min.js";
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await window.pdfjsLib.getDocument({ data: bytes }).promise;
  const pageTexts = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pageTexts.push(content.items.map((item) => item.str).join("\n"));
  }
  return pageTexts.join("\n\n");
}

async function readPdfOcrText(file) {
  if (!window.pdfjsLib) throw new Error("PDF 解析库未加载");
  if (!window.Tesseract) throw new Error("OCR 解析库未加载");
  const workerUrl = "../shared/vendor/pdf.worker.min.js";
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await window.pdfjsLib.getDocument({ data: bytes }).promise;
  const texts = [];
  const maxPages = Math.min(pdf.numPages, 6);

  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
    showToast(`正在 OCR 识别第 ${pageNumber}/${maxPages} 页，请稍等`);
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: context, viewport }).promise;
    const worker = await window.Tesseract.createWorker("chi_sim+eng", 1, {
      workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js",
      corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@5",
      langPath: "https://tessdata.projectnaptha.com/4.0.0",
    });
    const result = await worker.recognize(canvas);
    await worker.terminate();
    texts.push(result.data.text || "");
  }
  return texts.join("\n\n");
}

async function readDocxText(file) {
  if (!window.mammoth) throw new Error("Word 解析库未加载");
  const result = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value || "";
}

async function readImportRows(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    return readExcelRows(file);
  }
  if (name.endsWith(".docx")) {
    return parseSurveyText(await readDocxText(file));
  }
  if (name.endsWith(".pdf")) {
    const textRows = parseSurveyText(await readPdfText(file));
    if (textRows.length) return textRows;
    showToast("PDF 没有可复制文字，开始 OCR 识别");
    return parseSurveyText(await readPdfOcrText(file));
  }
  return normalizeTableRows(parseDelimitedText(await file.text()));
}

async function importWjxFile() {
  const file = $("#wjxFileInput")?.files?.[0];
  if (!file) {
    showToast("请先选择问卷星导出的文件");
    return;
  }
  let rows = [];
  try {
    rows = await readImportRows(file);
  } catch (error) {
    showToast(error.message || "文件解析失败");
    return;
  }

  if (!rows.length) {
    showToast(file.name.toLowerCase().endsWith(".pdf") ? "PDF 没有可识别文字，可能是扫描件，需要 OCR" : "没有识别到姓名或电话，请检查文件内容");
    return;
  }

  const response = await fetch("/api/import-enrollments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });
  if (!response.ok) {
    showToast("导入失败，请检查文件格式");
    return;
  }
  const result = await response.json();
  mergeExternalData({ enrollments: result.imported, notices: [`已导入 ${result.imported.length} 条问卷星报名。`] });
  showToast(`已导入 ${result.imported.length} 条报名`);
  render();
}

function handleAction(action, data) {
  if (action === "go-enrollments") { state.active = "enrollments"; render(); return; }
  if (action === "go-resources") { state.active = "resources"; render(); return; }
  if (action === "go-attendance") { state.active = "attendance"; render(); return; }
  if (action === "refresh-external") { syncExternalData(true); return; }
  if (action === "copy-enroll-url") { copyText(enrollTargetUrl()); return; }
  if (action === "copy-checkin-url") { copyText(state.config.checkinUrl); return; }
  if (action === "copy-status-url") { copyText(state.config.statusUrl); return; }
  if (action === "save-wjx-url") {
    const value = $("#wjxUrlInput")?.value.trim() || "";
    state.wjxEnrollUrl = value;
    localStorage.setItem("guandian-wjx-enroll-url", value);
    showToast(value ? "问卷星链接已保存，报名二维码已更新" : "问卷星链接已清空");
    render();
    return;
  }
  if (action === "clear-wjx-url") {
    state.wjxEnrollUrl = "";
    localStorage.removeItem("guandian-wjx-enroll-url");
    showToast("已恢复内置报名问卷");
    render();
    return;
  }
  if (action === "import-wjx-file") {
    importWjxFile();
    return;
  }
  if (action === "create-course") {
    openModal("发布新课程", `<div class="form-card"><label>课程名称<input id="newCourseTitle" value="光电创意实验课" /></label><label>活动时间<input id="newCourseDate" value="9月5日 09:30-15:30" /></label><label>活动地点<input id="newCoursePlace" value="光电实验教室 B" /></label><label>报名名额<input id="newCourseSeats" type="number" value="30" /></label></div>`, () => {
      state.courses.unshift({ id: Date.now(), title: $("#newCourseTitle").value, icon: "✦", date: $("#newCourseDate").value, place: $("#newCoursePlace").value, seats: Number($("#newCourseSeats").value) || 30, price: "299 元", status: "报名中" });
      showToast("课程已发布");
      render();
    });
    return;
  }
  if (action === "edit-course") { showToast("课程编辑面板已打开（演示）"); return; }
  if (action === "toggle-course") {
    const item = state.courses.find((course) => course.id === Number(data.id));
    item.status = item.status === "已下线" ? "报名中" : "已下线";
    showToast(item.status === "已下线" ? "课程已下线" : "课程已重新发布");
    render();
    return;
  }
  if (action === "approve" || action === "reject") {
    const item = state.enrollments.find((enrollment) => String(enrollment.id) === String(data.id));
    const status = action === "approve" ? "approved" : "rejected";
    item.status = status;
    fetch("/api/enrollment-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, status, enrollment: item }),
    }).catch(() => showToast("审核状态暂未写入服务端，请检查服务是否运行"));
    state.notices.unshift(`${item.name} 的报名已${action === "approve" ? "通过" : "拒绝"}，通知已模拟发送。`);
    showToast(action === "approve" ? "报名已通过" : "报名已拒绝");
    render();
    return;
  }
  if (action === "update-schedule") {
    state.notices.unshift("日程变更：集合地点调整为科技中心东门，通知已模拟发送。");
    showToast("日程变更已发布");
    render();
    return;
  }
  if (action === "upload-resource") {
    state.resources.unshift({ title: "新上传研学资料.pdf", type: "文档", size: "860 KB" });
    showToast("资源已上传");
    render();
    return;
  }
  if (action === "delete-resource") { state.resources.shift(); showToast("资源已删除"); render(); return; }
  if (action === "download") { showToast("预览窗口已打开（演示）"); return; }
  if (action === "feature-post" || action === "hide-post") {
    const post = state.posts.find((item) => item.id === Number(data.id));
    if (action === "feature-post") post.status = "已处理";
    else state.posts = state.posts.filter((item) => item.id !== Number(data.id));
    showToast(action === "feature-post" ? "帖子已标记处理" : "帖子已隐藏");
    render();
    return;
  }
  if (action === "checkin-one") {
    const item = state.checkins[Number(data.id)];
    item.status = "done";
    item.time = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    showToast(`${item.name} 已签到`);
    render();
    return;
  }
  if (action === "generate-cert") { showToast("已为符合条件的学生生成证书（演示）"); return; }
}

$("#quickCourseButton").addEventListener("click", () => handleAction("create-course"));
$("#notifyButton").addEventListener("click", () => openModal("通知中心", `<div class="list">${state.notices.map((notice) => `<div class="list-item">${notice}</div>`).join("")}</div>`));

loadServerConfig().then(() => syncExternalData()).then(render);
setInterval(() => syncExternalData(), 3000);
