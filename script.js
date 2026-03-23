const issueMap = {
  imageAlt: {
    impact: "Screen reader users cannot understand what the image conveys.",
    fix: 'Add meaningful alt text, e.g. alt="Team working in the office".'
  },
  buttonText: {
    impact: "Users may not know what the button does.",
    fix: "Use visible text inside the button or add an accessible aria-label."
  },
  linkText: {
    impact: "Links like 'click here' do not tell users where they go.",
    fix: "Use descriptive link text like 'Read accessibility guidelines'."
  },
  heading: {
    impact: "Poor heading structure makes page navigation harder for assistive tech users.",
    fix: "Use one h1 and keep heading levels in order."
  },
  label: {
    impact: "Form users may not know what information is required.",
    fix: "Associate each field with a visible label using <label for='...'>."
  },
  keyboard: {
    impact: "Keyboard-only users cannot reach or activate the control.",
    fix: "Use semantic controls like <button> or add tabindex and keyboard handlers."
  },
  contrast: {
    impact: "Low contrast text is hard to read for low-vision and color-blind users.",
    fix: "Increase contrast between text and background colors."
  }
};

function loadSample() {
  document.getElementById("htmlInput").value = `<!DOCTYPE html>
<html>
<head>
  <title>Bad Example</title>
  <style>
    .cta { color: #bbbbbb; background: #ffffff; }
  </style>
</head>
<body>
  <img src="photo.jpg">
  <button></button>
  <a href="https://example.com">click here</a>
  <div onclick="doSomething()">Submit</div>
  <input id="name" type="text" placeholder="Name">
  <h2>Welcome</h2>
  <p class="cta">This text has low contrast.</p>
</body>
</html>`;
  analyze();
}

function clearAll() {
  document.getElementById("htmlInput").value = "";
  document.getElementById("results").innerHTML = "";
  document.getElementById("screenReader").textContent = "Run analysis to see output.";
  setSummary(0, 0, 100);
  setScoreStyle(100);
}

function analyze() {
  const htmlInput = document.getElementById("htmlInput").value.trim();
  const resultsContainer = document.getElementById("results");
  const screenReaderContainer = document.getElementById("screenReader");
  const previewFrame = document.getElementById("previewFrame");

  resultsContainer.innerHTML = "";

  if (!htmlInput) {
    resultsContainer.innerHTML = `
      <div class="issue bad">
        <strong>No HTML provided</strong>
        <div class="meta">Paste HTML into the box and click Analyze.</div>
      </div>
    `;
    screenReaderContainer.textContent = "No input available.";
    setSummary(0, 0, 100);
    setScoreStyle(100);
    return;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlInput, "text/html");

  let issues = [];
  issues = issues.concat(checkImages(doc));
  issues = issues.concat(checkButtons(doc));
  issues = issues.concat(checkLinks(doc));
  issues = issues.concat(checkHeadings(doc));
  issues = issues.concat(checkLabels(doc));
  issues = issues.concat(checkKeyboardAccessibility(doc));

  previewFrame.srcdoc = htmlInput;

  previewFrame.onload = () => {
    const contrastIssues = checkContrast(previewFrame);
    issues = issues.concat(contrastIssues);

    renderIssues(issues);
    renderScreenReader(doc);
    const score = calculateScore(issues);
    setSummary(issues.length, issues.length, score);
    setScoreStyle(score);
  };
}

function checkImages(doc) {
  const issues = [];
  doc.querySelectorAll("img").forEach((img, index) => {
    const alt = (img.getAttribute("alt") || "").trim();
    if (!alt) {
      issues.push(createIssue(
        "imageAlt",
        `Image ${index + 1} missing alt text`,
        getSelector(img)
      ));
    }
  });
  return issues;
}

function checkButtons(doc) {
  const issues = [];
  doc.querySelectorAll("button").forEach((btn, index) => {
    const text = (btn.textContent || "").trim();
    const aria = (btn.getAttribute("aria-label") || "").trim();
    if (!text && !aria) {
      issues.push(createIssue(
        "buttonText",
        `Button ${index + 1} has no text or aria-label`,
        getSelector(btn)
      ));
    }
  });
  return issues;
}

function checkLinks(doc) {
  const issues = [];
  const weakTexts = ["click here", "read more", "more", "link", "here"];

  doc.querySelectorAll("a").forEach((link, index) => {
    const text = (link.textContent || "").trim().toLowerCase();
    const aria = (link.getAttribute("aria-label") || "").trim();

    if ((!text && !aria) || weakTexts.includes(text)) {
      issues.push(createIssue(
        "linkText",
        `Link ${index + 1} is not descriptive`,
        getSelector(link)
      ));
    }
  });

  return issues;
}

function checkHeadings(doc) {
  const issues = [];
  const h1s = doc.querySelectorAll("h1");

  if (h1s.length === 0) {
    issues.push(createIssue(
      "heading",
      "Page is missing an <h1> heading",
      "document"
    ));
  }

  const headings = Array.from(doc.querySelectorAll("h1,h2,h3,h4,h5,h6"));
  let lastLevel = 0;

  headings.forEach((h) => {
    const level = Number(h.tagName.substring(1));
    if (lastLevel && level > lastLevel + 1) {
      issues.push(createIssue(
        "heading",
        `Heading level skipped: ${h.tagName} appears after H${lastLevel}`,
        getSelector(h)
      ));
    }
    lastLevel = level;
  });

  return issues;
}

function checkLabels(doc) {
  const issues = [];
  doc.querySelectorAll("input, select, textarea").forEach((field, index) => {
    const id = field.getAttribute("id");
    let hasLabel = false;

    if (id && doc.querySelector(`label[for="${cssEscape(id)}"]`)) {
      hasLabel = true;
    }

    if (field.closest("label")) {
      hasLabel = true;
    }

    if ((field.getAttribute("aria-label") || "").trim()) {
      hasLabel = true;
    }

    if ((field.getAttribute("aria-labelledby") || "").trim()) {
      hasLabel = true;
    }

    if (!hasLabel) {
      issues.push(createIssue(
        "label",
        `Form field ${index + 1} has no associated label`,
        getSelector(field)
      ));
    }
  });

  return issues;
}

function checkKeyboardAccessibility(doc) {
  const issues = [];
  doc.querySelectorAll("*").forEach((el) => {
    const onclick = el.getAttribute("onclick");
    const role = (el.getAttribute("role") || "").toLowerCase();
    const tag = el.tagName.toLowerCase();
    const tabindex = el.getAttribute("tabindex");

    const looksClickable = !!onclick || role === "button" || role === "link";
    const isSemanticControl =
      tag === "button" ||
      tag === "a" ||
      tag === "input" ||
      tag === "select" ||
      tag === "textarea";

    if (looksClickable && !isSemanticControl && tabindex !== "0") {
      issues.push(createIssue(
        "keyboard",
        `Non-semantic clickable element found: <${tag}>`,
        getSelector(el)
      ));
    }
  });

  return issues;
}

function checkContrast(iframe) {
  const issues = [];

  try {
    const doc = iframe.contentDocument;
    if (!doc) return issues;

    const candidates = doc.querySelectorAll("p, span, a, li, button, label, h1, h2, h3, h4, h5, h6, div");
    const seen = new Set();

    candidates.forEach((el) => {
      const text = (el.textContent || "").trim();
      if (!text || text.length < 2) return;

      const key = getSelector(el) + "|" + text.slice(0, 30);
      if (seen.has(key)) return;
      seen.add(key);

      if (isHidden(el, doc)) return;

      const fg = getEffectiveColor(el);
      const bg = getEffectiveBackground(el);
      const ratio = contrastRatio(fg, bg);

      if (ratio < 4.5) {
        issues.push(createIssue(
          "contrast",
          `Low contrast text detected (${ratio.toFixed(2)}:1)`,
          getSelector(el)
        ));
      }
    });
  } catch (e) {
    console.warn("Contrast check failed:", e);
  }

  return issues;
}

function createIssue(type, title, selector) {
  return {
    type,
    title,
    selector,
    info: issueMap[type]
  };
}

function renderIssues(issues) {
  const container = document.getElementById("results");
  container.innerHTML = "";

  if (!issues.length) {
    container.innerHTML = `
      <div class="issue good">
        <strong>No major issues found</strong>
        <div class="meta">The common checks passed. This does not guarantee full accessibility compliance.</div>
      </div>
    `;
    return;
  }

  issues.forEach((issue, index) => {
    const div = document.createElement("div");
    div.className = "issue bad";
    div.innerHTML = `
      <span class="pill">Issue ${index + 1}</span>
      <strong>${escapeHtml(issue.title)}</strong>
      <div class="meta">
        <div><b>Location:</b> ${escapeHtml(issue.selector || "unknown")}</div>
        <div><b>Why it matters:</b> ${escapeHtml(issue.info.impact)}</div>
        <div><b>Fix:</b> ${escapeHtml(issue.info.fix)}</div>
      </div>
    `;
    container.appendChild(div);
  });
}

function renderScreenReader(doc) {
  const lines = [];
  lines.push("=== Screen Reader Simulation ===");
  lines.push("");

  const title = doc.querySelector("title");
  if (title) lines.push("Page Title: " + title.textContent.trim());

  const headings = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");
  headings.forEach((h) => {
    lines.push(`Heading level ${h.tagName.substring(1)}: ${h.textContent.trim()}`);
  });

  doc.querySelectorAll("img").forEach((img) => {
    const alt = (img.getAttribute("alt") || "").trim();
    lines.push("Image: " + (alt || "[no alt text]"));
  });

  doc.querySelectorAll("button, [role='button']").forEach((btn) => {
    const label = (btn.getAttribute("aria-label") || btn.textContent || "").trim();
    lines.push("Button: " + (label || "[unnamed button]"));
  });

  doc.querySelectorAll("a").forEach((link) => {
    const label = (link.getAttribute("aria-label") || link.textContent || "").trim();
    lines.push("Link: " + (label || "[unnamed link]"));
  });

  doc.querySelectorAll("input, select, textarea").forEach((field) => {
    lines.push("Form field: " + (getAccessibleNameForField(doc, field) || "[unnamed field]"));
  });

  lines.push("");
  lines.push("=== End ===");

  document.getElementById("screenReader").textContent = lines.join("\n");
}

function getAccessibleNameForField(doc, field) {
  const id = field.getAttribute("id");
  if (id) {
    const label = doc.querySelector(`label[for="${cssEscape(id)}"]`);
    if (label) return label.textContent.trim();
  }

  const wrappedLabel = field.closest("label");
  if (wrappedLabel) return wrappedLabel.textContent.trim();

  const ariaLabel = (field.getAttribute("aria-label") || "").trim();
  if (ariaLabel) return ariaLabel;

  const labelledBy = (field.getAttribute("aria-labelledby") || "").trim();
  if (labelledBy) {
    return labelledBy
      .split(/\s+/)
      .map((labelId) => {
        const el = doc.getElementById(labelId);
        return el ? el.textContent.trim() : "";
      })
      .join(" ")
      .trim();
  }

  return "";
}

function setSummary(issueCount, wcagCount, score) {
  document.getElementById("issueCount").textContent = issueCount;
  document.getElementById("wcagCount").textContent = wcagCount;
  document.getElementById("score").textContent = score;
}

function setScoreStyle(score) {
  const el = document.getElementById("score");
  el.classList.remove("good", "mid", "bad");

  if (score >= 85) el.classList.add("good");
  else if (score >= 60) el.classList.add("mid");
  else el.classList.add("bad");
}

function calculateScore(issues) {
  let score = 100;

  issues.forEach((issue) => {
    if (issue.type === "contrast") score -= 8;
    else if (issue.type === "heading") score -= 6;
    else if (issue.type === "label") score -= 10;
    else if (issue.type === "keyboard") score -= 12;
    else score -= 8;
  });

  return Math.max(0, score);
}

function getSelector(el) {
  if (!el || !el.tagName) return "unknown";

  let selector = el.tagName.toLowerCase();
  if (el.id) selector += "#" + el.id;
  else if (typeof el.className === "string" && el.className.trim()) {
    const cls = el.className.trim().split(/\s+/).slice(0, 2).join(".");
    if (cls) selector += "." + cls;
  }

  return selector;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cssEscape(str) {
  return String(str).replace(/(["\\])/g, "\\$1");
}

function isHidden(el, doc) {
  const style = doc.defaultView.getComputedStyle(el);
  return style.display === "none" || style.visibility === "hidden" || style.opacity === "0";
}

function getEffectiveColor(el) {
  const win = el.ownerDocument.defaultView;
  return parseRgb(win.getComputedStyle(el).color);
}

function getEffectiveBackground(el) {
  const win = el.ownerDocument.defaultView;
  let current = el;

  while (current) {
    const bg = win.getComputedStyle(current).backgroundColor;
    const parsed = parseRgb(bg);
    if (parsed.a !== 0) return parsed;
    current = current.parentElement;
  }

  return { r: 255, g: 255, b: 255, a: 1 };
}

function parseRgb(color) {
  if (!color) return { r: 0, g: 0, b: 0, a: 1 };

  color = color.trim();

  if (color === "transparent") return { r: 0, g: 0, b: 0, a: 0 };

  const rgba = color.match(/rgba?\(([^)]+)\)/i);
  if (rgba) {
    const parts = rgba[1].split(",").map((s) => s.trim());
    return {
      r: parseFloat(parts[0]) || 0,
      g: parseFloat(parts[1]) || 0,
      b: parseFloat(parts[2]) || 0,
      a: parts[3] !== undefined ? parseFloat(parts[3]) : 1
    };
  }

  const hex = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split("").map((ch) => ch + ch).join("");
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16),
      a: 1
    };
  }

  return { r: 0, g: 0, b: 0, a: 1 };
}

function luminance({ r, g, b }) {
  const srgb = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function contrastRatio(fg, bg) {
  const L1 = luminance(fg);
  const L2 = luminance(bg);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

window.addEventListener("load", () => {
  loadSample();
});