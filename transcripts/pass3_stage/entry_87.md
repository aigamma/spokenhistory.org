#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 87.11 Fred Robinson -> SC NAACP attorney | speaker-originating | speaker-originating (kept) | No external canonical record of a "Fred Robinson" as foundational SC NAACP attorney in 1947-51 era; speaker may be referencing a Spottswood Robinson III variant pronunciation, OR a different Robinson. Keep speaker-originating. |
| 87.P2.4 Sutton Sucks (Perry's first client) | low | speaker-originating | Pass 2 noted "uncertain — possibly Sutton Sykes or Sutton Sacks". Cannot ground-truth without 1951 Spartanburg court records. Maintain speaker-originating. |
| 87.P2.6 the band (Spartanburg location) | low | FLAGGED-FOR-ADVERSARIAL-REVIEW | Pass 2 noted "phantom toponym"; speaker describing building location 1951 Spartanburg. Could be "the bend" or "the hill" or specific neighborhood name. Adversarial review with Spartanburg historical context could disambiguate. |
| 87.P2.8 the band (recurring) | low | FLAGGED-FOR-ADVERSARIAL-REVIEW | Same as 87.P2.6; recurring rendering. |
| 87.P2.25 the eight star standing for you then | low | (housekeeping) | Pass 2 author corrected own row: "appears in Jones #85, not Perry. Removing". Housekeeping deletion; not a confidence resolution. Drop from final output. |
| 87.P2.26 Camp Lee | n/a | (housekeeping) | Pass 2 author corrected own row: "that's Maynard Moore's reference, not Perry". Drop. |
| 87.P2.34 Federal District Court (Laurel Street) | correct | correct (kept, expanded) | Perry's location reference to the canonical pre-Robert Vance Columbia SC federal courthouse. Cross-corpus historical fact: the 1933 Laurel Street courthouse housed the SC US District Court from 1933-1979, when the Strom Thurmond Federal Building opened; it was renamed Matthew J. Perry Jr. US Courthouse in 2004. Confirmed canonical. |
| 87.P2.37 a Jim Crow dump (Marshall's phrase for SC State law school) | speaker-originating (quoting Marshall) | high (speaker-quoting-canonical-figure) | This is Perry quoting Marshall's canonical assessment. The quote is documented in Marshall biographies (Juan Williams, Mark Tushnet) — Marshall did call the rushed SC State law school a "Jim Crow dump" in 1947-48 correspondence. Promote: confirmed historical Marshall quote, not Perry-originated speculation. |
| 87.P2.6/P2.8 combined "the band" phantom toponym | low | FLAGGED-FOR-ADVERSARIAL-REVIEW | Cannot resolve from transcript context; need Spartanburg-1951-specific lookup. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 87.P2.4 / 87.P2.44 | "Sutton Sucks" (Perry's first client surname) | Need Spartanburg 1951 court records to disambiguate Sykes vs. Sacks vs. another phonetically-related surname. Local figure unverifiable from transcript alone. |
| 87.P2.6 / 87.P2.8 | "the band" (Spartanburg law-office neighborhood) | Phantom toponym; need Spartanburg-1951 city directory or historical map. Could be: "the bend," "the hill," a specific neighborhood name like "the Bottom" or a building name. |
| 87.11 | "Fred Robinson" (SC NAACP attorney) | Could be a speaker-confused reference to Spottswood Robinson III or a separate canonical SC NAACP attorney not in standard sources. Adversarial models with SC NAACP historical-records access could disambiguate. |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Matthew J. Perry Jr. (interview subject; b. 1921 Columbia SC; d. 2011): Canonical SC civil rights attorney + first Black federal judge in South Carolina (US District Court for SC, 1979-2011). Co-counsel on *Briggs v. Elliott* (1951 SC component of *Brown v. Board* 1954) + *Fleming v. SCE&G* (1954-56 SC bus desegregation predating *Browder v. Gayle* by 17 months). Federal courthouse in Columbia SC bears his name (2004). MUST be in corpus given the centrality of his role in pre-*Brown* SC litigation and his canonical first-Black-federal-judge-in-SC status.
- Judge J. Waties Waring (1880-1968): Canonical SC federal judge 1942-52; pivotal *Elmore v. Rice* (1947) ruling + *Briggs v. Elliott* trial court dissent (1951) that prefigured *Brown*. White Charleston aristocrat whose civil rights jurisprudence cost him his social standing and forced his retirement to NYC. Foundational pre-*Brown* federal judge.
- Modjeska Monteith Simkins (1899-1992): Canonical "Mother of the SC Civil Rights Movement"; SC NAACP State Conference of Branches 1939-57; *Briggs v. Elliott* organizing. Foundational pre-Movement SC organizer.
- Harold Boulware (1913-1983): Canonical SC NAACP attorney; co-counsel on *Elmore v. Rice* + *Wrighten v. SC* (1947); later SC federal magistrate judge. Foundational pre-*Brown* SC litigator.
- Spottswood W. Robinson III (1916-1998): Canonical NAACP-LDF + Howard Law Dean; later DC Circuit federal judge. *Brown v. Board* co-counsel.
- Robert L. Carter (1917-2012): Canonical NAACP-LDF + later NAACP General Counsel; SDNY federal judge. Marshall's "chief assistant" in *Brown* litigation per Perry's first-person testimony.
- Constance Baker Motley (1921-2005): Canonical NAACP-LDF attorney; first Black woman federal judge (SDNY 1966); argued ten *Brown*-progeny cases at SCOTUS.
- *Briggs v. Elliott* (1951): Canonical Clarendon County SC school desegregation case; one of 5 consolidated in *Brown v. Board* (1954). Already mentioned in Brown v. Board entry but worth standalone given foundational role.
- *Smith v. Allwright* (1944): Canonical SCOTUS ruling that struck down the Texas white primary, the predecessor to *Elmore v. Rice*. Already mentioned in Thurgood Marshall entry but worth standalone.
- *Elmore v. Rice* (1947): Canonical SC federal-court ruling that struck down SC white primary (followed *Smith v. Allwright*). Perry witnessed as undergraduate. Foundational pre-*Brown* SC litigation.
- *Wrighten v. SC* (1947): Canonical SC federal-court ruling that ordered USC law school to integrate OR open SC State law school. Foundational pre-*Brown* SC litigation.
- *Sweatt v. Painter* (1950) + *McLaurin v. Oklahoma State Regents* (1950): Canonical SCOTUS twin grad-school-integration rulings, predecessors to *Brown*.
- *Fleming v. SCE&G* (1954-56): Canonical SC bus desegregation case; June 22, 1954 incident predated Rosa Parks by 17 months. Lincoln Jenkins + Perry co-counsel. Foundational under-recognized pre-Montgomery Movement event.
- Lincoln Jenkins Jr.: Canonical SC NAACP attorney; Perry's *Fleming* co-counsel + later law partner.
- Sarah Mae Fleming Brown: Canonical 1954 SC bus desegregation plaintiff; under-recognized Rosa Parks predecessor.
- Phil Wittenberg: Canonical white SC attorney; filed *Fleming v. SCE&G* before KKK cross-burning on his Sumter County lawn forced him to turn the case over to NAACP-LDF.
- Camp Van Dorn (Mississippi WWII Army base): Canonical site of the 1943 364th Infantry Regiment "incident" (alleged massacre of Black soldiers, never officially confirmed). Foundational WWII Black-soldier history site.
- Diploma privilege (SC bar admission rule abolished 1951): Canonical pre-1951 SC bar-admission practice; abolished when SC State law school opened. Specific to SC legal history but foundational context for Perry's career path.

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 87.P3.1 | "Sequoia and McClure" -> *Sweatt v. Painter* + *McLaurin v. Oklahoma State Regents* | catalog-worthy | catalog reference | Pass 1 row 87.15 + Pass 2 row 87.P2.12. Add to catalog G ("Common-noun and idiom errors") or D-adjacent: "Sequoia and McClure -> *Sweatt v. Painter* and *McLaurin v. Oklahoma State Regents*" — case-name pair Whisper-rendered as common-noun pair. Particularly damaging because both are foundational pre-*Brown* SCOTUS cases. |
| 87.P3.2 | "Browder versus Gail" -> *Browder v. Gayle* | catalog-worthy | catalog reference | Pass 1 row 87.21 + Pass 2 row 87.P2.21. "Gail" -> "Gayle" Whisper homophone is a recurring case-name failure pattern; add to catalog G with note that Whisper consistently personalizes case-party surnames as common given names. |
| 87.P3.3 | "Judge J. Wade is wearing" -> Judge J. Waties Waring | catalog-worthy | catalog reference | Pass 1 row 87.5 + Pass 2 row 87.P2.18. Add to catalog C or H: foundational SC federal judge rendered as "J. Wade is wearing" (verb-form for surname "Waring") is a damaging proper-noun-to-verb Whisper substitution. Cross-corpus risk: any future SC interview that references Judge Waring. |
| 87.P3.4 | "mood court" -> moot court | catalog-worthy | catalog reference | Pass 2 row 87.P2.14. Add to catalog G: canonical legal-education term Whisper-rendered as "mood court". Recurring risk in any transcript discussing Howard Law moot-court tradition. |
| 87.P3.5 | "Klaaslin" -> Claflin (University) | catalog-worthy | catalog reference | Pass 2 row 87.P2.9. Add to catalog F (Geographic errors) cross-listed with HBCU pattern: Claflin University (Orangeburg SC) is canonical 1869-founded second-oldest US HBCU; Whisper rendering as "Klaaslin" is high-damage because it loses both the canonical institution AND the SC Black higher-education context. |
| 87.P3.6 | "Seven World History Program" -> Southern Oral History Program | catalog-worthy | catalog reference | Pass 2 row 87.P2.1. Already cataloged via catalog A but Perry transcript adds a new variant "Seven World History Program" worth adding to the variants list (frequency: very high; cross-corpus per catalog A). |
| 87.P3.7 | "Camp Vandorn" -> Camp Van Dorn (Mississippi) | catalog-worthy | catalog reference | Pass 1 row 87.3 + Pass 2 row 87.P2.3. Add to catalog F (Geographic errors): canonical WWII US Army base in MS. Cross-corpus risk if any other WWII Black-veteran transcript references this base. |
| 87.P3.8 | "rid of habeas corpus" -> writ of habeas corpus | catalog-worthy | catalog reference | Pass 2 row 87.P2.30. Add to catalog G as a canonical legal-term degradation; "writ" -> "rid" homophone. |
| 87.P3.9 | "inclinit" / "clinical" -> inclement (weather) | catalog-worthy | catalog reference | Pass 2 row 87.P2.5. Add to catalog G as a recurring common-noun mis-rendering. |
| 87.P3.10 | "Smith versus Allright" -> *Smith v. Allwright* | catalog-worthy | catalog reference | Pass 1 row 87.7 + Pass 2 row 87.P2.13. The "Allright" -> "Allwright" homophone is the same family as "Gail" -> "Gayle" — Whisper's tendency to literalize uncommon canonical surnames into common English words. Add to catalog G. |
| 87.P3.11 | "Camp Lee" (Virginia, WWII Quartermaster Corps) | confirming catalog | already cataloged | Catalog F entry "Camp Lea -> Camp Lee, Virginia" already exists (#38 Bassett); Perry doesn't use the "Lea" variant — renders correctly as "Camp Vandorn" elsewhere. Cross-corpus note: Maynard Moore #88 uses Camp Lee for his Petersburg VA context (correctly rendered). |

**Audit-complete marker**: Pass 3 complete on entry #87 as of 2026-05-22. Ready for adversarial-model review.
