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

## 成就：调高目标后，够不着的要先收回

**如果改动把某条成就的目标调大了（比如新增作物让「集齐 N 种」的 N 变大），
而玩家当前进度够不着，必须把这条成就先变回未解锁状态。**
顶着「已达成」却只有 6/8 是假的，玩家会当场发现。达标后它会自动再亮。

已经实现在 `game.revokeUnearned()`，读档时自动跑，规则是：

- 成就记录存 `{ at, max }`，`max` 是**达成当时**的目标值；靠它认出「目标被调大」
- 只收回 `monotonic: true` 的成就（`config.js` 里的 `MONOTONIC_ACHIEVEMENTS`）——
  这些进度只增不减（解锁数、集齐数、收录数、升级档位），够不着就必然是目标变了
- **金币、槽位占用、装饰/展台摆放数这类会正常回落，绝不能收回**：
  玩家当时确实做到过，钱花光了不该掉「万元户」
- 连锁：收回一条会让「园艺大师」这种统计型成就的进度跟着掉，所以循环判定到稳定

> 踩过的坑：第一版没区分单调与瞬时，老存档没记 `max` 就一律按「现在够不够」重判，
> 结果把「灶火通明」「满罩培养」这些瞬时成就一起扒了 5 个。加作物前先想想会不会顶到某条成就。

## 验证新功能：绝不拿玩家正在玩的那局当试验台

**我可能正开着浏览器在玩。** 验证功能时不许碰活着的存档，具体三条：

- **永远不要把 `game.save` 换成空函数**。哪怕动机是「别让测试写脏存档」——
  真实后果是玩家这段时间的操作全部不落盘，存档看着没变其实是冻住的，重开就掉进度。
  这比写脏严重得多，因为它**没有任何可见症状**。
- **不要为了截图往真存档里塞东西**（凭空造的酒/鱼/作物、改 `coins`、改 `dayCount`）。
  玩家会当场看见，而且事后按 key 删也未必删干净——他可能已经卖了、或者摆进展台了。
- **要测就另开一份存档**：换 localStorage key（`farming-mini-game-save-v1` → `...-test`）
  跑一个干净实例，测完直接删掉。真存档一个字节都不碰。

只读的验证（`getBoundingClientRect`、`getComputedStyle`、读 `game.xxx`、截图）随便做。
**分界线是「会不会改到 game 的状态或存档写入」**，会就另起一份。

> 踩过的坑：做酒庄时为了截图，把 `game.save` 停了、往酒窖塞了 4 瓶假酒。
> 假酒玩家收进背包了（事后按 key 删掉的），停 save 那段的操作则是真丢了。

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
`pull --rebase` 照样拒绝。用 git 内置的 `--autostash`，别手动 stash：

```bash
git pull --rebase --autostash
```

> 手动 `git stash push -- save-backup.json` → `pull` → `stash pop` 这套**不可靠**：
> 两条命令之间存档又被写脏，pull 照样报 unstaged changes，pop 还会撞车留下垃圾 stash。
> 实测踩过两次。`--autostash` 是 git 进程内完成的，窗口小得多。

真要万无一失，就在拉取前**把存档也提交掉**（工作区干净就没有 stash 的事），
或者干脆先停 dev server。

### stash 冲突了怎么办

`stash pop` 报 `Your local changes would be overwritten` 时，**别急着 pop**。
先把三份摊出来比：

```bash
git show stash@{0}:save-backup.json | ConvertFrom-Json   # stash 里的
Get-Content save-backup.json | ConvertFrom-Json          # 工作区的
git show origin/main:save-backup.json | ConvertFrom-Json # 远程的
```

**工作区那份通常才是对的**——它跟浏览器 localStorage 同步，
而 stash 往往是几分钟前的旧快照。强行 pop 会把旧存档写回硬盘，
反而和 localStorage 打架。确认后 `git stash drop` 即可（丢弃前先复制一份留底）。

### 先查状态，别空跑一遍

我说「备份 / 推送」时，**先看清楚到底有没有东西要推**：

```bash
git status --short                        # 工作区有改动吗
git fetch origin && git rev-list --count origin/main..main   # 本地领先几个提交
```

- 工作区干净 **且** 领先 0 → **直接告诉我「已经是最新的，无需推送」**，不要走一遍空的 commit/push
- 只有 `save-backup.json` 变了 → 只提交存档那一个，别把代码也捎上（它本来就已经推过了）
- 分别说清楚**代码**和**存档**各自的状态，我要的是结论不是过程

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
- **`git pull` 之前必须先停掉 dev server**（这是流程第一步，不是可选项）。
  否则游戏在后台自动存档，会把刚拉下来的新进度覆盖回旧的——已经真实发生过一次。
- **拉到新存档后，要先把它灌进 localStorage 再让页面重载**：

  ```js
  const backup = await fetch('/__save').then(r => r.json());
  localStorage.setItem('farming-mini-game-save-v1', JSON.stringify(backup));
  location.reload();
  ```

  顺序反了（先重载再改）没用：新 game 实例一初始化就会拿旧 localStorage 覆盖硬盘。
  也别指望 `main.js` 的自动恢复兜底——它的判据是 `backup.savedAt > local.savedAt`，
  而本地挂机会把时间戳顶得更晚。**时间戳新 ≠ 进度多**，这是那套机制的盲区。
- 真撞上冲突时，**先把两边存档的 `coins`/`achievements`/解锁地块数摊出来比对**，确认哪份更新，再决定取舍——绝不闭眼 `--ours` / `--theirs`。
- 丢弃任何一份存档前，先复制一份到临时目录留底。

### 认证

推送凭据已存在 Windows 凭据管理器（`git:https://github.com`），本仓库的 `user.name` / `user.email`
也已写进 `.git/config`（`--local`，不影响其他项目）。正常情况下 `git push` 不需要再登录。

## Vite 自定义中间件（`vite.config.js`）

- `POST /__shot` —— 保存画布截图到 `debug-shot.png`，便于无头环境检查画面。
- `GET/POST /__save` —— 存档落盘与读取，覆盖前自动轮换历史副本。
