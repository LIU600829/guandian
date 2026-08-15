# Cloudflare Workers 发布步骤

这套方案不需要购买域名，发布后使用 Cloudflare 分配的 `workers.dev` 地址。

## 1. 创建 KV

1. 打开 Cloudflare 控制台。
2. 进入 `Workers & Pages`。
3. 打开左侧 `KV`。
4. 点击 `Create namespace`。
5. 名称填写 `guandian-store`，创建完成后保留这个页面。

## 2. 发布 Worker

1. 进入 `Workers & Pages`，点击 `Create application`。
2. 选择连接 GitHub，选择仓库 `LIU600829/guandian`。
3. 选择使用仓库配置文件，项目会读取根目录的 `wrangler.toml`。
4. 点击部署。
5. 在 Worker 的 `Settings > Bindings` 中添加 KV Namespace：
   - Variable name：`STORE`
   - KV namespace：选择刚才创建的 `guandian-store`
6. 保存并重新部署。
7. 在 Worker 的 `Settings > Domains & Routes` 中打开 `workers.dev`。

## 3. 检查地址

把 Cloudflare 显示的 Worker 地址填到浏览器中，在地址后依次检查：

```text
/health
/backend/
/mobile/?mode=enroll
/mobile/?mode=checkin
/mobile/?mode=status
```

`/health` 返回 `"storage":"cloudflare-kv"` 才表示报名和签到会保存到云端。

## 4. 二维码

打开学校管理端 `/backend/`，刷新页面。管理端会自动从 `/api/config` 读取当前固定公网地址，并重新生成报名、签到、状态查询二维码。
