#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把多文件 H5 打包成一个自包含的单文件 HTML，便于微信发送/离线打开。"""
import re
from pathlib import Path

BASE = Path(__file__).parent
html = (BASE / "index.html").read_text(encoding="utf-8")
data_js = (BASE / "data.js").read_text(encoding="utf-8")
local_js = (BASE / "local-data.js").read_text(encoding="utf-8")
app_js = (BASE / "app.js").read_text(encoding="utf-8")

# 1) 去掉未使用的 Google Fonts preconnect
html = re.sub(r'\s*<link rel="preconnect" href="https://fonts\.googleapis\.com">', '', html)

# 2) 移除外部 script 引用，改为内联
external = re.compile(
    r'<script src="data\.js"></script>\s*'
    r'<script src="local-data\.js"></script>\s*'
    r'<script src="app\.js"></script>'
)
inline = (
    "<script>\n/* ===== data.js ===== */\n" + data_js +
    "\n/* ===== local-data.js ===== */\n" + local_js +
    "\n/* ===== app.js ===== */\n" + app_js +
    "\n</script>"
)
html, n = external.subn(inline, html)
assert n == 1, f"脚本替换失败，匹配到 {n} 处"

# 3) 确保无残留外部 src/href
assert "src=\"data.js\"" not in html
assert "fonts.googleapis" not in html

# 从 data.js 自动提取版本号，用于生成带版本号的文件名（破缓存：每次更新都是新文件名，
# 避免微信/手机浏览器命中旧文件缓存，导致打开后仍是旧版本）。
m = re.search(r"version:\s*'([^']+)'", data_js)
version = m.group(1) if m else "latest"

# 两个文件都输出：
#  1) 带版本号的文件名——发给使用者用，确保每次都是全新文件、不命中缓存；
#  2) 固定文件名——保留给目录/文档引用，内容同样是最新版。
tagged = BASE / f"安心护航-心理危机应急助手-{version}.html"
tagged.write_text(html, encoding="utf-8")
fixed = BASE / "安心护航-心理危机应急助手.html"
fixed.write_text(html, encoding="utf-8")
print(f"已生成：{tagged}")
print(f"已生成：{fixed}")
print(f"大小：{tagged.stat().st_size / 1024:.1f} KB")
