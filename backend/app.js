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
  config: {
    publicBaseUrl: location.origin,
    enrollUrl: `${location.origin}/mobile/?mode=enroll`,
    checkinUrl: `${location.origin}/mobile/?mode=checkin`,
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
      ${renderQrCard("扫码报名二维码", "家长或学生扫码填写报名信息，提交后会进入报名审核列表。", state.config.enrollUrl, "copy-enroll-url")}
      ${renderQrCard("现场签到二维码", "活动现场学生扫码签到，提交后会进入签到列表。", state.config.checkinUrl, "copy-checkin-url")}
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
        <p>把二维码发给家长或展示在现场，手机提交后此页面会自动刷新。</p>
        ${renderQrCard("家长 / 学生报名", `当前已收到 ${scanList.length} 条扫码报名。`, state.config.enrollUrl, "copy-enroll-url")}
      </section>
    </div>`;
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
    if (!localEnrollmentIds.has(String(item.id))) {
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

function handleAction(action, data) {
  if (action === "go-enrollments") { state.active = "enrollments"; render(); return; }
  if (action === "go-resources") { state.active = "resources"; render(); return; }
  if (action === "go-attendance") { state.active = "attendance"; render(); return; }
  if (action === "refresh-external") { syncExternalData(true); return; }
  if (action === "copy-enroll-url") { copyText(state.config.enrollUrl); return; }
  if (action === "copy-checkin-url") { copyText(state.config.checkinUrl); return; }
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
    item.status = action === "approve" ? "approved" : "rejected";
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
