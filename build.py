#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把多文件 H5 打包成一个自包含的单文件 HTML，便于微信发送/离线打开。

两种模式：
  python3 build.py            本地分发版——读 contact.txt（不入库）注入真实电话/微信，
                             生成带联系方式的成品，用于微信发给使用者。
  python3 build.py --public   公开版——不注入联系方式（页面自动改显 GitHub 引导），
                             用于提交到公开仓库 / GitHub Pages，避免手机号被爬虫抓取。
"""
import re
import sys
from pathlib import Path

BASE = Path(__file__).parent
PUBLIC = "--public" in sys.argv

html = (BASE / "index.html").read_text(encoding="utf-8")
data_js = (BASE / "data.js").read_text(encoding="utf-8")
local_js = (BASE / "local-data.js").read_text(encoding="utf-8")
app_js = (BASE / "app.js").read_text(encoding="utf-8")

# 联系方式注入：源码里用 __PHONE__/__WECHAT__ 占位，真实号码只在本地 contact.txt。
# 公开版一律注入空字符串，源码与产物都不含真实电话。
if PUBLIC:
    phone = wechat = ""
else:
    contact_file = BASE / "contact.txt"
    phone = wechat = ""
    if contact_file.exists():
        lines = [ln.strip() for ln in contact_file.read_text(encoding="utf-8").splitlines()
                 if ln.strip() and not ln.strip().startswith("#")]
        if lines:
            phone = lines[0]
            wechat = lines[1] if len(lines) > 1 else phone
data_js = data_js.replace("'__PHONE__'", f"'{phone}'").replace("'__WECHAT__'", f"'{wechat}'")

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

# 输出文件：
#  本地版（默认）——带版本号文件名发微信（破缓存）+ 固定文件名；都是带联系方式的分发版，git 忽略。
#  公开版（--public）——固定文件名“公开版”，入库 + GitHub Pages，不含真实电话。
if PUBLIC:
    out = BASE / "安心护航-心理危机应急助手-公开版.html"
    out.write_text(html, encoding="utf-8")
    # 同步到 docs/index.html 作为 GitHub Pages 在线入口
    docs = BASE / "docs"
    docs.mkdir(exist_ok=True)
    (docs / "index.html").write_text(html, encoding="utf-8")
    print(f"[公开版·无联系方式] 已生成：{out}")
    print(f"[在线入口] 已同步：{docs / 'index.html'}")
else:
    tagged = BASE / f"安心护航-心理危机应急助手-{version}.html"
    tagged.write_text(html, encoding="utf-8")
    fixed = BASE / "安心护航-心理危机应急助手.html"
    fixed.write_text(html, encoding="utf-8")
    print(f"[本地分发版·含联系方式] 已生成：{tagged}")
    print(f"已生成：{fixed}")
print(f"大小：{out.stat().st_size / 1024:.1f} KB" if PUBLIC else f"大小：{tagged.stat().st_size / 1024:.1f} KB")
