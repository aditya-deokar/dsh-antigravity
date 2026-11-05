window.__ModuleLoader__.load({
  id: "dsh-antigravity",
  factory(require) {
    const React = require("react");
    const { useCallback, useEffect, useMemo, useRef, useState } = React;

    const STYLE_ID = "dsh-antigravity-settings-style";
    const API = "/antigravity/api";
    const NS = "dsh-antigravity";

    // A neutral orbit mark keeps the plugin visually distinct from the upstream
    // project while still reading as "Antigravity" in the sidebar.
    const NAV_ICON_MARKUP =
      '<circle cx="16" cy="16" r="10.5" fill="none" stroke="currentColor" stroke-width="1.7" opacity="0.45"/>' +
      '<path d="M7.5 23.2c5.4-1.8 7.6-7.1 8.5-14.4 1.9 7.3 4.6 11.2 9.5 12.9" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="16" cy="16" r="2.2" fill="currentColor"/>';

    const zh = {
      title: "Antigravity",
      pageDesc: "使用 Google 账号登录，在 DSH 中调用 Antigravity 模型。凭据仅保存在本机 DSH 目录。",
      currentAccount: "当前账号",
      login: "登录",
      loggingIn: "登录中...",
      refresh: "刷新",
      refreshing: "刷新中...",
      logout: "退出",
      loading: "加载中...",
      notSignedIn: "未登录",
      notSignedInDesc: "点击“登录”后会在浏览器中完成 Google OAuth。登录成功后，这里会显示账号和共享额度。",
      noQuotaDesc: "暂无额度数据，点击“刷新”获取。",
      fetchingQuota: "正在获取额度...",
      quota: "额度",
      resetPrefix: "重置: {time}",
      resetUnavailable: "重置: n/a",
      resetNow: "即将重置",
      timeDayHour: "{days}天 {hours}时",
      timeHourMin: "{hours}小时 {minutes}分",
      timeMin: "{minutes}分",
      updatedAt: "更新时间：{time}",
      modelSelector: "模型选择",
      modelSelectorDesc: "勾选后，模型会出现在 DSH 的 Antigravity 模型列表中。",
      selectAll: "全选",
      unselectAll: "全不选",
      loadingModels: "正在加载模型配置...",
      modelSelectorNote: "勾选后自动保存。重新打开模型选择器即可看到最新列表；运行中的会话不受影响。",
      quotaLabel: "额度: {percent}%",
      loginFailed: "登录失败",
      catalogLive: "模型目录：实时",
      catalogStatic: "模型目录：内置（实时目录暂不可用）",
      catalogUnknown: "模型目录：尚未同步",
      diagnostics: "诊断信息",
      diagnosticsHint: "展开后加载本地诊断信息。内容不会包含令牌或完整邮箱。",
      loadDiagnostics: "加载诊断信息",
      refreshDiagnostics: "刷新诊断",
      copyDiagnostics: "复制诊断",
      copied: "已复制",
      copyFailed: "复制失败",
      version: "v{version}",
      accountExpires: "凭据有效至 {time}",
    };

    const en = {
      title: "Antigravity",
      pageDesc: "Sign in with Google to use Antigravity models in DSH. Credentials stay in your local DSH home.",
      currentAccount: "Current account",
      login: "Sign in",
      loggingIn: "Signing in...",
      refresh: "Refresh",
      refreshing: "Refreshing...",
      logout: "Sign out",
      loading: "Loading...",
      notSignedIn: "Not signed in",
      notSignedInDesc: "Choose Sign in to complete Google OAuth in your browser. Your account and shared quotas appear here afterwards.",
      noQuotaDesc: "No quota data yet. Choose Refresh.",
      fetchingQuota: "Fetching quota data...",
      quota: "Quota",
      resetPrefix: "Reset: {time}",
      resetUnavailable: "Reset: n/a",
      resetNow: "resetting soon",
      timeDayHour: "{days}d {hours}h",
      timeHourMin: "{hours}h {minutes}m",
      timeMin: "{minutes}m",
      updatedAt: "Updated at: {time}",
      modelSelector: "Models",
      modelSelectorDesc: "Checked models appear in DSH's Antigravity model list.",
      selectAll: "Select all",
      unselectAll: "Deselect all",
      loadingModels: "Loading model configuration...",
      modelSelectorNote: "Changes save automatically. Reopen the model picker to see the updated list; running sessions are unaffected.",
      quotaLabel: "Quota: {percent}%",
      loginFailed: "Login failed",
      catalogLive: "Model catalog: live",
      catalogStatic: "Model catalog: bundled (live catalog unavailable)",
      catalogUnknown: "Model catalog: not synced yet",
      diagnostics: "Diagnostics",
      diagnosticsHint: "Expand to load local diagnostics. Tokens and full email addresses are never included.",
      loadDiagnostics: "Load diagnostics",
      refreshDiagnostics: "Refresh diagnostics",
      copyDiagnostics: "Copy diagnostics",
      copied: "Copied",
      copyFailed: "Copy failed",
      version: "v{version}",
      accountExpires: "Credentials valid until {time}",
    };

    function createTranslator(ctx) {
      const boundT = ctx && ctx.locale && typeof ctx.locale.bind === "function"
        ? ctx.locale.bind(NS)
        : null;

      return function t(key, params) {
        if (boundT) {
          try {
            const res = boundT(key, params);
            if (res && res !== key && res !== `${NS}.${key}`) return res;
          } catch (_) {
            // Fall through to the bundled locale table.
          }
        }
        const active = ctx && ctx.locale && typeof ctx.locale.getLocale === "function"
          ? ctx.locale.getLocale()?.active
          : null;
        const isZh = active
          ? active.startsWith("zh")
          : typeof navigator !== "undefined" && navigator.language && navigator.language.startsWith("zh");
        const dict = isZh ? zh : en;
        let text = dict[key] || en[key] || zh[key] || key;
        if (params && typeof params === "object") {
          for (const [k, v] of Object.entries(params)) {
            text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
          }
        }
        return text;
      };
    }

    let navCleanup = null;
    let navFrame = 0;

    function patchNavIcon() {
      const spans = document.querySelectorAll("button span");
      for (const span of spans) {
        if (!span.textContent || span.textContent.trim() !== "Antigravity") continue;
        const button = span.closest("button");
        const svg = button && button.querySelector("svg");
        if (!svg) continue;
        svg.setAttribute("viewBox", "0 0 32 32");
        svg.setAttribute("width", "16");
        svg.setAttribute("height", "16");
        svg.setAttribute("fill", "none");
        svg.innerHTML = NAV_ICON_MARKUP;
      }
    }

    function scheduleNavPatch() {
      if (navFrame) return;
      navFrame = window.requestAnimationFrame(() => {
        navFrame = 0;
        patchNavIcon();
      });
    }

    function initNavObserver() {
      if (navCleanup) return navCleanup;
      patchNavIcon();
      const observer = new MutationObserver(scheduleNavPatch);
      observer.observe(document.documentElement || document.body, { childList: true, subtree: true });
      window.addEventListener("click", scheduleNavPatch, true);
      navCleanup = () => {
        observer.disconnect();
        window.removeEventListener("click", scheduleNavPatch, true);
        if (navFrame) {
          window.cancelAnimationFrame(navFrame);
          navFrame = 0;
        }
        navCleanup = null;
      };
      return navCleanup;
    }

    function installStyle() {
      if (document.getElementById(STYLE_ID)) return;
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `
.agp-wrap{box-sizing:border-box;width:100%;max-width:760px;padding:0 0 24px;color:var(--dsw-alias-label-primary)}
.agp-page-head{display:flex;align-items:flex-start;gap:12px}
.agp-logo{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;flex:0 0 auto;border-radius:11px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.agp-page-title{margin:0;color:var(--dsw-alias-label-primary);font-size:20px;font-weight:600;line-height:28px}
.agp-version{margin-left:8px;color:var(--dsw-alias-label-tertiary);font-size:12px;font-weight:400}
.agp-page-desc{margin:4px 0 18px;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px}
.agp-card{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:14px;padding:16px}
.agp-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
.agp-title{display:flex;align-items:center;gap:9px;font-size:15px;font-weight:600;color:var(--dsw-alias-label-primary)}
.agp-dot{width:9px;height:9px;border-radius:999px;flex:0 0 auto;background:var(--dsw-alias-label-dimmed)}
.agp-dot-ok{background:var(--dsw-alias-state-success-primary)}
.agp-dot-busy{background:var(--dsw-alias-state-warn-primary)}
.agp-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.agp-btn{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;height:32px;border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-primary);border-radius:16px;padding:0 14px;font:inherit;font-size:13px;line-height:18px;cursor:pointer}
.agp-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.agp-btn:focus-visible{outline:none;box-shadow:0 0 0 2px var(--dsw-alias-border-l3)}
.agp-btn:disabled{cursor:not-allowed;opacity:.5}
.agp-btn-primary{border-color:transparent;background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground)}
.agp-btn-primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}
.agp-account{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;padding:12px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary)}
.agp-email{display:flex;align-items:center;gap:9px;font-size:14px;font-weight:500;min-width:0}
.agp-email-mark{width:16px;height:12px;border:1.8px solid var(--dsw-alias-label-tertiary);border-radius:3px;position:relative;flex:0 0 auto}
.agp-email-mark:before{content:"";position:absolute;left:1px;right:1px;top:1px;height:7px;border-bottom:1.8px solid var(--dsw-alias-label-tertiary);transform:skewY(-28deg)}
.agp-email-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.agp-account-meta{display:flex;align-items:center;gap:10px;flex:0 0 auto;color:var(--dsw-alias-label-tertiary);font-size:12px}
.agp-badge{display:inline-flex;align-items:center;gap:6px;border-radius:999px;background:transparent;color:var(--dsw-alias-state-business-primary);border:1px solid var(--dsw-alias-border-l3);padding:3px 9px;font-size:11px;font-weight:600;letter-spacing:.04em}
.agp-diamond{width:6px;height:6px;border-radius:1px;background:var(--dsw-alias-state-business-primary);transform:rotate(45deg)}
.agp-quota-title{margin:16px 0 6px;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600}
.agp-quota-group{margin-top:10px;padding:12px 14px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);border-radius:10px}
.agp-group-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:8px;flex-wrap:wrap}
.agp-group-title{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary)}
.agp-group-desc{font-size:12px;color:var(--dsw-alias-label-tertiary)}
.agp-row{padding:8px 0;border-top:1px solid var(--dsw-alias-border-l1)}
.agp-row:first-of-type{border-top:0;padding-top:0}
.agp-rowtop{display:flex;align-items:baseline;justify-content:space-between;gap:12px;color:var(--dsw-alias-label-secondary);font-weight:500;font-size:13px}
.agp-metrics{display:flex;align-items:baseline;gap:10px;white-space:nowrap;color:var(--dsw-alias-label-tertiary);font-size:12px}
.agp-percent{font-size:13px;font-weight:600;color:var(--dsw-alias-state-success-primary)}
.agp-percent-alt{color:var(--dsw-alias-state-business-primary)}
.agp-bar{height:6px;margin-top:6px;border-radius:999px;background:var(--dsw-alias-border-l2);overflow:hidden}
.agp-fill{height:100%;border-radius:999px;background:var(--dsw-alias-state-success-primary)}
.agp-fill-alt{background:var(--dsw-alias-state-business-primary)}
.agp-empty{border:1px dashed var(--dsw-alias-border-l3);border-radius:10px;padding:14px;color:var(--dsw-alias-label-tertiary);background:transparent;font-size:13px;line-height:20px}
.agp-error{margin-top:12px;color:var(--dsw-alias-state-error-primary);background:transparent;border:1px solid var(--dsw-alias-state-error-primary);border-radius:10px;padding:10px 12px;font-size:13px;line-height:20px;white-space:pre-wrap;overflow-wrap:anywhere}
.agp-note{margin-top:12px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.agp-note-row{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
.agp-model-card{margin-top:14px}
.agp-model-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px}
.agp-model-title{font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary)}
.agp-model-desc{margin-top:3px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.agp-mini-actions{display:flex;gap:8px;white-space:nowrap}
.agp-mini-btn{border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;line-height:18px;cursor:pointer;padding:2px 4px;border-radius:6px}
.agp-mini-btn:hover:not(:disabled){color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}
.agp-mini-btn:focus-visible{outline:none;box-shadow:0 0 0 2px var(--dsw-alias-border-l3)}
.agp-mini-btn:disabled{opacity:.5;cursor:not-allowed}
.agp-model-list{border:1px solid var(--dsw-alias-border-l2);border-radius:10px;overflow:hidden}
.agp-model-row{display:flex;align-items:flex-start;gap:10px;padding:11px 14px;background:transparent;border-top:1px solid var(--dsw-alias-border-l1);cursor:pointer}
.agp-model-row:hover{background:var(--dsw-alias-interactive-bg-hover)}
.agp-model-row:first-child{border-top:0}
.agp-check{margin-top:1px;width:16px;height:16px;accent-color:var(--dsw-alias-brand-primary);flex:0 0 auto}
.agp-model-text{min-width:0;flex:1 1 auto}
.agp-model-name{display:block;font-size:13px;font-weight:500;color:var(--dsw-alias-label-primary);line-height:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.agp-model-sub{display:block;margin-top:3px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.agp-diag-card{margin-top:14px}
.agp-diag-summary{cursor:pointer;width:fit-content;color:var(--dsw-alias-label-secondary);font-size:13px;font-weight:500;line-height:20px;border-radius:6px;padding:2px 4px;margin-left:-4px}
.agp-diag-summary:hover{color:var(--dsw-alias-label-primary)}
.agp-diag-summary:focus-visible{outline:none;box-shadow:0 0 0 2px var(--dsw-alias-border-l3)}
.agp-diag-actions{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 8px}
.agp-diag-pre{margin:0;max-height:260px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;background:var(--dsw-alias-markdown-code-block);color:var(--dsw-alias-label-secondary);border-radius:8px;padding:12px;font-family:var(--ds-font-family-code,ui-monospace,monospace);font-size:12px;line-height:18px}
.agp-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@media (prefers-reduced-motion:reduce){.agp-wrap *{scroll-behavior:auto}}
`;
      document.head.append(style);
    }

    async function api(path, options) {
      const response = await fetch(`${API}${path}`, {
        ...options,
        headers: {
          "content-type": "application/json",
          ...(options && options.headers ? options.headers : {}),
        },
      });
      const body = await response.json().catch(() => ({ ok: false, error: "invalid-json" }));
      if (!response.ok || !body.ok) {
        throw new Error(body.error || `HTTP ${response.status}`);
      }
      return body.value;
    }

    function AntigravityIcon({ size = 20, className = "" }) {
      return React.createElement(
        "svg",
        {
          viewBox: "0 0 32 32",
          width: size,
          height: size,
          fill: "none",
          className,
          style: { flexShrink: 0, display: "inline-block", verticalAlign: "middle" },
          xmlns: "http://www.w3.org/2000/svg",
          "aria-hidden": "true",
          focusable: "false",
        },
        React.createElement("circle", {
          cx: "16",
          cy: "16",
          r: "10.5",
          stroke: "currentColor",
          strokeWidth: "1.7",
          opacity: "0.45",
        }),
        React.createElement("path", {
          d: "M7.5 23.2c5.4-1.8 7.6-7.1 8.5-14.4 1.9 7.3 4.6 11.2 9.5 12.9",
          stroke: "currentColor",
          strokeWidth: "1.9",
          strokeLinecap: "round",
          strokeLinejoin: "round",
        }),
        React.createElement("circle", { cx: "16", cy: "16", r: "2.2", fill: "currentColor" }),
      );
    }

    function extractModelVersion(model) {
      const name = String(model && model.name ? model.name : "");
      const id = String(model && model.id ? model.id : "");
      const idMatch = id.match(/(?:gemini|claude|gpt)[-_ ]*v?(\d+(?:\.\d+)*)/i)
        || id.match(/\b(\d+(?:\.\d+)+)\b/);
      if (idMatch) return idMatch[1].split(".").map((num) => parseInt(num, 10) || 0);

      const nameMatch = name.match(/(?:gemini|claude|gpt)[-_ ]*v?(\d+(?:\.\d+)*)/i)
        || name.match(/\b(\d+(?:\.\d+)+)\b/);
      if (nameMatch) return nameMatch[1].split(".").map((num) => parseInt(num, 10) || 0);

      return [0];
    }

    function compareVersionsDesc(v1, v2) {
      const len = Math.max(v1.length, v2.length);
      for (let i = 0; i < len; i++) {
        const num1 = v1[i] !== undefined ? v1[i] : 0;
        const num2 = v2[i] !== undefined ? v2[i] : 0;
        if (num1 !== num2) return num2 - num1;
      }
      return 0;
    }

    function getFamilyOrder(model) {
      const text = `${model && model.id ? model.id : ""} ${model && model.name ? model.name : ""}`.toLowerCase();
      if (text.includes("gemini")) return 1;
      if (text.includes("claude")) return 2;
      if (text.includes("gpt")) return 3;
      return 4;
    }

    function getVariantScore(model) {
      const text = `${model && model.name ? model.name : ""} ${model && model.id ? model.id : ""}`.toLowerCase();
      if (text.includes("ultra")) return 1;
      if (text.includes("pro") && !text.includes("lite")) return 2;
      if (text.includes("flash") && !text.includes("lite") && !text.includes("thinking") && !text.includes("image")) return 3;
      if (text.includes("flash") && text.includes("thinking") && !text.includes("lite")) return 4;
      if (text.includes("image")) return 5;
      if (text.includes("lite") && !text.includes("thinking")) return 6;
      if (text.includes("lite") && text.includes("thinking")) return 7;
      return 10;
    }

    function compareAntigravityModels(a, b) {
      const famA = getFamilyOrder(a);
      const famB = getFamilyOrder(b);
      if (famA !== famB) return famA - famB;

      const verA = extractModelVersion(a);
      const verB = extractModelVersion(b);
      const verComp = compareVersionsDesc(verA, verB);
      if (verComp !== 0) return verComp;

      const variantA = getVariantScore(a);
      const variantB = getVariantScore(b);
      if (variantA !== variantB) return variantA - variantB;

      return (a.name || a.id || "").localeCompare(b.name || b.id || "") || (a.id || "").localeCompare(b.id || "");
    }

    function compareAntigravityModelOptions(a, b) {
      const aEnabled = Boolean(a && a.enabled);
      const bEnabled = Boolean(b && b.enabled);
      if (aEnabled !== bEnabled) return aEnabled ? -1 : 1;
      return compareAntigravityModels(a, b);
    }

    function formatReset(resetTime, t) {
      if (!resetTime) return "n/a";
      const timestamp = Date.parse(resetTime);
      if (!Number.isFinite(timestamp)) return resetTime;
      const delta = timestamp - Date.now();
      if (delta <= 0) return t ? t("resetNow") : "now";
      const totalMinutes = Math.round(delta / 60000);
      const days = Math.floor(totalMinutes / (60 * 24));
      const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
      const minutes = totalMinutes % 60;
      if (days > 0) return t ? t("timeDayHour", { days, hours }) : `${days}d ${hours}h`;
      if (hours > 0) return t ? t("timeHourMin", { hours, minutes }) : `${hours}h ${minutes}m`;
      return t ? t("timeMin", { minutes }) : `${minutes}m`;
    }

    function resetText(row, t) {
      if (row && row.resetLabel) return t ? t("resetPrefix", { time: row.resetLabel }) : `Reset: ${row.resetLabel}`;
      if (row && row.resetTime) return t ? t("resetPrefix", { time: formatReset(row.resetTime, t) }) : `Reset: ${formatReset(row.resetTime, t)}`;
      return t ? t("resetUnavailable") : "Reset: n/a";
    }

    function percentOf(row) {
      if (typeof row.remainingPercent === "number") return row.remainingPercent;
      if (typeof row.remainingFraction === "number") return Math.round(row.remainingFraction * 1000) / 10;
      return 0;
    }

    function QuotaRow({ row, accent, t }) {
      const percent = percentOf(row);
      const width = Math.max(0, Math.min(100, percent));
      const label = row.label || row.displayName || row.id || (t ? t("quota") : "Quota");
      return React.createElement("div", { className: "agp-row" },
        React.createElement("div", { className: "agp-rowtop" },
          React.createElement("div", null, label),
          React.createElement("div", { className: "agp-metrics" },
            React.createElement("span", null, resetText(row, t)),
            React.createElement("span", { className: `agp-percent${accent === "alt" ? " agp-percent-alt" : ""}` }, `${percent}%`),
          ),
        ),
        React.createElement("div", {
          className: "agp-bar",
          role: "progressbar",
          "aria-label": `${label} ${percent}%`,
          "aria-valuemin": 0,
          "aria-valuemax": 100,
          "aria-valuenow": width,
        },
          React.createElement("div", {
            className: `agp-fill${accent === "alt" ? " agp-fill-alt" : ""}`,
            style: { width: `${width}%` },
          }),
        ),
      );
    }

    function QuotaGroup({ group, accent, t }) {
      const buckets = Array.isArray(group && group.buckets) ? group.buckets : [];
      return React.createElement("div", { className: "agp-quota-group" },
        React.createElement("div", { className: "agp-group-head" },
          React.createElement("span", { className: "agp-group-title" }, group.displayName || (t ? t("quota") : "Quota group")),
          group.description && React.createElement("span", { className: "agp-group-desc" }, group.description),
        ),
        buckets.map((bucket, index) => React.createElement(QuotaRow, {
          key: bucket.id || bucket.bucketId || bucket.label || bucket.displayName || index,
          row: bucket,
          accent,
          t,
        })),
      );
    }

    function modelMeta(option, t) {
      const parts = [];
      if (Array.isArray(option.inputModalities) && option.inputModalities.includes("image")) parts.push("image");
      if (Array.isArray(option.reasoningEfforts) && option.reasoningEfforts.length) {
        parts.push(`thinking: ${option.reasoningEfforts.join("/")}`);
      }
      if (typeof option.remainingPercent === "number") {
        parts.push(t ? t("quotaLabel", { percent: option.remainingPercent }) : `Quota: ${option.remainingPercent}%`);
      }
      return parts.join(" · ");
    }

    function ModelOptionRow({ option, disabled, onToggle, t }) {
      return React.createElement("label", { className: "agp-model-row" },
        React.createElement("input", {
          className: "agp-check",
          type: "checkbox",
          checked: !!option.enabled,
          disabled,
          onChange: (event) => onToggle(option.id, event.target.checked),
        }),
        React.createElement("span", { className: "agp-model-text" },
          React.createElement("span", { className: "agp-model-name" }, option.name || option.id),
          React.createElement("span", { className: "agp-model-sub" }, modelMeta(option, t) || option.id),
        ),
      );
    }

    function AntigravitySettings({ ctx }) {
      const [, setLocaleRev] = useState(0);
      useEffect(() => {
        if (!ctx || !ctx.locale || typeof ctx.locale.subscribe !== "function") return;
        return ctx.locale.subscribe(() => {
          setLocaleRev((r) => r + 1);
        });
      }, [ctx]);

      const tr = useMemo(() => createTranslator(ctx), [ctx]);

      const [status, setStatus] = useState({ loading: true });
      const [quota, setQuota] = useState(undefined);
      const [modelConfig, setModelConfig] = useState(undefined);
      const [busy, setBusy] = useState(false);
      const [modelBusy, setModelBusy] = useState(false);
      const [error, setError] = useState("");
      const [doctor, setDoctor] = useState("");
      const [doctorBusy, setDoctorBusy] = useState(false);
      const [copyState, setCopyState] = useState("");
      const pollRef = useRef(undefined);

      const refreshStatus = useCallback(async () => {
        const value = await api("/status");
        setStatus({ loading: false, ...value });
        if (value.quota) setQuota(value.quota);
        if (value.models) setModelConfig(value.models);
        return value;
      }, []);

      const refreshQuota = useCallback(async () => {
        setBusy(true);
        setError("");
        try {
          const value = await api("/quota", { method: "POST" });
          setQuota(value);
          if (value.models) setModelConfig(value.models);
          await refreshStatus();
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setBusy(false);
        }
      }, [refreshStatus]);

      useEffect(() => {
        installStyle();
        let cancelled = false;
        void refreshStatus()
          .then((value) => {
            if (!cancelled && value.authenticated) void refreshQuota();
          })
          .catch((err) => {
            if (!cancelled) {
              setStatus({ loading: false, authenticated: false });
              setError(err instanceof Error ? err.message : String(err));
            }
          });
        return () => {
          cancelled = true;
          if (pollRef.current !== undefined) window.clearInterval(pollRef.current);
        };
      }, [refreshQuota, refreshStatus]);

      const startLogin = useCallback(async () => {
        setBusy(true);
        setError("");
        try {
          const value = await api("/login", { method: "POST" });
          if (value.authUrl) window.open(value.authUrl, "_blank", "noopener,noreferrer");
          if (pollRef.current !== undefined) window.clearInterval(pollRef.current);
          pollRef.current = window.setInterval(async () => {
            try {
              const next = await refreshStatus();
              if (next.login && next.login.status === "complete") {
                window.clearInterval(pollRef.current);
                pollRef.current = undefined;
                await refreshQuota();
              }
              if (next.login && next.login.status === "error") {
                window.clearInterval(pollRef.current);
                pollRef.current = undefined;
                setError(next.login.error || tr("loginFailed"));
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : String(err));
            }
          }, 2000);
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setBusy(false);
        }
      }, [refreshQuota, refreshStatus, tr]);

      const logout = useCallback(async () => {
        setBusy(true);
        setError("");
        try {
          const value = await api("/logout", { method: "POST" });
          setStatus({ loading: false, ...value });
          setQuota(undefined);
          setDoctor("");
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setBusy(false);
        }
      }, []);

      const saveModels = useCallback(async (enabledModelIds) => {
        setModelBusy(true);
        setError("");
        try {
          const value = await api("/models", {
            method: "POST",
            body: JSON.stringify({ enabledModelIds }),
          });
          setModelConfig(value);
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setModelBusy(false);
        }
      }, []);

      const toggleModel = useCallback((modelId, enabled) => {
        const current = new Set(modelConfig && Array.isArray(modelConfig.enabledModelIds) ? modelConfig.enabledModelIds : []);
        if (enabled) current.add(modelId);
        else current.delete(modelId);
        void saveModels([...current]);
      }, [modelConfig, saveModels]);

      const setAllModels = useCallback((enabled) => {
        const ids = enabled && modelConfig && Array.isArray(modelConfig.options)
          ? modelConfig.options.map((option) => option.id)
          : [];
        void saveModels(ids);
      }, [modelConfig, saveModels]);

      const loadDoctor = useCallback(async () => {
        setDoctorBusy(true);
        try {
          const value = await api("/doctor");
          setDoctor(value.text || "");
        } catch (err) {
          setDoctor(err instanceof Error ? err.message : String(err));
        } finally {
          setDoctorBusy(false);
        }
      }, []);

      const copyDoctor = useCallback(async () => {
        try {
          await navigator.clipboard.writeText(doctor);
          setCopyState("copied");
        } catch (_) {
          setCopyState("failed");
        }
        window.setTimeout(() => setCopyState(""), 1600);
      }, [doctor]);

      const quotaGroups = useMemo(() => {
        if (!quota) return [];
        if (Array.isArray(quota.groups) && quota.groups.length > 0) {
          return quota.groups;
        }
        if (Array.isArray(quota.bucketRows) && quota.bucketRows.length > 0) {
          const map = new Map();
          for (const b of quota.bucketRows) {
            const grp = b.group || "Quota";
            if (!map.has(grp)) map.set(grp, []);
            map.get(grp).push(b);
          }
          return [...map.entries()].map(([displayName, buckets]) => ({ displayName, buckets }));
        }
        return [];
      }, [quota]);

      const fallbackModelRows = useMemo(() => {
        if (quotaGroups.length > 0) return [];
        if (!quota || !Array.isArray(quota.modelRows)) return [];
        return quota.modelRows.filter((row) => typeof row.remainingFraction === "number");
      }, [quota, quotaGroups]);

      const modelOptions = useMemo(() => {
        const options = modelConfig && Array.isArray(modelConfig.options) ? modelConfig.options : [];
        return [...options].sort(compareAntigravityModelOptions);
      }, [modelConfig]);

      const plan = quota && quota.planLabel ? quota.planLabel : "";
      const isPro = /pro|paid|plus/i.test(plan);
      const email = status.email || (status.loading ? tr("loading") : tr("notSignedIn"));
      const catalogNote = quota
        ? quota.catalogSource === "live"
          ? tr("catalogLive")
          : quota.catalogSource
            ? tr("catalogStatic")
            : tr("catalogUnknown")
        : "";
      const expiresLabel = typeof status.expires === "number" && status.expires > 0
        ? tr("accountExpires", { time: new Date(status.expires).toLocaleString() })
        : "";

      return React.createElement("div", { className: "agp-wrap" },
        React.createElement("div", { className: "agp-page-head" },
          React.createElement("span", { className: "agp-logo", "aria-hidden": "true" },
            React.createElement(AntigravityIcon, { size: 22 }),
          ),
          React.createElement("div", null,
            React.createElement("h2", { className: "agp-page-title" },
              tr("title"),
              status.version && React.createElement("span", { className: "agp-version" }, tr("version", { version: status.version })),
            ),
            React.createElement("p", { className: "agp-page-desc" }, tr("pageDesc")),
          ),
        ),
        React.createElement("section", { className: "agp-card", "aria-busy": busy ? "true" : "false" },
          React.createElement("div", { className: "agp-head" },
            React.createElement("div", { className: "agp-title" },
              React.createElement("span", {
                className: `agp-dot${status.authenticated ? " agp-dot-ok" : busy ? " agp-dot-busy" : ""}`,
                "aria-hidden": "true",
              }),
              React.createElement("span", null, tr("currentAccount")),
            ),
            React.createElement("div", { className: "agp-actions" },
              !status.authenticated && React.createElement("button", {
                type: "button",
                className: "agp-btn agp-btn-primary",
                disabled: busy,
                onClick: startLogin,
              }, busy ? tr("loggingIn") : tr("login")),
              status.authenticated && React.createElement("button", {
                type: "button",
                className: "agp-btn agp-btn-primary",
                disabled: busy,
                onClick: refreshQuota,
              }, busy ? tr("refreshing") : tr("refresh")),
              status.authenticated && React.createElement("button", {
                type: "button",
                className: "agp-btn",
                disabled: busy,
                onClick: logout,
              }, tr("logout")),
            ),
          ),
          React.createElement("div", { className: "agp-account" },
            React.createElement("div", { className: "agp-email", title: email },
              React.createElement("span", { className: "agp-email-mark", "aria-hidden": "true" }),
              React.createElement("span", { className: "agp-email-text" }, email),
            ),
            React.createElement("div", { className: "agp-account-meta" },
              isPro && React.createElement("span", { className: "agp-badge" },
                React.createElement("span", { className: "agp-diamond", "aria-hidden": "true" }),
                "PRO",
              ),
              expiresLabel && React.createElement("span", { title: expiresLabel }, status.expires > Date.now() ? "●" : "○"),
            ),
          ),
          !status.authenticated && React.createElement("div", { className: "agp-empty" }, tr("notSignedInDesc")),
          status.authenticated && !quota && React.createElement("div", { className: "agp-empty" }, busy ? tr("fetchingQuota") : tr("noQuotaDesc")),
          status.authenticated && (quotaGroups.length > 0 || fallbackModelRows.length > 0) && React.createElement("div", { className: "agp-quota-title" }, tr("quota")),
          status.authenticated && quotaGroups.map((group, index) => {
            const isAlt = /claude|gpt|3p|openai|anthropic/i.test(`${group.displayName || ""} ${group.description || ""}`);
            return React.createElement(QuotaGroup, {
              key: group.displayName || index,
              group,
              accent: isAlt ? "alt" : "ok",
              t: tr,
            });
          }),
          status.authenticated && quotaGroups.length === 0 && fallbackModelRows.map((row, index) => {
            const isAlt = /claude|gpt|3p|openai|anthropic/i.test(`${row.id || ""} ${row.label || ""}`);
            return React.createElement(QuotaRow, {
              key: row.id || row.label || index,
              row,
              accent: isAlt ? "alt" : "ok",
              t: tr,
            });
          }),
          error && React.createElement("div", { className: "agp-error", role: "alert" }, error),
          quota && React.createElement("div", { className: "agp-note" },
            React.createElement("div", { className: "agp-note-row" },
              React.createElement("span", null, tr("updatedAt", { time: new Date(quota.fetchedAt).toLocaleString() })),
              catalogNote && React.createElement("span", null, catalogNote),
            ),
          ),
        ),
        status.authenticated && React.createElement("section", { className: "agp-card agp-model-card" },
          React.createElement("div", { className: "agp-model-head" },
            React.createElement("div", null,
              React.createElement("div", { className: "agp-model-title" }, tr("modelSelector")),
              React.createElement("div", { className: "agp-model-desc" }, tr("modelSelectorDesc")),
            ),
            React.createElement("div", { className: "agp-mini-actions" },
              React.createElement("button", { type: "button", className: "agp-mini-btn", disabled: modelBusy, onClick: () => setAllModels(true) }, tr("selectAll")),
              React.createElement("button", { type: "button", className: "agp-mini-btn", disabled: modelBusy, onClick: () => setAllModels(false) }, tr("unselectAll")),
            ),
          ),
          modelOptions.length === 0
            ? React.createElement("div", { className: "agp-empty" }, tr("loadingModels"))
            : React.createElement("div", { className: "agp-model-list" },
                modelOptions.map((option) => React.createElement(ModelOptionRow, {
                  key: option.id,
                  option,
                  disabled: modelBusy,
                  onToggle: toggleModel,
                  t: tr,
                })),
              ),
          React.createElement("div", { className: "agp-note" }, tr("modelSelectorNote")),
        ),
        React.createElement("section", { className: "agp-card agp-diag-card" },
          React.createElement("details", {
            onToggle: (event) => {
              if (event.currentTarget.open && !doctor) void loadDoctor();
            },
          },
            React.createElement("summary", { className: "agp-diag-summary" }, tr("diagnostics")),
            React.createElement("div", { className: "agp-diag-actions" },
              React.createElement("button", {
                type: "button",
                className: "agp-btn",
                disabled: doctorBusy,
                onClick: loadDoctor,
              }, doctorBusy ? tr("loading") : doctor ? tr("refreshDiagnostics") : tr("loadDiagnostics")),
              doctor && React.createElement("button", {
                type: "button",
                className: "agp-btn",
                onClick: copyDoctor,
              }, copyState === "copied" ? tr("copied") : copyState === "failed" ? tr("copyFailed") : tr("copyDiagnostics")),
            ),
            React.createElement("pre", { className: "agp-diag-pre" }, doctor || tr("diagnosticsHint")),
          ),
        ),
      );
    }

    return {
      inject: ["slots", "locale"],
      apply(ctx) {
        installStyle();
        ctx.effect(() => {
          const dispose = initNavObserver();
          return () => dispose();
        });
        if (ctx.locale && typeof ctx.locale.register === "function") {
          ctx.effect(() => ctx.locale.register(NS, { zh, en }));
        }
        ctx.slots.inject("settings.section", () => ctx.slots.register({
          name: "settings.section",
          id: "antigravity",
          order: 12,
          label: () => "Antigravity",
        }, (props) => React.createElement(AntigravitySettings, { ...props, ctx })));
      },
    };
  },
});
