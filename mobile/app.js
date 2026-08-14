const params = new URLSearchParams(location.search);
const mode = params.get("mode") === "checkin" ? "checkin" : "enroll";
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
