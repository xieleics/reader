# Intel Mac 本地安装包

此分支可以在 Intel Mac 上原生构建 x64 DMG。当前构建以 macOS 13.3 为最低版本：ONNX Runtime 1.22.0 的 Intel 动态库声明了这一系统要求。实际验证环境为 Intel Mac、macOS 13.7.8；其他系统版本仍需安装验收。

## 构建

安装原生 x64 Node.js 22+、pnpm 10.30.3、Go 1.26.5+ 和 Xcode Command Line Tools。在 Intel Mac 上执行：

```sh
node -p process.arch # 必须为 x64
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm package
```

产物为 `release/Reader-0.5.3-mac-x64.dmg`。版本随项目版本号变化。Intel 本地构建仅生成 DMG，不生成尚无发布渠道使用的更新 ZIP。`pnpm package` 会执行完整构建，并从临时目录验证包内签名、PDF.js、Canvas、真实模型离线推理、Go 服务、SQLite 和 API 鉴权。

ONNX Runtime 固定为 `1.22.0`，不能恢复为 `^1.22.0`：当前上游锁定的 1.30.0 没有 `darwin/x64` 原生库。背景见 https://github.com/microsoft/onnxruntime/issues/27961 。升级时必须检查 npm 包确实包含 Intel 二进制，并重新运行包内真实推理验证。

若 Hugging Face 下载不可用，可以预先获取 `apps/processor/model.json` 指定的权重，然后设置 `READER_BUILD_LAYOUT_MODEL=/绝对路径/模型.onnx`。构建仍检查固定文件大小和 SHA-256，不接受不匹配的权重。

## 安装与更新

打开 DMG，将 Reader 拖到 Applications，再从 Applications 启动。本地包使用 ad-hoc 签名，没有 Apple 公证；若系统阻止首次打开，在“系统设置 → 隐私与安全性”中允许 Reader。

此改动没有创建 GitHub fork，也没有修改上游发布流水线。Intel 适配版不再请求原仓库的更新接口：“关于 Reader”会明确提示手动安装新版 DMG。后续 Intel 版本目前需要重新本地构建并手动安装。

安装后请导入 EPUB 和 PDF，确认目录、翻页、搜索、批注保存，并退出后重新打开验证阅读进度与笔记恢复。AI 功能还需本机已安装且登录的 CLI；构建与离线解析测试不代表 AI 账户测试通过。

## Finder 启动时的 CLI 路径

桌面端会在已有 PATH 之外补充 NVM、fnm、Volta、asdf、mise 和常见用户安装目录，再将统一 PATH 传给 Go 服务和其 CLI 子进程。已有终端 PATH 的优先级保持不变；缺失的版本管理器不会阻止启动。探测不运行 shell，也不读取 CLI 凭据文件。

退出旧 Reader 并安装新版后重新打开，在设置中重新检测。若仍显示 Claude Code 未安装，请先确认终端能够执行 `claude --version`；仅安装桌面聊天应用不会提供 Claude Code CLI。

## 自动复制偏好

“设置 → 阅读 → 自动复制”提供“选中文字后自动复制”和“点击批注后自动复制原文”两个独立选项，默认关闭。选项随阅读设置保存在本地数据库，重启后恢复；旧配置中缺少这两个字段时也按关闭处理。手动复制继续使用原有快捷键和复制按钮。

## 原文 PDF 缩放

顶部阅读工具栏提供原文缩放菜单，不遮挡 PDF 内容。菜单显示当前比例，并支持适合宽度、常用百分比以及加减调整；选择沿用现有阅读设置保存，重新打开应用后继续生效。仅译文模式会隐藏该入口，译文排版不随原文 PDF 缩放改变。
