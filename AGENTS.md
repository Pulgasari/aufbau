# Project Context for AI Agents

## Tech Stack & Language
- **Language:** Plain JavaScript. Do **not** use TypeScript, with the sole exception of `index.d.ts` declaration files for packages.
- **Target Environment:** Browser-first and ESM-native. Maintain cross-runtime/bundler compatibility (Node.js, Deno, Bun, Vite) while prioritizing native browser execution.


## Code Structure & File Organization
- **Modularization:** Split package logic into separate files where sensible, but avoid over-modularizing (do not create a file for every tiny utility).
- **Ordering:** Sort items alphabetically and group them logically whenever applicable (e.g., imports, exports, options, properties).

## Coding Standards & Formatting
- **Core Focus:** Prioritize performance and readability above all else.
- **Performance Auditing:** Explicitly flag and explain any identified critical performance bottlenecks or anti-patterns, detailing the underlying technical causes.
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

## Agent Communication & Tone
- **Tone:** Objective, factual, and strictly goal-oriented.
- **No Sycophancy or Fluff:** Do not mirror, paraphrase, or continuously affirm user statements. Eliminate pleasantries and conversational filler.
- **Conciseness:** Keep technical explanations short, direct, and focused on the solution.
- **Markdown Formatting:** Always wrap raw Markdown responses and outer code blocks in 4 backticks (````) to prevent rendering breakage when nesting inner code blocks.


---


- kommentare im code immer englisch und klein ausser hevorhebungen
- keine docs-kommentare im code (machen wir hinterher als extra file jsdocs oder index.d.ts oder sowas)
- kein abkürzen von variablen-namen ausser die sind echt lang
- da wo platz is, sind einzeiler voll okay
- insb. So `if (bla) blubb;` gehört auf eine zeile nich 3
- bei funktion deklaration `identifier (arg, arg2) {` einhalten
- wenn in zeilen ähnliches/gleiches untereinander steht, mag ich alignment sehr: 
```
const abc   = null;
const heino = new Date;
```
- bei `new Classname` ohne args klammern weglassen
- wo möglich/sinnvoll/machbar: alphabetisch sortieren und ggf logisch kategorisieren
