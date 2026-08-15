const DEFAULT_STORE = {
  enrollments: [],
  checkins: [],
  wjxSubmissions: [],
  userNotifications: [],
  notices: [],
};

const COURSES = [
  "\u592a\u9633\u80fd\u5c0f\u8f66\u5b9e\u9a8c\u8425",
  "\u57ce\u5e02\u5fae\u5149\u89c2\u5bdf\u8bfe",
  "\u672a\u6765\u901a\u4fe1\u4e0e\u5149\u7ea4\u5b9e\u9a8c",
];

const STORE_KEY = "interaction-store";

function cloneDefaultStore() {
  return JSON.parse(JSON.stringify(DEFAULT_STORE));
}

function cleanText(value, fallback = "") {
  return String(value ?? fallback).trim().slice(0, 80);
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

async function readStore(env) {
  if (!env.STORE) return cloneDefaultStore();
  const stored = await env.STORE.get(STORE_KEY, "json");
  return stored && typeof stored === "object"
    ? { ...cloneDefaultStore(), ...stored }
    : cloneDefaultStore();
}

async function writeStore(env, store) {
  if (env.STORE) await env.STORE.put(STORE_KEY, JSON.stringify(store));
}

function findNestedValue(source, names) {
  const queue = [source];
  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== "object") continue;
    for (const [key, value] of Object.entries(current)) {
      const normalizedKey = key.toLowerCase();
      if (names.some((name) => normalizedKey.includes(name.toLowerCase()) || key.includes(name))) {
        if (!value || typeof value !== "object") return value;
      }
      if (value && typeof value === "object") queue.push(value);
    }
  }
  return "";
}

function nowId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function publicConfig(request) {
  const baseUrl = new URL(request.url).origin;
  return {
    publicBaseUrl: baseUrl,
    enrollUrl: `${baseUrl}/mobile/?mode=enroll`,
    checkinUrl: `${baseUrl}/mobile/?mode=checkin`,
    statusUrl: `${baseUrl}/mobile/?mode=status`,
    courses: COURSES,
  };
}

function createEnrollment(body, source = "\u626b\u7801\u62a5\u540d") {
  return {
    id: nowId(),
    name: cleanText(body.name, "\u672a\u586b\u5199\u59d3\u540d"),
    parentName: cleanText(body.parentName),
    course: cleanText(body.course, COURSES[0]),
    role: cleanText(body.role, "\u5b66\u751f"),
    phone: cleanText(body.phone, "\u672a\u586b\u5199\u7535\u8bdd"),
    school: cleanText(body.school),
    grade: cleanText(body.grade),
    emergencyPhone: cleanText(body.emergencyPhone),
    note: cleanText(body.note),
    status: "pending",
    source,
    createdAt: new Date().toISOString(),
  };
}

function importEnrollment(row, index) {
  return {
    id: nowId() + index,
    name: cleanText(row.name || row["\u5b66\u751f\u59d3\u540d"] || row["\u59d3\u540d"], "\u672a\u586b\u5199\u59d3\u540d"),
    parentName: cleanText(row.parentName || row["\u5bb6\u957f\u59d3\u540d"]),
    course: cleanText(row.course || row["\u62a5\u540d\u8bfe\u7a0b"] || row["\u8bfe\u7a0b"], "\u95ee\u5377\u5bfc\u5165"),
    role: "\u5b66\u751f",
    phone: cleanText(
      row.phone || row["\u8054\u7cfb\u7535\u8bdd"] || row["\u624b\u673a\u53f7"] || row["\u624b\u673a"] || row["\u7535\u8bdd"],
      "\u672a\u586b\u5199\u7535\u8bdd",
    ),
    school: cleanText(row.school || row["\u6240\u5728\u5b66\u6821"] || row["\u5b66\u6821"]),
    grade: cleanText(row.grade || row["\u5e74\u7ea7\u73ed\u7ea7"] || row["\u5e74\u7ea7"] || row["\u73ed\u7ea7"]),
    emergencyPhone: cleanText(row.emergencyPhone || row["\u7d27\u6025\u8054\u7cfb\u4eba"] || row["\u5907\u7528\u7535\u8bdd"]),
    note: cleanText(row.note || row["\u8865\u5145\u8bf4\u660e"] || row["\u5907\u6ce8"]),
    status: "pending",
    source: "\u95ee\u5377\u661f\u5bfc\u5165",
    createdAt: new Date().toISOString(),
  };
}

function applyCommand(store, command, body) {
  if (command === "enroll") {
    const enrollment = createEnrollment(body);
    store.enrollments.unshift(enrollment);
    store.notices.unshift(`${enrollment.name} \u901a\u8fc7\u4e8c\u7ef4\u7801\u63d0\u4ea4\u4e86\u62a5\u540d\u3002`);
    return { status: 201, payload: { ok: true, enrollment } };
  }

  if (command === "checkin") {
    const name = cleanText(body.name, "\u672a\u586b\u5199\u59d3\u540d");
    const course = cleanText(body.course, COURSES[0]);
    const checkin = {
      id: nowId(),
      name,
      course,
      phone: cleanText(body.phone),
      school: cleanText(body.school),
      grade: cleanText(body.grade),
      status: "done",
      source: "\u626b\u7801\u7b7e\u5230",
      time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      createdAt: new Date().toISOString(),
    };
    store.checkins = store.checkins.filter((item) => !(item.name === name && item.course === course));
    store.checkins.unshift(checkin);
    store.notices.unshift(`${checkin.name} \u5df2\u901a\u8fc7\u4e8c\u7ef4\u7801\u5b8c\u6210\u7b7e\u5230\u3002`);
    return { status: 201, payload: { ok: true, checkin } };
  }

  if (command === "wjx-webhook") {
    const enrollment = createEnrollment({
      name: findNestedValue(body, ["\u5b66\u751f\u59d3\u540d", "\u59d3\u540d", "name"]),
      parentName: findNestedValue(body, ["\u5bb6\u957f\u59d3\u540d", "parent"]),
      course: findNestedValue(body, ["\u8bfe\u7a0b", "course"]),
      phone: findNestedValue(body, ["\u8054\u7cfb\u7535\u8bdd", "\u624b\u673a", "\u7535\u8bdd", "phone"]),
      school: findNestedValue(body, ["\u5b66\u6821", "school"]),
      grade: findNestedValue(body, ["\u5e74\u7ea7", "\u73ed\u7ea7", "grade"]),
      emergencyPhone: findNestedValue(body, ["\u7d27\u6025\u8054\u7cfb\u4eba", "\u5907\u7528\u7535\u8bdd", "emergency"]),
      note: findNestedValue(body, ["\u5907\u6ce8", "\u8865\u5145\u8bf4\u660e", "note"]),
      role: "\u5b66\u751f",
    }, "\u95ee\u5377\u661f");
    store.wjxSubmissions.unshift({ id: enrollment.id, raw: body, createdAt: enrollment.createdAt });
    store.enrollments.unshift(enrollment);
    store.notices.unshift(`${enrollment.name} \u901a\u8fc7\u95ee\u5377\u661f\u63d0\u4ea4\u4e86\u62a5\u540d\u3002`);
    return { status: 201, payload: { ok: true, enrollment } };
  }

  if (command === "import-enrollments") {
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const imported = rows.map(importEnrollment);
    store.enrollments.unshift(...imported);
    store.notices.unshift(`\u5df2\u5bfc\u5165 ${imported.length} \u6761\u62a5\u540d\u3002`);
    return { status: 201, payload: { ok: true, imported } };
  }

  if (command === "enrollment-status") {
    const status = cleanText(body.status, "pending");
    const id = String(body.id || "");
    let enrollment = store.enrollments.find((item) => String(item.id) === id);

    if (enrollment) {
      enrollment.status = status;
      enrollment.reviewedAt = new Date().toISOString();
    } else if (body.enrollment) {
      enrollment = {
        ...body.enrollment,
        id: body.enrollment.id || nowId(),
        status,
        reviewedAt: new Date().toISOString(),
      };
      store.enrollments.unshift(enrollment);
    }

    if (!enrollment) {
      return { status: 404, payload: { ok: false, message: "\u672a\u627e\u5230\u62a5\u540d\u8bb0\u5f55" } };
    }

    const resultText = status === "approved" ? "\u901a\u8fc7" : "\u62d2\u7edd";
    const message = `${enrollment.name}\uff0c\u4f60\u62a5\u540d\u7684\u300c${enrollment.course}\u300d\u5df2\u5ba1\u6838${resultText}\u3002`;
    store.userNotifications.unshift({
      id: nowId(),
      phone: enrollment.phone,
      name: enrollment.name,
      course: enrollment.course,
      status,
      message,
      createdAt: new Date().toISOString(),
      channel: "\u7ad9\u5185\u901a\u77e5",
    });
    enrollment.notifiedAt = new Date().toISOString();
    store.notices.unshift(`${enrollment.name} \u7684\u62a5\u540d\u5df2${resultText}\uff0c\u7528\u6237\u901a\u77e5\u5df2\u751f\u6210\u3002`);
    return { status: 200, payload: { ok: true, enrollment } };
  }

  return { status: 400, payload: { ok: false, message: "Unsupported command" } };
}

async function handleApi(request, env, url) {
  if (request.method === "GET" && url.pathname === "/health") {
    return json({ ok: true, storage: env.STORE ? "cloudflare-kv" : "memory-fallback" });
  }

  if (request.method === "GET" && url.pathname === "/api/config") {
    return json(publicConfig(request));
  }

  if (request.method === "GET" && url.pathname === "/api/state") {
    return json(await readStore(env));
  }

  if (request.method === "GET" && url.pathname === "/api/my-notifications") {
    const phone = cleanText(url.searchParams.get("phone"));
    const store = await readStore(env);
    return json({
      ok: true,
      enrollments: store.enrollments.filter((item) => item.phone === phone),
      notifications: store.userNotifications.filter((item) => item.phone === phone),
    });
  }

  const commands = {
    "/api/enroll": "enroll",
    "/api/checkin": "checkin",
    "/api/wjx-webhook": "wjx-webhook",
    "/api/import-enrollments": "import-enrollments",
    "/api/enrollment-status": "enrollment-status",
  };
  const command = commands[url.pathname];
  if (request.method === "POST" && command) {
    const body = await readJson(request);
    const store = await readStore(env);
    const result = applyCommand(store, command, body);
    if (result.status < 400) await writeStore(env, store);
    return json(result.payload, result.status);
  }

  return json({ ok: false, message: "Not found" }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/health" || url.pathname.startsWith("/api/")) {
      return handleApi(request, env, url);
    }
    return env.ASSETS.fetch(request);
  },
};
