const navItems = [
  { id: "dashboard", label: "总览", icon: "☀️" },
  { id: "courses", label: "课程", icon: "📚" },
  { id: "enrollment", label: "报名", icon: "📝" },
  { id: "schedule", label: "日程", icon: "📅" },
  { id: "feedback", label: "反馈", icon: "⭐" },
  { id: "resources", label: "资源", icon: "📁" },
  { id: "community", label: "社区", icon: "💬" },
  { id: "checkin", label: "签到", icon: "✅" },
  { id: "certificate", label: "证书", icon: "🏅" },
];

const state = {
  active: "dashboard",
  selectedCourseId: 1,
  courses: [
    {
      id: 1,
      title: "光电探索营：太阳能小车",
      icon: "⚡",
      summary: "学习光能转化、电路连接和团队调试，完成一辆会跑的小车。",
      date: "8月20日 09:00-16:30",
      place: "市青少年科技中心",
      seats: 32,
      price: "¥399",
      status: "报名中",
    },
    {
      id: 2,
      title: "城市微光观察课",
      icon: "🔭",
      summary: "观察城市照明、传感器和节能设计，完成一份研学观察报告。",
      date: "8月24日 14:00-18:00",
      place: "滨江科普步道",
      seats: 24,
      price: "¥199",
      status: "审核中",
    },
    {
      id: 3,
      title: "未来通信与光纤实验",
      icon: "💡",
      summary: "用安全实验理解光纤传输、编码和信息传递。",
      date: "8月28日 10:00-15:30",
      place: "光电实验教室 A",
      seats: 20,
      price: "¥299",
      status: "可报名",
    },
  ],
  enrollments: [
    { id: 1, name: "林一诺", course: "光电探索营：太阳能小车", role: "学生", phone: "138****1024", status: "pending" },
    { id: 2, name: "周明轩", course: "城市微光观察课", role: "学生", phone: "136****5588", status: "approved" },
    { id: 3, name: "陈可", course: "未来通信与光纤实验", role: "学生", phone: "139****7731", status: "pending" },
  ],
  schedule: [
    { time: "09:00", title: "集合签到", detail: "教师核验名单，学生领取任务卡。", tag: "签到" },
    { time: "10:00", title: "光伏原理小课", detail: "用模型理解光能、电能和效率。", tag: "课程" },
    { time: "13:30", title: "太阳能小车制作", detail: "小组完成搭建、测试和优化。", tag: "实践" },
    { time: "16:00", title: "展示与反馈", detail: "提交作品记录，完成课程反馈。", tag: "反馈" },
  ],
  feedback: [
    { name: "家长 王女士", score: 5, text: "流程很清楚，孩子回来一直讲太阳能小车。" },
    { name: "学生 周明轩", score: 4, text: "实验好玩，希望下次能多一点动手时间。" },
  ],
  resources: [
    { title: "太阳能小车任务卡.pdf", type: "文档", size: "1.8 MB" },
    { title: "活动安全通知.docx", type: "通知", size: "420 KB" },
    { title: "往期作品照片.zip", type: "图片", size: "12 MB" },
  ],
  posts: [
    { author: "教师 小夏", title: "本周光电营准备清单", comments: ["记得带水杯", "集合地点已更新"] },
    { author: "学生 林一诺", title: "太阳能小车可以加装灯吗？", comments: ["可以，注意电压安全"] },
  ],
  checkins: [
    { name: "林一诺", status: "done", time: "08:55" },
    { name: "周明轩", status: "done", time: "08:58" },
    { name: "陈可", status: "pending", time: "--" },
  ],
  notices: ["报名审核通过后将发送站内通知和短信模拟提醒。"],
};

const contentArea = document.querySelector("#contentArea");
const pageTitle = document.querySelector("#pageTitle");
const toast = document.querySelector("#toast");
const modal = document.querySelector("#actionModal");
const modalTitle = document.querySelector("#modalTitle");
const modalBody = document.querySelector("#modalBody");
const modalSubmit = document.querySelector("#modalSubmit");

function statusText(status) {
  return {
    pending: "待审核",
    approved: "已通过",
    rejected: "已拒绝",
    done: "已签到",
  }[status] || status;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2400);
}

function setActive(id) {
  state.active = id;
  render();
}

function renderNav() {
  const markup = navItems
    .map(
      (item) => `
        <button class="nav-item ${state.active === item.id ? "active" : ""}" data-nav="${item.id}" title="${item.label}">
          <span class="nav-icon">${item.icon}</span>
          <span class="nav-label">${item.label}</span>
        </button>
      `,
    )
    .join("");
  document.querySelector("#desktopNav").innerHTML = markup;
  document.querySelector("#mobileNav").innerHTML = markup;
  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.addEventListener("click", () => setActive(button.dataset.nav));
  });
}

function cardShell(title, subtitle, action = "") {
  return `
    <div class="section-head">
      <div>
        <h2>${title}</h2>
        <p>${subtitle}</p>
      </div>
      ${action}
    </div>
  `;
}

function renderDashboard() {
  const pendingCount = state.enrollments.filter((item) => item.status === "pending").length;
  return `
    ${cardShell("今日总览", "核心流程都放在这里，适合管理员快速扫一眼。")}
    <div class="grid stats-grid">
      <article class="card stat-card"><strong>${state.courses.length}</strong><span>已发布课程</span></article>
      <article class="card stat-card"><strong>${pendingCount}</strong><span>待审核报名</span></article>
      <article class="card stat-card"><strong>${state.schedule.length}</strong><span>今日日程节点</span></article>
      <article class="card stat-card"><strong>${state.checkins.filter((item) => item.status === "done").length}/${state.checkins.length}</strong><span>签到进度</span></article>
    </div>
    <div class="grid two-grid" style="margin-top:14px">
      <section class="card">
        <h3>待办提醒</h3>
        <div class="list">
          <div class="list-item"><strong>审核报名</strong><span class="muted">还有 ${pendingCount} 位学生等待确认。</span></div>
          <div class="list-item"><strong>更新资源</strong><span class="muted">建议上传活动前安全说明。</span></div>
          <div class="list-item"><strong>检查移动端</strong><span class="muted">确认家长手机端报名路径清楚。</span></div>
        </div>
      </section>
      <section class="card">
        <h3>最近通知</h3>
        <div class="list">${state.notices.map((notice) => `<div class="list-item">${notice}</div>`).join("")}</div>
      </section>
    </div>
  `;
}

function renderCourses() {
  return `
    ${cardShell("课程发布", "展示课程基础信息、图文封面、费用和报名状态。", '<button class="primary-button" data-action="create-course">发布课程</button>')}
    <div class="grid card-grid">
      ${state.courses
        .map(
          (course) => `
          <article class="card">
            <div class="course-cover">${course.icon}</div>
            <span class="state info">${course.status}</span>
            <h3>${course.title}</h3>
            <p>${course.summary}</p>
            <div class="meta-row"><span>${course.date}</span><span>·</span><span>${course.place}</span></div>
            <div class="meta-row"><span>名额 ${course.seats}</span><span>费用 ${course.price}</span></div>
            <div class="action-row">
              <button class="tiny-button" data-action="select-course" data-id="${course.id}">查看详情</button>
              <button class="ghost-button" data-action="offline-course" data-id="${course.id}">下线</button>
            </div>
          </article>
        `,
        )
        .join("")}
    </div>
  `;
}

function renderCourseDetail(courseId) {
  const course = state.courses.find((item) => item.id === courseId) || state.courses[0];
  return `
    ${cardShell("课程详情", "查看单个课程的完整信息，并模拟报名决策。", '<button class="ghost-button" data-action="back-courses">返回课程列表</button>')}
    <div class="grid two-grid">
      <article class="card">
        <div class="course-cover">${course.icon}</div>
        <span class="state info">${course.status}</span>
        <h3>${course.title}</h3>
        <p>${course.summary}</p>
        <div class="list">
          <div class="list-item"><strong>时间</strong><span>${course.date}</span></div>
          <div class="list-item"><strong>地点</strong><span>${course.place}</span></div>
          <div class="list-item"><strong>名额</strong><span>${course.seats}</span></div>
          <div class="list-item"><strong>费用</strong><span>${course.price}</span></div>
        </div>
        <div class="action-row">
          <button class="primary-button" data-action="enroll-from-course">立即报名</button>
          <button class="ghost-button" data-action="update-schedule">同步日程</button>
        </div>
      </article>
      <section class="card">
        <h3>课程说明</h3>
        <p>这里用于展示课程封面、介绍、时间地点、费用和报名入口，适合后续扩展图片轮播、附件和讲师信息。</p>
        <div class="list">
          <div class="list-item"><strong>适合人群</strong><span>初中学生及家长陪同</span></div>
          <div class="list-item"><strong>流程状态</strong><span>报名中 / 审核中 / 已结束</span></div>
          <div class="list-item"><strong>关联动作</strong><span>报名、签到、反馈、证书</span></div>
        </div>
      </section>
    </div>
  `;
}

function renderEnrollment() {
  return `
    ${cardShell("报名审核", "学生/家长提交报名后，由管理员人工审核并触发通知。", '<button class="primary-button" data-action="enroll">新增报名</button>')}
    <div class="grid two-grid">
      <section class="card">
        <h3>报名列表</h3>
        <div class="list">
          ${state.enrollments
            .map(
              (item) => `
              <div class="list-item">
                <div class="meta-row"><strong>${item.name}</strong><span>${item.role}</span><span>${item.phone}</span></div>
                <div>${item.course}</div>
                <div class="action-row">
                  <span class="state ${item.status}">${statusText(item.status)}</span>
                  <button class="tiny-button" data-action="approve" data-id="${item.id}">通过</button>
                  <button class="ghost-button" data-action="reject" data-id="${item.id}">拒绝</button>
                </div>
              </div>
            `,
            )
            .join("")}
        </div>
      </section>
      <section class="card form-card">
        <h3>报名状态说明</h3>
        <p>首版采用人工审核。审核通过后，系统会写入站内通知，并模拟短信提醒。</p>
        <span class="state pending">待审核</span>
        <span class="state approved">已通过</span>
        <span class="state rejected">已拒绝</span>
      </section>
    </div>
  `;
}

function renderSchedule() {
  return `
    ${cardShell("日程管理", "管理活动当天安排，并把变更同步给报名用户。", '<button class="primary-button" data-action="update-schedule">发布变更</button>')}
    <div class="grid two-grid">
      <section class="card">
        <h3>课程日程</h3>
        <div class="timeline">
          ${state.schedule
            .map(
              (item) => `
              <div class="timeline-item">
                <strong>${item.time} ${item.title}</strong>
                <span class="muted">${item.detail}</span>
                <span class="tag">${item.tag}</span>
              </div>
            `,
            )
            .join("")}
        </div>
      </section>
      <section class="card">
        <h3>通知模拟</h3>
        <p>日程变化会进入站内通知，并模拟短信发送结果。</p>
        <div class="list">${state.notices.map((notice) => `<div class="list-item">${notice}</div>`).join("")}</div>
      </section>
    </div>
  `;
}

function renderFeedback() {
  return `
    ${cardShell("课程反馈", "课程结束后收集家长和学生评价。")}
    <div class="grid two-grid">
      <section class="card form-card">
        <h3>提交反馈</h3>
        <label>姓名<input id="feedbackName" value="家长 李女士" /></label>
        <label>评分
          <select id="feedbackScore">
            <option value="5">5 分 非常满意</option>
            <option value="4">4 分 满意</option>
            <option value="3">3 分 一般</option>
          </select>
        </label>
        <label>反馈内容<textarea id="feedbackText">老师讲解很清楚，希望增加课后照片分享。</textarea></label>
        <button class="primary-button" data-action="submit-feedback">提交反馈</button>
      </section>
      <section class="card">
        <h3>反馈列表</h3>
        <div class="list">
          ${state.feedback
            .map((item) => `<div class="list-item"><strong>${item.name} · ${"★".repeat(item.score)}</strong><span>${item.text}</span></div>`)
            .join("")}
        </div>
      </section>
    </div>
  `;
}

function renderResources() {
  return `
    ${cardShell("资源分享", "课程资料、图片和通知统一放到资源区。", '<button class="primary-button" data-action="upload-resource">上传资源</button>')}
    <div class="grid card-grid">
      ${state.resources
        .map(
          (item) => `
          <article class="card">
            <span class="tag">${item.type}</span>
            <h3>${item.title}</h3>
            <p>${item.size}</p>
            <div class="action-row">
              <button class="tiny-button" data-action="download">下载</button>
              <button class="ghost-button" data-action="share">分享</button>
            </div>
          </article>
        `,
        )
        .join("")}
    </div>
  `;
}

function renderCommunity() {
  return `
    ${cardShell("互动社区", "全员可见的轻量社区，用于提问、通知补充和作品交流。", '<button class="primary-button" data-action="new-post">发布帖子</button>')}
    <div class="grid two-grid">
      <section class="card form-card">
        <h3>快速发帖</h3>
        <label>标题<input id="postTitle" value="我想分享今天的小车测试记录" /></label>
        <label>内容<textarea id="postText">今天我们小组调整了太阳能板角度，速度明显变快。</textarea></label>
        <button class="primary-button" data-action="submit-post">发布</button>
      </section>
      <section class="card">
        <h3>社区动态</h3>
        <div class="list">
          ${state.posts
            .map(
              (post) => `
              <div class="list-item">
                <strong>${post.title}</strong>
                <span class="muted">${post.author}</span>
                <div class="meta-row"><span>${post.comments.length} 条评论</span><button class="tiny-button" data-action="comment">评论</button></div>
              </div>
            `,
            )
            .join("")}
        </div>
      </section>
    </div>
  `;
}

function renderCheckin() {
  return `
    ${cardShell("签到管理", "现场核验学生到达情况，形成出勤记录。", '<button class="primary-button" data-action="scan-checkin">模拟扫码签到</button>')}
    <div class="card">
      <div class="list">
        ${state.checkins
          .map(
            (item, index) => `
            <div class="list-item">
              <div class="meta-row"><strong>${item.name}</strong><span class="state ${item.status}">${statusText(item.status)}</span><span>${item.time}</span></div>
              <div class="action-row">
                <button class="tiny-button" data-action="checkin-one" data-id="${index}">设为已签到</button>
              </div>
            </div>
          `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderCertificate() {
  return `
    ${cardShell("结课证书", "课程完成后展示可下载的结课证书。", '<button class="primary-button" data-action="generate-cert">生成证书</button>')}
    <div class="grid two-grid">
      <section class="card certificate">
        <p class="eyebrow">Certificate of Completion</p>
        <h3>光电探索营结课证书</h3>
        <p>授予：林一诺</p>
        <p>已完成“太阳能小车”研学课程，并完成签到、实践任务与课程反馈。</p>
        <strong>光研营 · 2026</strong>
      </section>
      <section class="card">
        <h3>证书状态</h3>
        <div class="list">
          <div class="list-item"><strong>签到</strong><span class="state done">已完成</span></div>
          <div class="list-item"><strong>反馈</strong><span class="state done">已提交</span></div>
          <div class="list-item"><strong>证书</strong><span class="state info">可生成</span></div>
        </div>
      </section>
    </div>
  `;
}

const views = {
  dashboard: renderDashboard,
  courses: renderCourses,
  courseDetail: () => renderCourseDetail(state.selectedCourseId),
  enrollment: renderEnrollment,
  schedule: renderSchedule,
  feedback: renderFeedback,
  resources: renderResources,
  community: renderCommunity,
  checkin: renderCheckin,
  certificate: renderCertificate,
};

function render() {
  renderNav();
  const current = navItems.find((item) => item.id === state.active);
  pageTitle.textContent = current.label;
  contentArea.innerHTML = views[state.active]();
  bindActions();
}

function openModal(title, body, onSubmit) {
  modalTitle.textContent = title;
  modalBody.innerHTML = body;
  modalSubmit.onclick = (event) => {
    event.preventDefault();
    onSubmit?.();
    modal.close();
  };
  modal.showModal();
}

function bindActions() {
  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleAction(button.dataset.action, button.dataset));
  });
}

function handleAction(action, data) {
  if (action === "create-course") {
    openModal(
      "发布课程",
      `
        <div class="form-card">
          <label>课程标题<input id="newCourseTitle" value="光电魔法实验课" /></label>
          <label>活动时间<input id="newCourseDate" value="9月3日 09:30-15:30" /></label>
          <label>活动地点<input id="newCoursePlace" value="光电实验教室 B" /></label>
        </div>
      `,
      () => {
        state.courses.unshift({
          id: Date.now(),
          title: document.querySelector("#newCourseTitle").value,
          icon: "✨",
          summary: "新发布的研学课程，可继续完善图文介绍和报名信息。",
          date: document.querySelector("#newCourseDate").value,
          place: document.querySelector("#newCoursePlace").value,
          seats: 30,
          price: "¥299",
          status: "报名中",
        });
        showToast("课程已发布");
        render();
      },
    );
    return;
  }

  if (action === "enroll") {
    openModal(
      "新增报名",
      `
        <div class="form-card">
          <label>学生姓名<input id="enrollName" value="新同学" /></label>
          <label>报名课程<select id="enrollCourse">${state.courses.map((course) => `<option>${course.title}</option>`).join("")}</select></label>
          <label>联系电话<input id="enrollPhone" value="137****0000" /></label>
        </div>
      `,
      () => {
        state.enrollments.unshift({
          id: Date.now(),
          name: document.querySelector("#enrollName").value,
          course: document.querySelector("#enrollCourse").value,
          role: "学生",
          phone: document.querySelector("#enrollPhone").value,
          status: "pending",
        });
        showToast("报名已提交，等待人工审核");
        render();
      },
    );
    return;
  }

  if (action === "approve" || action === "reject") {
    const item = state.enrollments.find((enrollment) => enrollment.id === Number(data.id));
    item.status = action === "approve" ? "approved" : "rejected";
    const notice = `${item.name} 的报名已${action === "approve" ? "通过" : "拒绝"}，站内通知和短信模拟已发送。`;
    state.notices.unshift(notice);
    showToast(notice);
    render();
    return;
  }

  if (action === "update-schedule") {
    state.notices.unshift("日程已更新：集合地点改为科技中心东门，短信模拟已发送。");
    showToast("日程变更通知已发送");
    render();
    return;
  }

  if (action === "offline-course") {
    const item = state.courses.find((course) => course.id === Number(data.id));
    if (item) {
      item.status = "已下线";
      showToast(`${item.title} 已下线`);
      render();
    }
    return;
  }

  if (action === "submit-feedback") {
    state.feedback.unshift({
      name: document.querySelector("#feedbackName").value,
      score: Number(document.querySelector("#feedbackScore").value),
      text: document.querySelector("#feedbackText").value,
    });
    showToast("反馈已提交");
    render();
    return;
  }

  if (action === "upload-resource") {
    state.resources.unshift({ title: "新上传研学资料.pdf", type: "文档", size: "860 KB" });
    showToast("资源已上传");
    render();
    return;
  }

  if (action === "submit-post" || action === "new-post") {
    const title = document.querySelector("#postTitle")?.value || "新的研学讨论";
    state.posts.unshift({ author: "学生 新同学", title, comments: [] });
    showToast("帖子已发布");
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

  if (action === "scan-checkin") {
    const item = state.checkins.find((checkin) => checkin.status !== "done");
    if (item) {
      item.status = "done";
      item.time = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
      showToast(`${item.name} 扫码签到成功`);
      render();
    } else {
      showToast("所有学生都已签到");
    }
    return;
  }

  if (action === "generate-cert") {
    showToast("证书已生成，可在真实版本中下载 PDF");
    return;
  }

  if (action === "select-course") {
    state.selectedCourseId = Number(data.id);
    setActive("courseDetail");
    return;
  }

  if (action === "back-courses") {
    setActive("courses");
    return;
  }

  if (action === "enroll-from-course") {
    setActive("enrollment");
    window.setTimeout(() => document.querySelector('[data-action="enroll"]')?.click(), 0);
    return;
  }

  showToast("此操作已完成模拟反馈");
}

document.querySelector("#quickEnrollButton").addEventListener("click", () => {
  setActive("enrollment");
  window.setTimeout(() => document.querySelector('[data-action="enroll"]')?.click(), 0);
});

document.querySelector("#notifyButton").addEventListener("click", () => {
  openModal("通知中心", `<div class="list">${state.notices.map((notice) => `<div class="list-item">${notice}</div>`).join("")}</div>`);
});

render();
