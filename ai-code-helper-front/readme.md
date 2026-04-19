## 实现要点

会话 ID：进入页面时用 createRoomId() 生成整数 roomId，作为后端的 memoryId，并在页头展示「会话 #xxx」。
布局：AI 气泡在左（row-ai），用户在右（row-user），下方为多行输入 + 发送。
流式：GET 请求与 EventSource 一致；用 getChatSseUrl(roomId, text)（内部 axios.create + getUri）生成
.../api/ai/chat?memoryId=...&userMsg=...（userMsg 由 Axios 编码）。

## 文件结构（核心）

src/api.ts：Axios 实例、getChatSseUrl
src/App.tsx：消息列表、输入、EventSource 流式追加
vite.config.ts：/api → 8081 代理
若你实际网关路径不是 /api/ai/chat（例如没有 /api 前缀），把 **VITE_API_BASE** 或 **getApiBase**() 改成与后端一致即可。

## 项目运行

Windows 下常用命令
在 PowerShell 中：

1.Set-Location "d:\workSpace\study\ai-code-helper\ai-code-helper-front"
2.npm install --registry https://registry.npmjs.org/
3.npm run dev
若你所在环境默认 npm 源不可用，请保留 --registry https://registry.npmjs.org/。

先启动后端 http://localhost:8081，再开前端；若不用 Vite 代理而直接访问 8081，需在 Spring 侧配置 CORS 允许前端源。



## 开发跨域

vite.config.ts 里把 /api 代理到 http://localhost:8081，前端在开发环境默认请求同源 /api，避免浏览器跨域。
生产 / 自定义后端地址

可在项目根目录建 .env，设置
VITE_API_BASE=http://你的主机:端口/api（不要末尾斜杠）。





