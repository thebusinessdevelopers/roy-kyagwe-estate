# Irrigation pilot scoping
Zone: Block-A
Kind: thought
## OPTIONS — 2025-09-18 11:50:42
- **A.** Gravity-fed mainline; test 50 m lateral, 2 valves.
- **B.** Solar pump + header tank; test 1,000 L/h at 6 m head.
- **C.** Hybrid: low-head pump + small buffer tank; test voltage dip tolerance.
Trade-off: capex vs. serviceability in Mukono; micro-test each for 1 day.
## GREENLIGHT — 2025-09-18 11:52:26
**Scope:** Pilot a 50 m lateral with 2 valves
**Acceptance tests:**
- Flow ≥ 800 L/h
- Pressure 1.2–1.6 bar at tail
- No visible leaks after 30 min

## DEV LOG — 2025-09-18 11:52:27
**Step:** Assemble lateral
**Expected:** No leaks at 1.4 bar
**Actual:** Minor seep at joint 3
**Result:** fail

## DECISION
- **What:** Switch pump
- **Why:** Voltage dips
- **Status:** accepted
- **Acceptance tests:**
- Runtime ≥ 4h
- Flow ≥ 800 L/h

## actions — 2025-09-19 12:47:10
- Prepare 50 m lateral parts on bench.
- Tighten all joints; re-test at 1.4 bar for 30 min.
- Record flow and pressure at tail.

## facts — 2025-09-19 12:48:25
- Voltage dips common mid-day (UMEME). Monitor during micro-tests.
