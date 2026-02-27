# AINE Program

## Spec-Driven Development (SDD)

Spec-driven development means writing a “spec” (what we want + why + constraints) before writing code with AI (“documentation first”). The spec becomes the source of truth for the human and the AI (to save context tokens).

There are [multiple implementation](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html) levels to it:

- `Spec-first`: A well thought-out spec is written first, and then used in the AI-assisted development workflow for the task at hand.
- `Spec-anchored`: The spec is kept even after the task is complete, to continue using it for evolution and maintenance of the respective feature.
- `Spec-as-source`: The spec is the main source file over time, and only the spec is edited by the human, the human never touches the code.

Each variant defines spec structure, detail level, and project organization.
Some tools call this context a **memory bank**.
Actually, every tool calls it in a different way: **constitution** or **steering**.

There are many tools to implement SDD, and they all have different features and approaches. Some of them are:

- `Kiro` from AWS, it uses a workflow too where the spec is defined by a list of tasks to do.
- `Spec-kit` from GitHub, it uses a workflow where the spec is defined as a branch that is created for the lifetime of the change request.
- `Tessl`, it follows a spec-anchored approach with MCP server.

All these tools have a common issue: for small things thery are like a sledgehammer to crack a nut,
and in this scenario a simple AI-assisted development workflow without a spec is more efficient
or you are going to review tons of markdown files.

## BMAD (Breakthrough Method of Agile AI Driven Development).

BMAD is another approach to spec-driven development, it is a workflow that can be used with any tool,
and it is based on the idea of controlling the whole process from ideation and planning all the way through agentic implementation.

To get it working, just follow the [offical tutorial](https://docs.bmad-method.org/tutorials/getting-started/)
and let the `npx bmad-method install` command do the magic.
