# Agent Instructions for the GraphQL tutorial

This repository contains the hands-on Enonic GraphQL tutorial and the working Enonic XP application produced by the tutorial.

## Scope and Audience

The tutorial teaches developers how to build a custom GraphQL API on Enonic XP with `lib-graphql`, expose it through an XP universal API, and implement mutations and subscriptions. It is primarily aimed at Enonic developers, but should remain understandable to developers who know JavaScript or GraphQL and are new to XP.

This repository does **not** document Guillotine, Enonic's ready-made headless GraphQL API for CMS content. Keep the distinction between a custom API built with `lib-graphql` and a Guillotine content API explicit.

## Content Guidelines

This is a combined tutorial and sample application:

* `docs/` contains the AsciiDoc tutorial published on Enonic's developer portal.
* `src/main/resources/` contains the completed XP application. It is server-side only — there is no client-side code.
* `samples/` contains intermediate code used by tutorial chapters before the application reaches its final state.

The tutorial is a sequential story whose navigation is defined by `docs/menu.json`: environment setup, application creation, the first GraphQL query, mutations, and subscriptions.

The library's own API reference is **not** maintained here. It lives in the `lib-graphql` repository and is published at https://developer.enonic.com/docs/graphql-library. Link to it instead of restating function signatures in the tutorial.

**Keep documentation, samples, and application code in sync.** Some pages include files directly with `include::` while others show inline excerpts representing an earlier tutorial step. When changing code, identify every chapter and sample that presents or explains it. Preserve intentional differences between intermediate samples and the completed application.

### LLM readability

This documentation should be useful to both people and LLMs learning Enonic GraphQL development.

* **No empty stubs.** Every page in `docs/menu.json` must contain substantive, accurate content. If a page is not ready, remove it from navigation rather than publishing placeholder text.
* **Self-contained pages.** Briefly explain a concept locally before linking to deeper reference material. Avoid links that substitute for the explanation the reader needs to continue the tutorial.
* **Consistent terminology.** Use GraphQL terms such as schema, object type, field, resolver, query, mutation, and subscription precisely. Use Enonic terms such as app, API descriptor, API implementation, sandbox, and XP consistently.
* **Runnable examples.** Commands and snippets should be complete enough to follow. Use placeholders only when the reader is explicitly expected to replace them, and explain what the replacement represents.
* **Tutorial continuity.** Do not assume functionality from a later chapter. Each step must build on what the reader has created up to that point.

### External references

When referring to separately documented products or libraries, give enough local context to explain why they matter, then link to the authoritative documentation.

* **GraphQL Library (`lib-graphql`):** The server-side library used here to define and execute a custom GraphQL schema in an XP app. Link to its documentation at https://developer.enonic.com/docs/graphql-library, which holds the reference for `/lib/graphql`, `/lib/graphql-connection`, and `/lib/graphql-rx`.
* **Guillotine:** Enonic's headless GraphQL API for querying CMS content. Mention it only when relevant and do not present it as the library or custom API built by this tutorial.
* **Enonic XP:** Link to the XP documentation for platform APIs, application structure, API descriptors, WebSockets, events, deployment, and other lower-level concerns.
* **Enonic CLI:** Link to its documentation for sandbox, project, build, and deployment commands.
* **GraphQL:** Link to the official documentation for general protocol and schema-language behaviour; keep this tutorial focused on the Enonic integration. The tutorial does not build or teach a UI — client tooling is mentioned only in passing.

Do not force links to open in a new tab. Avoid the AsciiDoc `^` suffix on link labels.

## Code Guidelines

The application is teaching material first. Prefer clear, compact implementations that demonstrate the concept at hand while remaining correct and secure enough for the stated scope.

* XP server code lives in `src/main/resources/apis/graphql/`. `graphql.yaml` is the XP 8 API descriptor, `graphql.ts` handles the HTTP and SSE endpoints, and `schema.ts` defines the GraphQL schema. Both are TypeScript, bundled by tsdown.
* Declarations for libraries that publish no `@enonic-types` package are maintained in `src/main/resources/types/` and wired up through `paths` in `src/main/resources/tsconfig.json`. Keep them in step with the versions in `build.gradle`.
* Server code is TypeScript compiled to CommonJS for the XP runtime. Import XP libraries by their runtime path (`+/lib/xp/sse+`, `+/lib/graphql+`) and export handlers named after the HTTP method. Do not introduce browser or Node-only APIs.
* Keep the API's declared access and mounts in `graphql.yaml` aligned with the URLs and security claims in the tutorial.
* The final schema intentionally uses in-memory storage to keep the mutation example small. Do not describe it as persistent or production-ready.
* The API exports `POST` only. Every operation arrives there, and the controller decides the response shape: a query or mutation is answered with JSON, a subscription with an SSE stream. Do not add a `GET` handler — XP answers `405 Method Not Allowed` for free, and that is deliberate, since a mutation must never be reachable by a method that is expected to be safe to repeat.
* Subscriptions use XP events, `lib-graphql-rx`, and SSE. The operation type is decided by inspecting the document *before* anything is executed. A subscription is executed on the SSE `open` event and cancelled on `close`, which is terminal and also fires after `timeout` and `error`.
* `sse.attributes` carries the subscription document and variables from the request to the `sseEvent` handler, which receives no request of its own. Keep those attributes flat strings: an `undefined` or a nested object there fails at runtime with a `NullPointerException`, so variables are stored JSON-encoded and parsed back.
* Changes across the schema, the controller, and the subscription chapter must remain coordinated.
* Keep dependency versions aligned across `build.gradle`, `package.json`, `package-lock.json`, and documentation examples. Documentation may use an explicit `<version>` placeholder when teaching dependency setup, but surrounding prose must make that clear.

## Build, Test, and Lint

The Gradle build is the primary validation path.

* `./gradlew build` builds and packages the complete XP application, including npm installation, type-checking, linting and tests.
* `./gradlew check` runs the configured verification tasks, including TypeScript linting.
* `npm run build` runs tsdown alone; `npm run check` runs type-checking and linting.
* `npm run lint` runs ESLint over the TypeScript sources.
* `enonic dev` builds, deploys, and watches the application in the linked local sandbox used by the tutorial.

The CI application build is defined in `.github/workflows/build.yml`. Documentation generation and publication are defined in `.github/workflows/enonic-docgen.yml`. There is no dedicated local documentation renderer in this repository; use an AsciiDoc-aware IDE preview for quick checks and CI for publication validation.

When changing only prose, validate JSON files and inspect includes, cross-references, and image paths. When changing application or sample code, run the narrowest relevant check and normally `./gradlew build` before considering the work complete.

## Documentation Architecture

* **Entry point:** `docs/index.adoc`
* **Navigation:** `docs/menu.json`
* **Published versions:** `docs/versions.json`
* **Page format:** AsciiDoc (`.adoc`)
* **Media:** `docs/media/`
* **Shared page attributes:** Pages generally define `:toc: right`, `:experimental:`, `:imagesdir: media/`, and `:sourcedir: ../` where needed.

The documentation build maps source documents to routes based on their paths and menu entries. Add every new reader-facing page to `docs/menu.json`, and keep version configuration in `docs/versions.json` valid. The `latest` field is a JSON boolean in this repository.

Because this is a tutorial, sequential steps are numbered in `docs/menu.json` using the `"<n> - <Title>"` title format, as in Enonic's other tutorials. The numbers live only in the menu titles; a page's own `=` heading stays unnumbered. Pages outside the sequence are left unnumbered. When inserting, removing, or reordering a step, renumber the remaining entries so the sequence stays unbroken, and check that no prose refers to a step by its old number.

## AsciiDoc Conventions

* Use `image::filename.ext[alt text, width=...]` for block images stored in `docs/media/`.
* Use relative cross-document links such as `<<graphql#,GraphQL API>>` so links remain version-aware on the developer portal.
* Use source blocks with the correct language (`js`, `ts`, `json`, `yaml`, `bash`, `html`, `kotlin` for Gradle snippets, or `graphql` for operations) and callouts when individual lines need explanation.
* Keep `include::{sourcedir}...[]` paths relative to the including document and verify the included file actually represents that point in the tutorial.
* Do not use the `^` suffix in link labels. Readers should choose whether links open in a new tab.
* Be careful with underscores in inline AsciiDoc. Outside source blocks, wrap identifiers, paths, or URL patterns containing `_` in single-plus passthrough, for example `+connection_init+`. Combine passthrough with monospace when needed: `` `+connection_init+` ``.
* Prefer one sentence per line in prose where practical. It makes reviews and future edits easier without affecting rendered output.

## Change Checklist

Before finishing a change, check the relevant items:

1. The prose is accurate for Enonic XP 8 and the dependency versions in this repository.
2. Tutorial steps still work in menu order and do not rely on a later chapter.
3. Inline snippets, included files, `samples/`, and final application code agree where they are meant to agree.
4. New or renamed pages and media are reflected in `docs/menu.json`, cross-references, and include paths.
5. Commands, URLs, app names, API keys, mounts, and roles match the actual project configuration.
6. Relevant lint and build checks pass.
