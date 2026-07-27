# CLAUDE.md

本文件为 Claude Code 提供项目上下文与协作约定。

## 语言偏好 / Language Preference

**始终使用简体中文与我交流。** 所有回复、解释、提交信息、代码注释均使用中文（代码标识符保持英文）。

## 项目简介

**手提小菜园 (Tiny Garden)** —— 一款 2.5D 低模玩具盒风格的种田经营游戏。核心特色：**所有 3D 模型、音乐、图形全部由代码程序化生成**，不依赖任何美术或音频素材文件。

- 渲染：Three.js
- 构建：Vite
- 存档：localStorage + 开发服务器落盘备份（`save-backup.json`，`saves/` 保留最近 24 份历史副本）

## 常用命令

```bash
npm install     # 安装依赖
npm run dev     # 启动开发服务器，访问 http://localhost:5173
npm run build   # 生产构建
npm run preview # 预览构建产物
```

> 双击 `keep-alive.cmd` 可守护开发服务器，停了会自动重启。

## 代码结构（`src/`）

| 文件 | 职责 |
|------|------|
| `main.js` | 入口：装配场景、Game、UI，处理拾取与交互 |
| `config.js` | **所有数值表集中于此**，调平衡只改这一个文件 |
| `game.js` | 游戏核心逻辑与状态机 |
| `meshes.js` | **全部 3D 模型的程序化生成**（最大文件） |
| `ui.js` | 界面与面板 |
| `music.js` | Web Audio 实时合成的背景音乐 |
| `scene.js` | Three.js 场景、相机、光照、控制器 |
| `watchdog.js` | 开发期存档看门狗 |
| `style.css` | 样式 |

## 关键约定

- **调整游戏平衡** → 只改 `src/config.js`，不要在业务逻辑里散落魔法数字。
- **新增/修改 3D 模型** → 集中在 `src/meshes.js`，坚持程序化生成，**不引入外部素材文件**。
- **存档兼容** → 修改存档结构时注意向后兼容，`save-backup.json` 是硬盘保险箱。
- 保持现有中文注释风格与命名习惯。

## Vite 自定义中间件（`vite.config.js`）

- `POST /__shot` —— 保存画布截图到 `debug-shot.png`，便于无头环境检查画面。
- `GET/POST /__save` —— 存档落盘与读取，覆盖前自动轮换历史副本。
