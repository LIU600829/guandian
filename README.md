# 光电研学软件原型

这是一个研学软件原型，当前拆分为三个入口：

- `index.html`：入口选择页
- `frontend/`：家长 / 学生端
- `backend/`：学校管理端
- `mobile/`：手机扫码报名 / 签到页面

## 学校管理端扫码互动

为了让“手机扫码后，学校管理端能看到报名和签到信息”，项目新增了一个本地互动服务：

- `server.js`：本地互动服务，负责提供页面和接收手机提交的数据
- `data/interaction-store.json`：扫码报名和扫码签到的数据文件

启动方式：

```bash
node server.js
```

启动后会显示三个地址：

- 电脑管理端：`http://电脑局域网IP:4175/backend/`
- 手机扫码报名：`http://电脑局域网IP:4175/mobile/?mode=enroll`
- 手机扫码签到：`http://电脑局域网IP:4175/mobile/?mode=checkin`

如果只用本地地址，手机和电脑需要连接同一个 Wi-Fi。若希望任意网络的手机都能扫码提交，需要给 `server.js` 配一个公网地址，例如公网隧道或云服务器地址：

```bash
PUBLIC_BASE_URL=https://你的公网地址 node server.js
```

学校管理端会自动生成报名二维码和签到二维码，并每 3 秒刷新一次扫码数据。

## GitHub Pages 静态入口

公网静态访问地址：

- 总入口：https://liu600829.github.io/guandian/
- 家长 / 学生端：https://liu600829.github.io/guandian/frontend/
- 学校管理端：https://liu600829.github.io/guandian/backend/

注意：GitHub Pages 只能展示静态页面，不能单独接收外部手机提交的数据。扫码报名和签到这种真实互动，需要运行 `server.js` 并保持电脑在线，或者后续接入云数据库 / 云服务器。

## 固定公网部署

临时隧道地址会自动失效，不适合正式给家长扫码。项目已补充：

- `package.json`：云服务器启动配置
- `render.yaml`：Render 一键部署配置

部署到 Render、Railway、Fly.io 等云平台后，可以得到固定公网地址，例如：

- 学校管理端：`https://你的域名/backend/`
- 报名问卷：`https://你的域名/mobile/?mode=enroll`
- 扫码签到：`https://你的域名/mobile/?mode=checkin`
