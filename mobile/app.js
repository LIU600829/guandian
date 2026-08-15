const params = new URLSearchParams(location.search);
const requestedMode = params.get("mode");
const mode = requestedMode === "checkin" || requestedMode === "status" ? requestedMode : "enroll";
const courseInput = document.querySelector("#courseInput");
const resultBox = document.querySelector("#resultBox");
const form = document.querySelector("#mobileForm");

function setText(selector, text) {
  document.querySelector(selector).textContent = text;
}

function showResult(message, ok = true) {
  resultBox.style.display = "block";
  resultBox.textContent = message;
  resultBox.style.color = ok ? "#0f7a4b" : "#b4233b";
}

async function loadConfig() {
  try {
    const response = await fetch("/api/config", { cache: "no-store" });
    const config = await response.json();
    courseInput.innerHTML = config.courses.map((course) => `<option>${course}</option>`).join("");
  } catch {
    courseInput.innerHTML = ["太阳能小车实验营", "城市微光观察课", "未来通信与光纤实验"].map((course) => `<option>${course}</option>`).join("");
    showResult("当前没有连接到互动服务，请确认电脑端服务正在运行。", false);
  }
}

function setupMode() {
  if (mode === "status") {
    setText("#modeName", "报名状态查询");
    setText("#pageTitle", "查询报名状态");
    setText("#pageIntro", "输入报名时填写的联系电话，查看审核结果和课程通知。");
    setText("#submitButton", "查询状态");
    document.querySelector("#nameInput").closest("label").style.display = "none";
    document.querySelector("#parentField").style.display = "none";
    document.querySelector("#courseInput").closest("label").style.display = "none";
    document.querySelector("#schoolField").style.display = "none";
    document.querySelector("#gradeField").style.display = "none";
    document.querySelector("#emergencyField").style.display = "none";
    document.querySelector("#noteField").style.display = "none";
    return;
  }

  if (mode === "checkin") {
    setText("#modeName", "现场签到");
    setText("#pageTitle", "扫码签到");
    setText("#pageIntro", "填写学生姓名和联系电话后，学校管理端会自动看到签到记录。");
    setText("#submitButton", "确认签到");
    document.querySelector("#parentField").style.display = "none";
    document.querySelector("#schoolField").style.display = "none";
    document.querySelector("#gradeField").style.display = "none";
    document.querySelector("#emergencyField").style.display = "none";
    document.querySelector("#noteField").style.display = "none";
    return;
  }
  setText("#modeName", "扫码报名");
  setText("#pageTitle", "研学报名");
  setText("#pageIntro", "填写信息后，学校管理端会自动看到新的报名记录。");
  setText("#submitButton", "提交报名");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (mode === "status") {
    const phone = document.querySelector("#phoneInput").value.trim();
    try {
      const response = await fetch(`/api/my-notifications?phone=${encodeURIComponent(phone)}`, { cache: "no-store" });
      if (!response.ok) throw new Error("查询失败");
      const result = await response.json();
      const enrollmentMarkup = result.enrollments.map((item) => {
        const statusText = { pending: "待审核", approved: "已通过", rejected: "已拒绝" }[item.status] || item.status;
        return `课程：${item.course}；状态：${statusText}`;
      }).join("\n");
      const noticeMarkup = result.notifications.map((item) => item.message).join("\n");
      showResult(enrollmentMarkup || noticeMarkup ? `${enrollmentMarkup}\n${noticeMarkup}`.trim() : "暂未查询到报名信息，请确认手机号是否填写一致。", Boolean(enrollmentMarkup || noticeMarkup));
    } catch {
      showResult("查询失败，请稍后再试。", false);
    }
    return;
  }

  const payload = {
    name: document.querySelector("#nameInput").value,
    parentName: document.querySelector("#parentInput").value,
    phone: document.querySelector("#phoneInput").value,
    course: courseInput.value,
    school: document.querySelector("#schoolInput").value,
    grade: document.querySelector("#gradeInput").value,
    emergencyPhone: document.querySelector("#emergencyInput").value,
    role: "学生",
    note: document.querySelector("#noteInput").value,
  };

  try {
    const response = await fetch(mode === "checkin" ? "/api/checkin" : "/api/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("提交失败");
    showResult(mode === "checkin" ? "签到成功，学校管理端已经收到。" : "报名提交成功，请等待学校审核。");
    form.reset();
  } catch {
    showResult("提交失败，请确认手机和电脑在同一个 Wi-Fi，并且电脑服务没有关闭。", false);
  }
});

setupMode();
loadConfig();
