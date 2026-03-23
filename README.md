# 🚀 AI-powered Accessibility Analyzer (A11y Tool)

A lightweight web-based tool that analyzes HTML for common accessibility issues and provides actionable suggestions to improve usability and inclusiveness.

---

## 🌟 Overview

This project is designed to simulate a basic **accessibility audit tool** used in real-world product development. It detects common issues that impact users relying on assistive technologies such as screen readers and keyboard navigation.

The goal is to make accessibility **simple, understandable, and actionable** for developers.

---

## 🎯 Features

- 🔍 Detects common accessibility issues:
  - Missing `alt` text in images  
  - Empty buttons or missing labels  
  - Non-descriptive links (e.g., "click here")  
  - Improper heading structure  
  - Missing form labels  
  - Keyboard-inaccessible elements  
  - Low contrast text  

- 💡 Provides clear suggestions:
  - Explains **why the issue matters**
  - Suggests **how to fix it**

- 🧑‍🦯 Screen Reader Simulation:
  - Shows how content would be interpreted by assistive technologies

- 📊 Accessibility Score:
  - Gives a simple score based on detected issues

---

## 🛠️ Tech Stack

- HTML  
- CSS  
- JavaScript (Vanilla JS)  

No frameworks used — focused on core logic and simplicity.

---

## 🧠 How It Works

1. User pastes HTML code into the input box  
2. The tool parses it using **DOMParser**  
3. It scans elements like:
   - `img`, `button`, `a`, `input`, `headings`
4. Detects accessibility issues based on common best practices  
5. Displays:
   - ❌ Problem  
   - 💡 User impact  
   - ✅ Suggested fix  

---

## 📸 Example

### Input HTML:
```html
<!DOCTYPE html>
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
</html>
