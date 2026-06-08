# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: laboratio.spec.ts >> Laboratorio >> TI-09 - Match Rewind selecciona partido y quita evento
- Location: pagina/tests/laboratio.spec.ts:55:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Manchester City')
Expected: visible
Error: strict mode violation: getByText('Manchester City') resolved to 4 elements:
    1) <span class="lab-club-name">Manchester City</span> aka getByText('Manchester City').first()
    2) <span class="lab-club-name">Manchester City</span> aka getByText('Manchester City').nth(1)
    3) <span class="lab-club-name">Manchester City</span> aka getByText('Manchester City').nth(2)
    4) <span class="lab-club-name">Manchester City</span> aka getByText('Manchester City').nth(3)

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Manchester City')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - link "PREMIERHUB" [ref=e5] [cursor=pointer]:
      - /url: /partido
    - link "Partido" [ref=e6] [cursor=pointer]:
      - /url: /partido
      - text: Partido
    - link "Tablero" [ref=e8] [cursor=pointer]:
      - /url: /tablero
      - text: Tablero
    - link "Laboratorio" [ref=e10] [cursor=pointer]:
      - /url: /laboratorio
      - text: Laboratorio
    - link "VR Arena" [ref=e13] [cursor=pointer]:
      - /url: /vr-arena
      - text: VR Arena
    - link "Tienda" [ref=e15] [cursor=pointer]:
      - /url: /tienda
      - text: Tienda
    - link "Noticias" [ref=e17] [cursor=pointer]:
      - /url: /noticias
      - text: Noticias
    - link "Foro" [ref=e19] [cursor=pointer]:
      - /url: /foro
      - text: Foro
    - link "Historia" [ref=e21] [cursor=pointer]:
      - /url: /historia
      - text: Historia
    - link "Arcade" [ref=e23] [cursor=pointer]:
      - /url: /arcade
      - text: Arcade
    - link "Abrir perfil" [ref=e26] [cursor=pointer]:
      - /url: /perfil
      - generic [ref=e28]: P
      - generic [ref=e29]: pruebaLogin
  - main [ref=e31]:
    - generic [ref=e32]:
      - button "← Volver" [ref=e33] [cursor=pointer]
      - generic [ref=e34]:
        - paragraph [ref=e35]: Laboratorio
        - heading "Match Rewind" [level=1] [ref=e36]
    - generic [ref=e38]:
      - generic [ref=e39]:
        - heading "Seleccionar partido" [level=2] [ref=e42]
        - generic [ref=e44]:
          - text: Partidos icónicos
          - combobox "Partidos icónicos" [ref=e45]:
            - option "Seleccionar partido icónico…"
            - option "City 3-2 Liverpool" [selected]
        - generic [ref=e46]:
          - generic [ref=e47]:
            - img "Manchester City" [ref=e48]
            - generic [ref=e49]: Manchester City
          - generic [ref=e50]:
            - generic [ref=e51]: "3"
            - generic [ref=e52]: –
            - generic [ref=e53]: "2"
          - generic [ref=e54]:
            - generic [ref=e55]: Liverpool
            - img "Liverpool" [ref=e56]
        - paragraph [ref=e57]: Marca los eventos que quieres quitar del escenario hipotético.
        - generic [ref=e58]:
          - generic [ref=e59]:
            - paragraph [ref=e60]:
              - img "Manchester City" [ref=e61]
              - text: Manchester City
            - button "35' GOL Erling Haaland Gol +" [ref=e62] [cursor=pointer]:
              - generic [ref=e63]: 35'
              - generic [ref=e64]: GOL
              - generic [ref=e65]:
                - generic [ref=e66]: Erling Haaland
                - generic [ref=e67]: Gol
              - generic [ref=e68]: +
          - generic [ref=e69]:
            - paragraph [ref=e70]:
              - img "Liverpool" [ref=e71]
              - text: Liverpool
            - paragraph [ref=e72]: Sin eventos
      - generic [ref=e73]:
        - heading "Escenario hipotético" [level=2] [ref=e76]
        - paragraph [ref=e78]: Marca uno o más goles o tarjetas rojas para construir el escenario hipotético.
```

# Test source

```ts
  1  | import { expect, test, type Page } from "@playwright/test";
  2  | import { json, loginAsUser } from "./helpers";
  3  | 
  4  | const LAB_PATH = process.env.LAB_PATH ?? "/laboratorio";
  5  | 
  6  | async function mockLab(page: Page) {
  7  |   await page.route("**/api/ml/clubs", (route) =>
  8  |     json(route, {
  9  |       success: true,
  10 |       data: [
  11 |         { id: 1, name: "Manchester City" },
  12 |         { id: 2, name: "Liverpool" },
  13 |       ],
  14 |     }),
  15 |   );
  16 | 
  17 |   await page.route("**/api/ml/iconic-matches", (route) =>
  18 |     json(route, {
  19 |       success: true,
  20 |       data: [{ fixture_id: 9901, label: "City 3-2 Liverpool" }],
  21 |     }),
  22 |   );
  23 | 
  24 |   await page.route("**/api/ml/match/9901", (route) =>
  25 |     json(route, {
  26 |       success: true,
  27 |       data: {
  28 |         fixture_id: 9901,
  29 |         match_minutes: 90,
  30 |         home_team: { id: 1, name: "Manchester City" },
  31 |         away_team: { id: 2, name: "Liverpool" },
  32 |         score: { home: 3, away: 2 },
  33 |         events: [
  34 |           {
  35 |             id: "goal-1",
  36 |             kind: "goal",
  37 |             team: "home",
  38 |             team_name: "Manchester City",
  39 |             minute: 35,
  40 |             label: "Gol",
  41 |             player_name: "Erling Haaland",
  42 |             removable: true,
  43 |           },
  44 |         ],
  45 |       },
  46 |     }),
  47 |   );
  48 | 
  49 |   await page.route("**/api/lab/desafios**", (route) =>
  50 |     json(route, { success: true, data: [] }),
  51 |   );
  52 | }
  53 | 
  54 | test.describe("Laboratorio", () => {
  55 |   test("TI-09 - Match Rewind selecciona partido y quita evento", async ({ page }) => {
  56 |     await mockLab(page);
  57 |     await loginAsUser(page);
  58 |     await page.goto(LAB_PATH);
  59 | 
  60 |     await page.getByText("Match Rewind").first().click();
  61 | 
  62 |     await expect(page.getByText("Seleccionar partido")).toBeVisible();
  63 |     await expect(page.getByLabel("Partidos icónicos")).toBeVisible();
  64 | 
  65 |     await page.getByLabel("Partidos icónicos").selectOption("9901");
  66 | 
> 67 |     await expect(page.getByText("Manchester City")).toBeVisible();
     |                                                     ^ Error: expect(locator).toBeVisible() failed
  68 |     await expect(page.getByText("Liverpool")).toBeVisible();
  69 |     await expect(page.getByText("Erling Haaland")).toBeVisible();
  70 | 
  71 |     await page.getByText("Erling Haaland").first().click();
  72 | 
  73 |     await expect(page.getByText("Si esto no hubiera pasado")).toBeVisible();
  74 |     await expect(page.getByRole("button", { name: "Calcular resultado alternativo" })).toBeVisible();
  75 | 
  76 |     await page.getByRole("button", { name: "Quitar" }).click();
  77 | 
  78 |     await expect(page.getByText("Si esto no hubiera pasado")).not.toBeVisible();
  79 |     await expect(page.getByRole("button", { name: "Calcular resultado alternativo" })).not.toBeVisible();
  80 |   });
  81 | });
```