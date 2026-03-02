# AI Integration Documentation

## Overview

This document captures observations, feedback, and lessons learned from integrating AI tooling (GitHub Copilot and the BMAD method) into the development workflow for the **bmad-tutorial** project.

---

## BMAD Methodology Experience

Working with BMAD was reminiscent of a **waterfall** approach. For BMAD to work well, it requires condensing all detailed analysis work at the beginning of the project. This front-loading adds a very significant **cognitive load** in the first days of development.

**Recommendation:** This initial analysis activity should be carried out in **screen sharing with the team** rather than by a single individual. The workload is extremely heavy and difficult to perform solo, and doing so negatively affects the quality of future output.

---

## MCP Usage

MCP was **not used** during this training.

---

## Code Generation & Testing

Given the simplicity of the project, most of the test cases were generated correctly by the AI. However, it was **not able to generate tests for more complex cases**, such as inserting text that is too long.

By default, **input validation in the backend had not been implemented on all fields** — for example, headers and path parameters were left unvalidated until explicitly addressed.

---

## Debugging

Debugging was carried out **entirely by the AI**. It typically ran the tests and read the output autonomously; no further human intervention was necessary.

---

## Limitations & Omissions

No fundamental limitations were identified — the AI does well what it is asked to do. However, several **omissions** were encountered:

- **Missing linter** — no linting configuration was set up by default.
- **Input validation not implemented on all fields** — only some fields were validated; headers and path parameters were missed.
- **Lack of tests for specific edge cases** — e.g., text that is too long was not covered.
- **Excessive code repetition** — e.g., input schemas were replicated across files instead of being defined once and reused.
- **Fastify plugins used very poorly** — e.g., the authentication check used an `allowList` on routes instead of leveraging plugin encapsulation to limit the scope of application.

Some of these shortcomings were later corrected by creating a dedicated story. **Everything can be fixed** — the challenge is using this puppet with the right strings.

---

## Conclusions

AI-assisted development via the BMAD method is viable but requires careful orchestration. The AI is effective at executing well-defined tasks, but it tends to produce solutions that are "good enough" rather than production-grade without explicit, detailed guidance. Teams should expect to:

1. **Invest heavily in upfront analysis** — ideally as a collaborative team exercise.
2. **Review generated code for omissions** — especially around validation, error handling, and architectural patterns.
3. **Create follow-up stories** to address gaps the AI leaves behind.
4. **Guide the AI explicitly** on code reuse, plugin patterns, and edge-case coverage.
