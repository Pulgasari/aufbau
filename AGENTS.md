# Project Context for AI Agents

## Tech Stack & Language
- **Language:** Plain JavaScript. Do **not** use TypeScript, with the sole exception of `index.d.ts` declaration files for packages.

## Code Structure & File Organization
- **Modularization:** Split package logic into separate files where sensible, but avoid over-modularizing (do not create a file for every tiny utility).
- **Ordering:** Sort items alphabetically and group them logically whenever applicable (e.g., imports, exports, options, properties).

## Coding Standards & Formatting
- **Core Focus:** Prioritize performance and readability above all else.
- **Indentation:** 2 spaces (tabsize: 2).
- **Function Declarations:** Include a space before and after parentheses, but none inside:
  ```js
  function name () {}
  ```
- **Naming Conventions:**
  - **Case:** Prefer `camelCase`.
  - **Descriptive Names:** Do not uselessly abbreviate variables (e.g., use `value` instead of `val` or `v`). Standard/common abbreviations are allowed when natural (e.g., `decl` for `declaration`).
- **Comments:**
  - All code comments must be written in English.
  - Write comments entirely in lowercase, reserving uppercase solely for explicit emphasis.

## Development & Agent Workflow
- **Architecture-First:** Always construct or sketch the complete skeleton and overall architecture first, making structural interactions fully visible before writing detailed implementations.
- **No Sandbox Testing During Development:** Do not execute sandbox or automated tests while actively building/developing features.
- **Markdown Formatting:** Always wrap raw Markdown responses and code blocks in 4 backticks (````) to avoid syntax breaking when nesting inner code blocks.

## Agent Communication & Tone
- **Tone:** Objective, factual, and strictly goal-oriented.
- **No Sycophancy or Fluff:** Do not mirror, paraphrase, or continuously affirm user statements. Eliminate pleasantries and conversational filler.
- **Conciseness:** Keep technical explanations short, direct, and focused on the solution.
- **Markdown Formatting:** Always wrap raw Markdown responses and outer code blocks in 4 backticks (````) to prevent rendering breakage when nesting inner code blocks.
