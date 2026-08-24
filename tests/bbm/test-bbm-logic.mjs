/**
 * BBM QML business-logic unit tests (Node.js)
 *
 * Tests the JS functions extracted/refactored in BbmService.qml,
 * BbmExpandedRow.qml, BtDeviceHover.qml, and Bluetooth.qml.
 *
 * Qt/QML globals (Qt.rgba, Colours) are mocked so tests run without
 * a QML runtime.
 */

// ── Mock Qt API ───────────────────────────────────────────────────────────────
const Qt = {
    rgba: (r, g, b, a) => ({ r, g, b, a }),
};

// ── Mock Colours (same palette role names used by the real singleton) ─────────
const ERROR    = { r: 1.00, g: 0.20, b: 0.20, a: 1 };
const TERTIARY = { r: 0.50, g: 0.80, b: 0.50, a: 1 };
const PRIMARY  = { r: 0.20, g: 0.50, b: 1.00, a: 1 };
const Colours = { palette: { m3error: ERROR, m3tertiary: TERTIARY, m3primary: PRIMARY } };

// ── Extracted constants (from BbmService.qml) ─────────────────────────────────
const STATUS_CHARGING   = "charging";
const WIDGET_ANC_LEVEL  = "box1RadioButtonState";
const _retryIntervalMs  = 5000;

// ── batteriesFor (from BbmService.qml) ───────────────────────────────────────
function batteriesFor(bbmData) {
    if (!bbmData) return [];
    return [
        { icon: bbmData.Battery1Icon ?? "", level: bbmData.Battery1Level ?? 0, charging: (bbmData.Battery1Status ?? "") === STATUS_CHARGING },
        { icon: bbmData.Battery2Icon ?? "", level: bbmData.Battery2Level ?? 0, charging: (bbmData.Battery2Status ?? "") === STATUS_CHARGING },
        { icon: bbmData.Battery3Icon ?? "", level: bbmData.Battery3Level ?? 0, charging: (bbmData.Battery3Status ?? "") === STATUS_CHARGING },
    ].filter(b => b.level > 0);
}

// ── togglesFor (from BbmService.qml) ─────────────────────────────────────────
function togglesFor(bbmData) {
    if (!bbmData) return [];
    return [
        { title: bbmData.Toggle1Title ?? "", buttons: bbmData.Toggle1Buttons ?? [], buttonIcons: bbmData.Toggle1ButtonIcons ?? [], state: bbmData.Toggle1State ?? 0, visible: bbmData.Toggle1Visible ?? false, widgetId: "toggle1State" },
        { title: bbmData.Toggle2Title ?? "", buttons: bbmData.Toggle2Buttons ?? [], buttonIcons: bbmData.Toggle2ButtonIcons ?? [], state: bbmData.Toggle2State ?? 0, visible: bbmData.Toggle2Visible ?? false, widgetId: "toggle2State" },
    ].filter(t => t.visible && t.buttons.length > 0);
}

// ── batteryColorForLevel (local copy in all three popup files) ────────────────
function batteryColorForLevel(levelPercent) {
    const level = Math.max(0, Math.min(100, Number(levelPercent) || 0));
    const error    = Colours.palette.m3error;
    const tertiary = Colours.palette.m3tertiary;
    const primary  = Colours.palette.m3primary;
    function lerp(a, b, t) {
        return Qt.rgba(
            a.r + (b.r - a.r) * t,
            a.g + (b.g - a.g) * t,
            a.b + (b.b - a.b) * t,
            1
        );
    }
    if (level <= 15) return error;
    if (level <= 40) return lerp(error, tertiary, (level - 15) / 25);
    return lerp(tertiary, primary, (level - 40) / 60);
}

// ── Micro test runner ─────────────────────────────────────────────────────────
let passed = 0, failed = 0;

function group(name) {
    console.log(`\n${name}`);
}

function test(name, fn) {
    try {
        fn();
        console.log(`  ✓  ${name}`);
        passed++;
    } catch (e) {
        console.error(`  ✗  ${name}`);
        console.error(`     ${e.message}`);
        failed++;
    }
}

function eq(a, b, msg) {
    const as = JSON.stringify(a), bs = JSON.stringify(b);
    if (as !== bs) throw new Error(msg ?? `expected ${bs}  got ${as}`);
}

function approx(a, b, name, eps = 1e-9) {
    if (Math.abs(a - b) > eps)
        throw new Error(`${name}: expected ≈${b}  got ${a}`);
}

function colourApprox(c, r, g, b, label) {
    approx(c.r, r, `${label}.r`);
    approx(c.g, g, `${label}.g`);
    approx(c.b, b, `${label}.b`);
    approx(c.a, 1, `${label}.a`);
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. Constants
// ═════════════════════════════════════════════════════════════════════════════
group("Constants");
test("STATUS_CHARGING === 'charging'",          () => eq(STATUS_CHARGING,  "charging"));
test("WIDGET_ANC_LEVEL === 'box1RadioButtonState'", () => eq(WIDGET_ANC_LEVEL, "box1RadioButtonState"));
test("_retryIntervalMs === 5000",               () => eq(_retryIntervalMs, 5000));

// ═════════════════════════════════════════════════════════════════════════════
// 2. batteriesFor
// ═════════════════════════════════════════════════════════════════════════════
group("batteriesFor");

test("null → []", () => eq(batteriesFor(null), []));
test("undefined → []", () => eq(batteriesFor(undefined), []));

test("all levels 0 → filtered to []", () => eq(
    batteriesFor({ Battery1Level: 0, Battery2Level: 0, Battery3Level: 0 }),
    []
));

test("single battery, level > 0", () => {
    const result = batteriesFor({ Battery1Level: 75, Battery1Icon: "earbuds", Battery1Status: "discharging" });
    eq(result.length, 1);
    eq(result[0].level,   75);
    eq(result[0].icon,    "earbuds");
    eq(result[0].charging, false);
});

test("charging:true when status === 'charging'", () => {
    const r = batteriesFor({ Battery1Level: 50, Battery1Status: "charging" });
    eq(r[0].charging, true);
});

test("charging:false when status is empty string", () => {
    const r = batteriesFor({ Battery1Level: 50, Battery1Status: "" });
    eq(r[0].charging, false);
});

test("charging:false when status is absent (falls back to '')", () => {
    const r = batteriesFor({ Battery1Level: 50 });
    eq(r[0].charging, false);
});

test("all three batteries returned when all level > 0", () => {
    const r = batteriesFor({
        Battery1Level: 80, Battery1Icon: "earbuds-left",  Battery1Status: "discharging",
        Battery2Level: 70, Battery2Icon: "earbuds-right", Battery2Status: "charging",
        Battery3Level: 60, Battery3Icon: "earbuds-case",  Battery3Status: "discharging",
    });
    eq(r.length, 3);
    eq(r[0], { icon: "earbuds-left",  level: 80, charging: false });
    eq(r[1], { icon: "earbuds-right", level: 70, charging: true  });
    eq(r[2], { icon: "earbuds-case",  level: 60, charging: false });
});

test("missing icon fields default to ''", () => {
    const r = batteriesFor({ Battery1Level: 42 });
    eq(r[0].icon, "");
});

test("only batteries with level > 0 are included (mixed)", () => {
    const r = batteriesFor({
        Battery1Level: 90,
        Battery2Level: 0,
        Battery3Level: 30,
    });
    eq(r.length, 2);
    eq(r[0].level, 90);
    eq(r[1].level, 30);
});

test("returns array (not mutated bbmData)", () => {
    const data = { Battery1Level: 50 };
    batteriesFor(data);
    eq(data.Battery1Level, 50); // unchanged
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. togglesFor
// ═════════════════════════════════════════════════════════════════════════════
group("togglesFor");

test("null → []", () => eq(togglesFor(null), []));
test("undefined → []", () => eq(togglesFor(undefined), []));

test("both toggles invisible → []", () => eq(
    togglesFor({ Toggle1Visible: false, Toggle2Visible: false }),
    []
));

test("visible but empty buttons → filtered out", () => eq(
    togglesFor({ Toggle1Visible: true, Toggle1Buttons: [] }),
    []
));

test("visible with buttons → included", () => {
    const r = togglesFor({
        Toggle1Visible: true,
        Toggle1Buttons: ["Off", "ANC", "Transparency"],
        Toggle1ButtonIcons: ["anc-off", "anc-on", "anc-trans"],
        Toggle1State: 2,
        Toggle1Title: "Noise Control",
    });
    eq(r.length, 1);
    eq(r[0].widgetId, "toggle1State");
    eq(r[0].title,    "Noise Control");
    eq(r[0].buttons,  ["Off", "ANC", "Transparency"]);
    eq(r[0].state,    2);
    eq(r[0].visible,  true);
});

test("toggle2 has correct widgetId", () => {
    const r = togglesFor({
        Toggle2Visible: true,
        Toggle2Buttons: ["On", "Off"],
    });
    eq(r[0].widgetId, "toggle2State");
});

test("both visible, both have buttons → both included in order", () => {
    const r = togglesFor({
        Toggle1Visible: true, Toggle1Buttons: ["a"],
        Toggle2Visible: true, Toggle2Buttons: ["b"],
    });
    eq(r.length, 2);
    eq(r[0].widgetId, "toggle1State");
    eq(r[1].widgetId, "toggle2State");
});

test("missing fields default correctly", () => {
    const r = togglesFor({ Toggle1Visible: true, Toggle1Buttons: ["x"] });
    eq(r[0].title,       "");
    eq(r[0].buttonIcons, []);
    eq(r[0].state,       0);
});

test("visible:false even with buttons → excluded", () => eq(
    togglesFor({ Toggle1Visible: false, Toggle1Buttons: ["a", "b"] }),
    []
));

// ═════════════════════════════════════════════════════════════════════════════
// 4. batteryColorForLevel
// ═════════════════════════════════════════════════════════════════════════════
group("batteryColorForLevel");

test("level 0 → error color (identity)", () => {
    const c = batteryColorForLevel(0);
    eq(c, ERROR);
});

test("level 15 → error color (boundary)", () => {
    const c = batteryColorForLevel(15);
    eq(c, ERROR);
});

test("level 16 → lerp starts (slightly above error)", () => {
    const c = batteryColorForLevel(16);
    const t = 1 / 25;
    colourApprox(c,
        ERROR.r + (TERTIARY.r - ERROR.r) * t,
        ERROR.g + (TERTIARY.g - ERROR.g) * t,
        ERROR.b + (TERTIARY.b - ERROR.b) * t,
        "level16"
    );
});

test("level 40 → tertiary color (boundary)", () => {
    const c = batteryColorForLevel(40);
    // lerp(error, tertiary, (40-15)/25) = lerp(error, tertiary, 1) = tertiary
    colourApprox(c, TERTIARY.r, TERTIARY.g, TERTIARY.b, "level40");
});

test("level 41 → lerp starts between tertiary and primary", () => {
    const c = batteryColorForLevel(41);
    const t = 1 / 60;
    colourApprox(c,
        TERTIARY.r + (PRIMARY.r - TERTIARY.r) * t,
        TERTIARY.g + (PRIMARY.g - TERTIARY.g) * t,
        TERTIARY.b + (PRIMARY.b - TERTIARY.b) * t,
        "level41"
    );
});

test("level 100 → primary color", () => {
    const c = batteryColorForLevel(100);
    colourApprox(c, PRIMARY.r, PRIMARY.g, PRIMARY.b, "level100");
});

test("NaN input → error color (clamped to 0)", () => {
    const c = batteryColorForLevel(NaN);
    eq(c, ERROR);
});

test("negative input → clamped to 0 → error color", () => {
    const c = batteryColorForLevel(-10);
    eq(c, ERROR);
});

test("over-100 input → clamped to 100 → primary color", () => {
    const c = batteryColorForLevel(150);
    colourApprox(c, PRIMARY.r, PRIMARY.g, PRIMARY.b, "level150→100");
});

test("string '50' → parsed to 50", () => {
    const c50  = batteryColorForLevel(50);
    const cStr = batteryColorForLevel("50");
    eq(c50, cStr);
});

test("level 28 → midpoint of error→tertiary lerp", () => {
    const c = batteryColorForLevel(28); // t = (28-15)/25 = 0.52
    const t = 13 / 25;
    colourApprox(c,
        ERROR.r + (TERTIARY.r - ERROR.r) * t,
        ERROR.g + (TERTIARY.g - ERROR.g) * t,
        ERROR.b + (TERTIARY.b - ERROR.b) * t,
        "level28"
    );
});

test("level 70 → midpoint of tertiary→primary lerp", () => {
    const c = batteryColorForLevel(70); // t = (70-40)/60 = 0.5
    const t = 30 / 60;
    colourApprox(c,
        TERTIARY.r + (PRIMARY.r - TERTIARY.r) * t,
        TERTIARY.g + (PRIMARY.g - TERTIARY.g) * t,
        TERTIARY.b + (PRIMARY.b - TERTIARY.b) * t,
        "level70"
    );
});

// ═════════════════════════════════════════════════════════════════════════════
// Summary
// ═════════════════════════════════════════════════════════════════════════════
const total = passed + failed;
console.log(`\n${"─".repeat(50)}`);
console.log(`${passed}/${total} passed${failed > 0 ? `  (${failed} FAILED)` : ""}`);
if (failed > 0) process.exit(1);
