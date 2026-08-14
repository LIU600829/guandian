const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");

const rootDir = __dirname;
const dataDir = path.join(rootDir, "data");
const storeFile = path.join(dataDir, "interaction-store.json");
const port = Number(process.env.PORT || 4175);

const defaultStore = {
  enrollments: [],
  checkins: [],
  notices: [],
};

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
};

function ensureStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(storeFile)) {
    fs.writeFileSync(storeFile, JSON.stringify(defaultStore, null, 2), "utf8");
  }
}

function readStore() {
  ensureStore();
  try {
    return { ...defaultStore, ...JSON.parse(fs.readFileSync(storeFile, "utf8")) };
  } catch {
    return { ...defaultStore };
  }
}

function writeStore(store) {
  ensureStore();
  fs.writeFileSync(storeFile, JSON.stringify(store, null, 2), "utf8");
}

function getLocalIp() {
  const networks = os.networkInterfaces();
  for (const items of Object.values(networks)) {
    for (const item of items || []) {
      if (item.family === "IPv4" && !item.internal && /^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[01])\./.test(item.address)) {
        return item.address;
      }
    }
  }
  return "localhost";
}

function isPrivateHost(hostname) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
  );
}

function getBaseUrl(request) {
  if (process.env.PUBLIC_BASE_URL) {
    return process.env.PUBLIC_BASE_URL.replace(/\/$/, "");
  }

  const host = request.headers.host || "";
  const hostname = host.split(":")[0];
  if (host && !isPrivateHost(hostname)) {
    const forwardedProto = request.headers["x-forwarded-proto"];
    const proto = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto || "https";
    return `${proto}://${host}`;
  }

  return `http://${getLocalIp()}:${port}`;
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error("Request body too large"));
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function cleanText(value, fallback = "") {
  return String(value || fallback).trim().slice(0, 80);
}

async function handleApi(request, response, pathname) {
  if (request.method === "GET" && pathname === "/health") {
    sendJson(response, 200, { ok: true });
    return true;
  }

  if (request.method === "GET" && pathname === "/api/config") {
    const publicBaseUrl = getBaseUrl(request);
    sendJson(response, 200, {
      publicBaseUrl,
      enrollUrl: `${publicBaseUrl}/mobile/?mode=enroll`,
      checkinUrl: `${publicBaseUrl}/mobile/?mode=checkin`,
      courses: ["太阳能小车实验营", "城市微光观察课", "未来通信与光纤实验"],
    });
    return true;
  }

  if (request.method === "GET" && pathname === "/api/state") {
    sendJson(response, 200, readStore());
    return true;
  }

  if (request.method === "POST" && pathname === "/api/enroll") {
    const body = await readBody(request);
    const store = readStore();
    const enrollment = {
      id: Date.now(),
      name: cleanText(body.name, "未填写姓名"),
      parentName: cleanText(body.parentName),
      course: cleanText(body.course, "太阳能小车实验营"),
      role: cleanText(body.role, "学生"),
      phone: cleanText(body.phone, "未填写电话"),
      school: cleanText(body.school),
      grade: cleanText(body.grade),
      emergencyPhone: cleanText(body.emergencyPhone),
      note: cleanText(body.note),
      status: "pending",
      source: "扫码报名",
      createdAt: new Date().toISOString(),
    };
    store.enrollments.unshift(enrollment);
    store.notices.unshift(`${enrollment.name} 通过二维码提交了报名。`);
    writeStore(store);
    sendJson(response, 201, { ok: true, enrollment });
    return true;
  }

  if (request.method === "POST" && pathname === "/api/checkin") {
    const body = await readBody(request);
    const store = readStore();
    const name = cleanText(body.name, "未填写姓名");
    const course = cleanText(body.course, "太阳能小车实验营");
    const checkin = {
      id: Date.now(),
      name,
      course,
      phone: cleanText(body.phone),
      school: cleanText(body.school),
      grade: cleanText(body.grade),
      status: "done",
      source: "扫码签到",
      time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      createdAt: new Date().toISOString(),
    };
    store.checkins = store.checkins.filter((item) => !(item.name === name && item.course === course));
    store.checkins.unshift(checkin);
    store.notices.unshift(`${checkin.name} 已通过二维码完成签到。`);
    writeStore(store);
    sendJson(response, 201, { ok: true, checkin });
    return true;
  }

  return false;
}

function serveStatic(response, pathname) {
  const safePath = decodeURIComponent(pathname).replace(/\\/g, "/");
  const target = safePath.endsWith("/")
    ? path.join(rootDir, safePath, "index.html")
    : path.join(rootDir, safePath);
  const normalized = path.normalize(target);

  if (!normalized.startsWith(rootDir)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(normalized, (error, content) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }
    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(normalized).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(content);
  });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  try {
    if ((url.pathname.startsWith("/api/") || url.pathname === "/health") && (await handleApi(request, response, url.pathname))) {
      return;
    }
    serveStatic(response, url.pathname === "/" ? "/index.html" : url.pathname);
  } catch (error) {
    sendJson(response, 500, { ok: false, message: error.message });
  }
});

server.listen(port, "0.0.0.0", () => {
  const publicBaseUrl = process.env.PUBLIC_BASE_URL || `http://${getLocalIp()}:${port}`;
  console.log(`光电研学互动服务已启动：`);
  console.log(`电脑管理端：${publicBaseUrl}/backend/`);
  console.log(`手机扫码报名：${publicBaseUrl}/mobile/?mode=enroll`);
  console.log(`手机扫码签到：${publicBaseUrl}/mobile/?mode=checkin`);
});
