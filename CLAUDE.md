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

## 多机同步：功能做完就提交并推送

我在三台电脑上轮流玩／开发，靠 GitHub 同步（`origin/main`）。
**每完成一个功能（或修完一个 bug）并验证通过后，主动提交并推送，不用每次问我。**

### 每次的固定动作

```bash
git add <改动的源码文件>   # 明确列出，别用 git add -A
git commit -m "..."      # 中文提交信息，说清楚改了什么、为什么
git pull --rebase        # 再拉：把另一台的提交接到自己下面，避免分叉
git push origin main
```

> 顺序别反：`git pull --rebase` 在工作区有未提交改动时会直接拒绝
> （`cannot pull with rebase: You have unstaged changes`），所以必须**先 commit 再 pull**。

**dev server 开着时 `save-backup.json` 会被反复写入**，刚提交完几百毫秒又变脏，
`pull --rebase` 照样拒绝。所以拉取那一步要把它先隔离出去：

```bash
git stash push -q -- save-backup.json   # 没变脏时这条会空转，无害
git pull --rebase
git stash pop                            # 没 stash 到东西就会报错，忽略即可
```

### 提交怎么切分

- **代码和存档分两个提交**，方便以后翻历史时区分「功能改动」和「进度快照」：
  - `feat:` / `fix:` —— 只含 `src/`、`index.html` 等源码
  - `chore: 存档备份 —— 金币 X，成就 Y/Z` —— 只含 `save-backup.json`
- 存档不必每次功能都提交；玩到一段落或我说「备份」时再提。

### 什么情况下不要推

- 控制台有报错、或改动根本没验证过 → 先修好再说
- 功能只做了一半 → 攒着，别推半成品
- 我明确说了「先别提交」

### `save-backup.json` 的冲突风险（已经踩过一次）

这是个「谁后写谁覆盖」的单文件，三台机器轮着玩迟早撞。规矩：

- **开玩前先 `git pull`，收工后立刻 `git push`**，任何时候只允许一台处于「玩过但没推」的状态。
- `git pull` 之前**先停掉 dev server**。否则游戏在后台自动存档，会把刚拉下来的新进度覆盖回旧的。
- 真撞上冲突时，**先把两边存档的 `coins`/`achievements`/解锁地块数摊出来比对**，确认哪份更新，再决定取舍——绝不闭眼 `--ours` / `--theirs`。
- 丢弃任何一份存档前，先复制一份到临时目录留底。

### 认证

推送凭据已存在 Windows 凭据管理器（`git:https://github.com`），本仓库的 `user.name` / `user.email`
也已写进 `.git/config`（`--local`，不影响其他项目）。正常情况下 `git push` 不需要再登录。

## Vite 自定义中间件（`vite.config.js`）

- `POST /__shot` —— 保存画布截图到 `debug-shot.png`，便于无头环境检查画面。
- `GET/POST /__save` —— 存档落盘与读取，覆盖前自动轮换历史副本。
