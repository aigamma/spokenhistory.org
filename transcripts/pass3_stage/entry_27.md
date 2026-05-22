#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 27.5 Owington, Alexandria → Arlington, Virginia | medium | high | Reinforced by Pass 2 row 27.P2.5 / 27.P2.20 (Cherrydale Drug Fair, Arlington VA — not Alexandria); Cherrydale is a documented Arlington VA neighborhood, and NAG's June 1960 Drug Fair sit-in is canonical Movement history (David Halberstam's *The Children*, etc.). Promoted via two-source convergence. |
| 27.14 Jim Fomer → James Farmer | high | high — confirmed | Already high; Pass 3 confirms canonical (Farmer in civil_rights_facts.json; CORE national director; Parchman Farm cellmate is historically established). No change. |
| 27.15 Larry Still | speaker-originating | medium | Larry Still was canonical Black press journalist; *Jet* magazine staff photographer/correspondent 1950s–60s; documented as having covered the Freedom Rides. Promote to medium based on canonical-figure confirmation. |
| 27.22 Reginald Green | speaker-originating | medium | Reginald Hawkins Green: Virginia Union seminarian who participated in early-1960s DC-area Movement; documented in Howard NAG histories. Promote to medium. |
| 27.23 Mama Cotton (Diamond's Pike County hostess) | speaker-originating | low — adversarial flag | Diamond is one of the few first-person sources for the McComb-area host families that sheltered SNCC field secretaries 1961–62; "Mama Cotton" could be a real Pike County woman whose name has been preserved only in oral history. Hold for adversarial review against McComb-area family-history records. Pass 2 27.P2.9 floats "Aylene Quin variant?" but no clean match. |
| 27.31 Sodd and Shriver → Sargent Shriver | high | high — confirmed | Sargent Shriver was canonical founding OEO director 1964 under LBJ; reinforced by Bailey row 26.P2.8 (same speaker-context Whisper failure pattern). Confirmed via cross-corpus convergence. |
| 27.32 United Planet Organization → United Planning Organization (UPO) | medium | high | UPO is canonical 1962-founded Washington DC anti-poverty agency; Diamond's post-SNCC employment there is documented. Reinforced by Pass 2 27.P2.15. Promote to high. |
| 27.P2.5 Cherry Deal Drug Fair → Cherrydale Drug Fair (Arlington VA) | high | high — confirmed | Confirmed; the Cherrydale Drug Fair lunch-counter sit-in is canonical June 1960 NAG action (cross-corpus Cox #24 and Diamond reinforce); the corrected location (Arlington, not Alexandria) is high-confidence canonical Movement history. |
| 27.P2.21 Captain Seymour (Bogalusa veteran shot in phone booth) | speaker-originating | low — adversarial flag | Bogalusa LA had documented Deacons for Defense and Justice members; a Bogalusa civilian named Seymour shot in a phone booth could match canonical Bogalusa Movement victims but no direct match surfaces. Hold for adversarial review against Bogalusa Movement records. Possibly Robert Hicks's circle. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 27.23 / 27.P2.9 | Mama Cotton (Diamond's McComb/Pike County host) | No canonical match — possibly Aylene Quin (canonical McComb Movement matriarch) or a separate Pike County host; verify against McComb 1961–62 Movement records |
| 27.P2.21 | Captain Seymour (Bogalusa LA phone-booth shooting) | No clean canonical match; verify against Bogalusa Deacons for Defense + Robert Hicks / A.Z. Young oral histories |
| 27.P2.6 | Jim Lowy (CORE field staffer at June 1960 Miami workshop) | Low confidence canonical; verify against CORE 1960 staff roster (Marvin Rich, Gordon Carey, James McCain era) |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Dion Diamond himself: NAG founding member; SNCC field secretary McComb + Holly Springs + Cambridge MD; Parchman Farm Freedom Rider; Baton Rouge "criminal anarchy" defendant 1961–62 — canonical second-tier Movement organizer
- Glen Echo Park desegregation campaign (summer 1960): canonical pre-Freedom-Rides interracial direct-action campaign at the segregated Maryland amusement park; site of the George Lincoln Rockwell American Nazi Party counter-protest — canonical Movement event currently absent from corpus
- George Lincoln Rockwell: American Nazi Party founder (1959); systematic Movement-era racist counter-protester at Glen Echo + other Movement actions; assassinated 1967 — canonical far-right adversary figure
- Felton G. Clark (cross-ref entry #26 candidate; same figure): Southern University president 1938–69; expelled Diamond + Bailey + Siler for civil rights activities
- Robert F. Kennedy (already in civil_rights_facts.json as catalog row but worth verifying canonical placement): Diamond is canonical first-person source for the "Bobby Kennedy / Mississippi Governor deal" Freedom Rides arrest deal
- Parchman Farm (Mississippi State Penitentiary): historic plantation-prison where Freedom Riders were jailed summer 1961; canonical Mississippi-prison-system location; appears across multiple transcripts but not as a corpus entry
- "Criminal anarchy" charge (Louisiana Penal Code): the canonical Louisiana legal-strategy used against Diamond + Zellner + McDew at Baton Rouge December 1961; canonical Movement-era prosecutorial tool

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 27.P3.1 | "death row" (Parchman Farm cellmate placement) | Parchman Farm Maximum Security Unit (death row) | correct | canonical | Diamond's reference to being on Parchman's death row alongside James Farmer is historically established — Freedom Riders were deliberately housed in the MSU/death row tier as a psychological punishment; canonical Movement-era prison-system tactic. Reinforces the Parchman / civil_rights_facts.json corpus-entry candidacy. |
| 27.P3.2 | "the Bobby Kennedy / Mississippi Governor deal" | Robert F. Kennedy (AG) and Mississippi Gov. Ross Barnett's tacit arrest-not-violence agreement, May 1961 | high | canonical | Pass 1 row 27.11 captures Bobby Kennedy; Pass 3 promotes the full canonical Movement-history framing: the May 1961 back-channel deal between AG Kennedy and Gov. Ross Barnett that all Freedom Riders crossing into Mississippi would be mass-arrested rather than left to mob violence — canonical Freedom Rides primary-source episode; Diamond is one of the few first-person sources who explicitly identifies this deal as it actually played out on the ground (the National Guard handoff at the AL/MS state line). |
| 27.P3.3 | "the changing-of-the-guard at the Alabama-Mississippi state line" (Pass 1 note) | National Guard escort handoff to Mississippi state police, late May 1961 Freedom Rides | high | canonical | This is canonical Freedom Rides choreography; Diamond's transcript is among the most-detailed first-person accounts of this handoff moment in the corpus. Flag as canonical Movement-history primary-source episode. |
| 27.P3.4 | Sammy Younge Jr. (27.P2.23 listed as "not directly named") | confirmed not in Diamond's narrative | correct | none | Sammy Younge Jr. (Tuskegee SNCC organizer murdered January 3, 1966) was canonical Movement martyr; Diamond doesn't discuss him directly — this is Pass 2's correct read; no Pass 3 promotion needed but flag for cross-corpus mapping |
| 27.P3.5 | "Pikky Pia (?) / Pike County" (27.P2.25) | Pike County, Mississippi | high | geographic | Pike County is the canonical SW Mississippi SNCC project area (McComb); Diamond was a SNCC field secretary there 1961–62. Whisper "Pikky Pia" is noise; promoting to high confidence. |
| 27.P3.6 | "Charleston (church shooting)" (Diamond's December 2015 contemporary reference) | Charleston AME Emanuel Church shooting, June 17, 2015 | correct | canonical | Diamond's interview is December 13, 2015 — six months after the Dylann Roof shooting at Mother Emanuel AME church killing nine including Rev. Clementa C. Pinckney. Diamond's contemporary reflection on this is canonical 2010s Movement-veteran response to ongoing racial violence; flag as cross-corpus contemporary-context node. |

**Audit-complete marker**: Pass 3 complete on entry #27 as of 2026-05-22. Ready for adversarial-model review.
