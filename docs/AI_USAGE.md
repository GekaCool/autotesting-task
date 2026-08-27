# AI Usage

## Tools used

- **Claude** (Claude Code) — used to build the automation suite: tests, Page Objects, fixtures,
  and the configuration for Docker and GitHub Actions.
- **Claude in Chrome** — the browser-automation extension, used to let the AI actually traverse
  the live page's HTML and interact with real elements instead of writing selectors blind.

## My approach

For the completion of that assignment I used Claude. Before letting it insert its edits into the
code, I preliminarily set up the folder structure in order to satisfy the task requirements, and
only then allowed it to modify the code, adhering to the assigned structure.

## Prompts that worked best

The best prompts were exactly the ones building the tests. After a clear explanation of what
needed to be tested, Claude could build proper tests almost without errors — locating the
necessary elements, opening dropdowns, and selecting options. "Claude in Chrome" was extremely
useful for that. In my opinion, it is the right approach, as long as the AI replaces the manual
work of traversing HTML and choosing the right elements — that only reduces human error, and the
results are quite reliable as long as it doesn't require deep logic.

It also perfectly built the Page Objects.

Claude also vastly helped set up the configuration files for the Docker deploy and GitHub Actions.

## Where the AI fell short

AI could not help in setting up proper waits between actions — it was necessary to decide them
manually.

One irritating feature of the AI's tests is that it spams a lot of unnecessary assertions and
expectations.

AI completely failed when I asked it to assist me to find bugs or at least where they might be. I got an answer that calculated credit amount is false because 84 months * 161 equals to 13,524 and not 14,278, because it did not take in account interest rate.     

## With three more days

Having more days with this system, I would like to take more time for integrating the tests into
the CI/CD pipeline. It is very important for tests to run without human interference. I would also
set up tests for different environments: extensive testing for production and staging, and a
smaller one for development, in order not to slow down the process there.

Most of the bugs from `/financing/form` mentioned in the report were found manually — this type of
bug should be covered by automated testing going forward.

More "logical" things, such as checking whether setting the color filter to blue actually returns
blue cars, can only be verified manually. The same goes for accessibility testing done by hand —
it's not possible to programmatically check which colors are actually matching, or how well the
page works with keyboard-only navigation (pressing Tab to move between inputs).
