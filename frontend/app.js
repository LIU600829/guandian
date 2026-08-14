const navItems = [
  { id: "home", label: "我的研学", icon: "⌂" },
  { id: "courses", label: "课程中心", icon: "▣" },
  { id: "enrollments", label: "我的报名", icon: "□" },
  { id: "schedule", label: "我的日程", icon: "◷" },
  { id: "feedback", label: "课程反馈", icon: "★" },
  { id: "resources", label: "学习资源", icon: "▤" },
  { id: "community", label: "互动社区", icon: "◌" },
  { id: "growth", label: "签到 / 证书", icon: "✓" },
];

const state = {
  active: "home",
  selectedCourseId: 1,
  courses: [
    { id: 1, title: "太阳能小车实验营", icon: "☼", date: "8月20日 09:00-16:30", place: "市青少年科技中心", seats: 32, price: "399 元", summary: "从光能到电能，完成一辆会跑的太阳能小车。", level: "初中友好" },
    { id: 2, title: "城市微光观察课", icon: "⌁", date: "8月24日 14:00-18:00", place: "滨江科普步道", seats: 24, price: "199 元", summary: "观察城市照明、传感器和节能设计，完成研学观察报告。", level: "轻户外" },
    { id: 3, title: "未来通信与光纤实验", icon: "⌘", date: "8月28日 10:00-15:30", place: "光电实验教室 A", seats: 20, price: "299 元", summary: "用安全实验理解光纤传输、编码和信息传递。", level: "动手实验" },
  ],
  enrollments: [
    { id: 1, courseId: 1, course: "太阳能小车实验营", student: "林一诺", status: "approved", date: "已报名 · 8月20日" },
    { id: 2, courseId: 2, course: "城市微光观察课", student: "林一诺", status: "pending", date: "提交于 8月10日" },
  ],
  schedule: [
    { time: "09:00", title: "集合签到", detail: "老师核验名单，领取任务卡。", tag: "签到" },
    { time: "10:00", title: "光伏原理小课", detail: "用模型理解光能、电能和效率。", tag: "课程" },
    { time: "13:30", title: "太阳能小车制作", detail: "小组完成搭建、测试和优化。", tag: "实践" },
    { time: "16:00", title: "展示与反馈", detail: "提交作品记录，完成课程反馈。", tag: "反馈" },
  ],
  feedback: [
    { course: "太阳能小车实验营", score: 5, text: "实验流程很清楚，孩子回家后一直在讲太阳能小车。" },
  ],
  resources: [
    { title: "太阳能小车任务卡.pdf", type: "任务卡", size: "1.8 MB" },
    { title: "活动安全须知.docx", type: "通知", size: "420 KB" },
    { title: "往期作品照片.zip", type: "图片", size: "12 MB" },
  ],
  posts: [
    { author: "教师 小夏", title: "本周光电营准备清单", comments: 6 },
    { author: "学生 林一诺", title: "太阳能小车可以加装彩灯吗？", comments: 3 },
  ],
  notices: ["报名审核通过后会收到站内通知。", "8月20日活动请提前15分钟到达。"],
  checkedIn: false,
  certificateReady: true,
};

const $ = (selector) => document.querySelector(selector);
const toast = $("#toast");
const modal = $("#actionModal");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function statusLabel(status) {
  return { pending: "审核中", approved: "已通过", rejected: "未通过" }[status] || status;
}

function cardShell(title, subtitle, action = "") {
  return `<div class="section-head"><div><h2>${title}</h2><p>${subtitle}</p></div>${action}</div>`;
}

function renderHome() {
  const approved = state.enrollments.filter((item) => item.status === "approved").length;
  return `
    ${cardShell("我的研学", "欢迎回来，林一诺同学。")}
    <div class="grid stats-grid">
      <article class="card stat-card"><strong>${approved}</strong><span>已报名课程</span></article>
      <article class="card stat-card"><strong>${state.schedule.length}</strong><span>下一场活动环节</span></article>
      <article class="card stat-card"><strong>${state.checkedIn ? "已完成" : "待签到"}</strong><span>本次活动签到</span></article>
      <article class="card stat-card"><strong>${state.certificateReady ? "1" : "0"}</strong><span>可领取证书</span></article>
    </div>
    <div class="grid two-grid" style="margin-top:14px">
      <section class="card"><h3>下一场活动</h3><div class="list"><div class="list-item"><strong>太阳能小车实验营</strong><span class="muted">8月20日 09:00 · 市青少年科技中心</span><div class="action-row"><button class="primary-button" data-action="go-schedule">查看日程</button><button class="ghost-button" data-action="go-growth">签到信息</button></div></div></div></section>
      <section class="card"><h3>最新通知</h3><div class="list">${state.notices.slice(0, 3).map((notice) => `<div class="list-item">${notice}</div>`).join("")}</div></section>
    </div>
  `;
}

function renderCourses() {
  return `
    ${cardShell("课程中心", "按兴趣选择研学课程，报名后等待学校审核。")}
    <div class="grid card-grid">${state.courses.map((course) => `
      <article class="card">
        <div class="course-cover">${course.icon}</div>
        <span class="state info">${course.level}</span><h3>${course.title}</h3><p>${course.summary}</p>
        <div class="meta-row"><span>${course.date}</span><span>·</span><span>${course.place}</span></div>
        <div class="meta-row" style="margin-top:8px"><span>${course.seats} 个名额</span><span>${course.price}</span></div>
        <div class="action-row"><button class="tiny-button" data-action="view-course" data-id="${course.id}">查看详情</button><button class="primary-button" data-action="enroll" data-id="${course.id}">立即报名</button></div>
      </article>`).join("")}</div>
  `;
}

function renderCourseDetail() {
  const course = state.courses.find((item) => item.id === state.selectedCourseId) || state.courses[0];
  return `
    ${cardShell("课程详情", "了解活动安排、适合人群和报名信息。", '<button class="ghost-button" data-action="go-courses">返回课程</button>')}
    <div class="grid two-grid"><article class="card"><div class="course-cover">${course.icon}</div><span class="state info">${course.level}</span><h3>${course.title}</h3><p>${course.summary}</p><div class="list"><div class="list-item"><strong>时间</strong><span>${course.date}</span></div><div class="list-item"><strong>地点</strong><span>${course.place}</span></div><div class="list-item"><strong>费用</strong><span>${course.price}</span></div></div><div class="action-row"><button class="primary-button" data-action="enroll" data-id="${course.id}">立即报名</button></div></article><section class="card"><h3>活动说明</h3><p>课程由教师带队，包含安全说明、动手实验、作品记录和课后反馈。家长可在报名后查看审核状态。</p><div class="list"><div class="list-item"><strong>适合人群</strong><span>初中学生，欢迎家长陪同了解</span></div><div class="list-item"><strong>需要准备</strong><span>水杯、便携文具、运动鞋</span></div><div class="list-item"><strong>报名流程</strong><span>提交报名 → 学校审核 → 收到通知</span></div></div></section></div>
  `;
}

function renderEnrollments() {
  return `
    ${cardShell("我的报名", "查看每个孩子的报名状态和活动安排。", '<button class="primary-button" data-action="go-courses">浏览课程</button>')}
    <section class="card"><div class="list">${state.enrollments.map((item) => `<div class="list-item"><div class="meta-row"><strong>${item.course}</strong><span class="state ${item.status}">${statusLabel(item.status)}</span></div><span class="muted">${item.student} · ${item.date}</span><div class="action-row"><button class="ghost-button" data-action="go-schedule">查看日程</button>${item.status === "pending" ? '<button class="tiny-button" data-action="cancel-enrollment" data-id="' + item.id + '">撤回报名</button>' : ""}</div></div>`).join("")}</div></section>
  `;
}

function renderSchedule() {
  return `${cardShell("我的日程", "已通过审核的课程会自动进入日程。")}<div class="grid two-grid"><section class="card"><h3>8月20日 · 太阳能小车实验营</h3><div class="timeline">${state.schedule.map((item) => `<div class="timeline-item"><strong>${item.time} ${item.title}</strong><span class="muted">${item.detail}</span><span class="tag">${item.tag}</span></div>`).join("")}</div></section><section class="card"><h3>出行提醒</h3><div class="list"><div class="list-item"><strong>集合地点</strong><span>市青少年科技中心东门</span></div><div class="list-item"><strong>建议到达</strong><span>活动开始前 15 分钟</span></div><div class="list-item"><strong>联系人</strong><span>带队老师小夏 · 138****1024</span></div></div></section></div>`;
}

function renderFeedback() {
  return `${cardShell("课程反馈", "完成课程后提交反馈，帮助老师持续改进。")}<div class="grid two-grid"><section class="card form-card"><h3>提交新反馈</h3><label>课程<select id="feedbackCourse">${state.enrollments.map((item) => `<option>${item.course}</option>`).join("")}</select></label><label>评分<select id="feedbackScore"><option value="5">5 分 · 非常满意</option><option value="4">4 分 · 满意</option><option value="3">3 分 · 一般</option></select></label><label>反馈内容<textarea id="feedbackText" placeholder="说说孩子最喜欢的环节吧"></textarea></label><button class="primary-button" data-action="submit-feedback">提交反馈</button></section><section class="card"><h3>已提交反馈</h3><div class="list">${state.feedback.map((item) => `<div class="list-item"><strong>${item.course} · ${"★".repeat(item.score)}</strong><span>${item.text}</span></div>`).join("")}</div></section></div>`;
}

function renderResources() {
  return `${cardShell("学习资源", "课程任务卡、安全须知和活动照片都在这里。")}<div class="grid card-grid">${state.resources.map((item) => `<article class="card"><span class="tag">${item.type}</span><h3>${item.title}</h3><p>${item.size}</p><div class="action-row"><button class="tiny-button" data-action="download">下载</button><button class="ghost-button" data-action="share">分享</button></div></article>`).join("")}</div>`;
}

function renderCommunity() {
  return `${cardShell("互动社区", "和同学、家长、老师分享研学中的新发现。")}<div class="grid two-grid"><section class="card form-card"><h3>发布新内容</h3><label>标题<input id="postTitle" placeholder="例如：我的太阳能小车跑得更快了" /></label><label>内容<textarea id="postText" placeholder="写下你的发现或问题"></textarea></label><button class="primary-button" data-action="submit-post">发布内容</button></section><section class="card"><h3>社区动态</h3><div class="list">${state.posts.map((post) => `<div class="list-item"><strong>${post.title}</strong><span class="muted">${post.author} · ${post.comments} 条评论</span><div class="action-row"><button class="tiny-button" data-action="comment">评论</button></div></div>`).join("")}</div></section></div>`;
}

function renderGrowth() {
  return `${cardShell("签到 / 证书", "完成现场签到和课程反馈后，可以领取结课证书。")}<div class="grid two-grid"><section class="card"><h3>活动签到</h3><p>活动当天请打开此页面完成签到。</p><span class="state ${state.checkedIn ? "done" : "pending"}">${state.checkedIn ? "已签到" : "待签到"}</span><div class="action-row"><button class="primary-button" data-action="checkin">${state.checkedIn ? "再次查看签到" : "现场签到"}</button></div></section><section class="card certificate"><p class="eyebrow">Certificate of Completion</p><h3>太阳能小车实验营</h3><p>授予：林一诺</p><p>已完成签到、实践任务与课程反馈。</p><strong>光电研学 · 2026</strong><div class="action-row" style="justify-content:center"><button class="primary-button" data-action="download-cert">下载证书</button></div></section></div>`;
}

const views = { home: renderHome, courses: renderCourses, courseDetail: renderCourseDetail, enrollments: renderEnrollments, schedule: renderSchedule, feedback: renderFeedback, resources: renderResources, community: renderCommunity, growth: renderGrowth };

function renderNav() {
  const markup = navItems.map((item) => `<button class="nav-item ${state.active === item.id ? "active" : ""}" data-nav="${item.id}" title="${item.label}"><span class="nav-icon">${item.icon}</span><span class="nav-label">${item.label}</span></button>`).join("");
  $("#desktopNav").innerHTML = markup;
  $("#mobileNav").innerHTML = markup;
  document.querySelectorAll("[data-nav]").forEach((button) => button.addEventListener("click", () => { state.active = button.dataset.nav; render(); }));
}

function openModal(title, body, onSubmit) {
  $("#modalTitle").textContent = title;
  $("#modalBody").innerHTML = body;
  $("#modalSubmit").onclick = (event) => { event.preventDefault(); onSubmit?.(); modal.close(); };
  modal.showModal();
}

function render() {
  renderNav();
  const current = navItems.find((item) => item.id === state.active);
  $("#pageTitle").textContent = current?.label || "我的研学";
  $("#contentArea").innerHTML = views[state.active]();
  document.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => handleAction(button.dataset.action, button.dataset)));
}

function handleAction(action, data) {
  if (action === "go-courses") { state.active = "courses"; render(); return; }
  if (action === "go-schedule") { state.active = "schedule"; render(); return; }
  if (action === "go-growth") { state.active = "growth"; render(); return; }
  if (action === "view-course") { state.selectedCourseId = Number(data.id); state.active = "courseDetail"; render(); return; }
  if (action === "enroll") {
    const course = state.courses.find((item) => item.id === Number(data.id)) || state.courses[0];
    openModal("提交报名", `<div class="form-card"><p>你正在报名：<strong>${course.title}</strong></p><label>学生姓名<input id="enrollStudent" value="林一诺" /></label><label>家长联系电话<input id="enrollPhone" value="138****1024" /></label><label>备注<textarea id="enrollNote" placeholder="如有过敏或特殊情况请填写"></textarea></label></div>`, () => {
      state.enrollments.unshift({ id: Date.now(), courseId: course.id, course: course.title, student: $("#enrollStudent").value || "林一诺", status: "pending", date: "刚刚提交" });
      state.notices.unshift(`“${course.title}”报名已提交，等待学校审核。`);
      state.active = "enrollments"; showToast("报名已提交，等待学校审核"); render();
    });
    return;
  }
  if (action === "cancel-enrollment") { state.enrollments = state.enrollments.filter((item) => item.id !== Number(data.id)); showToast("报名已撤回"); render(); return; }
  if (action === "submit-feedback") { state.feedback.unshift({ course: $("#feedbackCourse").value, score: Number($("#feedbackScore").value), text: $("#feedbackText").value || "课程体验很好，收获很多。" }); showToast("反馈已提交"); render(); return; }
  if (action === "submit-post") { const title = $("#postTitle").value || "新的研学分享"; state.posts.unshift({ author: "学生 林一诺", title, comments: 0 }); showToast("内容已发布"); render(); return; }
  if (action === "checkin") { state.checkedIn = true; state.notices.unshift("太阳能小车实验营已完成现场签到。"); showToast("签到成功，祝你研学愉快"); render(); return; }
  if (action === "download" || action === "download-cert") { showToast("已生成下载任务（演示）"); return; }
  if (action === "share" || action === "comment") { showToast(action === "share" ? "分享链接已复制（演示）" : "评论功能已打开（演示）"); return; }
}

$("#quickEnrollButton").addEventListener("click", () => { state.active = "courses"; render(); });
$("#notifyButton").addEventListener("click", () => openModal("通知中心", `<div class="list">${state.notices.map((notice) => `<div class="list-item">${notice}</div>`).join("")}</div>`));
render();
