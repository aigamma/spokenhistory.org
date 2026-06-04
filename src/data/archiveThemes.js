/**
 * @fileoverview The Collection > Theme > Playlist taxonomy for the Civil Rights
 * History Project archive. Single source of truth for:
 *   - the nested, book-style Topics page (src/pages/TopicGlossary.jsx)
 *   - the Related Playlists logic on the playlist page (src/pages/StaticPlaylist.jsx)
 *
 * The hierarchy, top to bottom, is the vocabulary the UI standardizes on so a
 * visitor always knows which object they are looking at:
 *   Collection   the whole archive (there is one: the Civil Rights History Project)
 *   Theme        a broad section of the book (for example "Education")
 *   Playlist     a specific subtopic that resolves to a set of clips
 *   Video Clip   one time-anchored segment inside a playlist
 *
 * Each Playlist carries a `query` the static playlist page understands:
 *   { topic: '<topic_category>' }   exact topic_category match (a curated bucket)
 *   { keywords: '<terms>' }         substring search across the clip text fields
 *     (title, summary, keyword tags, related events, topic category, subject)
 *
 * PROVENANCE: this 13-theme, 95-playlist structure is the curatorial taxonomy
 * authored by the project's academic director (who conducted roughly a third of
 * the interviews and is the Library of Congress / Smithsonian liaison). The theme
 * and sub-topic descriptions are his. Themes are ordered by corpus coverage (the
 * number of distinct clips each surfaces, most first). Every query below was
 * verified against public/rag/playlist_index.json to resolve to a non-empty set
 * of clips (smallest live playlist is 4 clips); the coverage gate in
 * scripts/check_theme_coverage.mjs enforces this. Three sub-topics from the
 * source taxonomy that have no clean keyword anchor in the corpus (Politics of
 * Visibility, Narrative Framing and Public Opinion, Environmental Justice) are
 * represented inside the prose of their nearest sibling rather than shipped as
 * near-empty playlists; see output/taxonomy-integration-2026-06-03.md.
 */

export const COLLECTION_NAME = 'Civil Rights History Project';

export const THEMES = [
  {
    id: 'family-faith-culture-community',
    name: 'Family, Faith, Culture, and Community',
    blurb: 'The social and cultural ground from which activism grew.',
    playlists: [
      { id: 'family-and-community', name: 'Family and Community', query: { keywords: 'family' }, blurb: 'Households, kinship networks, neighbors, and local traditions of mutual support.' },
      { id: 'churches-as-organizing-spaces', name: 'Churches as Organizing Spaces', query: { keywords: 'church' }, blurb: 'Churches as meeting places, communication hubs, and centers of moral authority.' },
      { id: 'ministers-clergy-religious-debate', name: 'Ministers, Clergy, and Religious Debate', query: { keywords: 'reverend' }, blurb: 'The different roles religious leaders played, from cautious support to active participation.' },
      { id: 'freedom-songs-and-music', name: 'Freedom Songs and Movement Music', query: { keywords: 'freedom songs' }, blurb: 'Songs, spirituals, gospel traditions, and music as collective courage and communication.' },
      { id: 'storytelling-and-oral-tradition', name: 'Storytelling and Oral Tradition', query: { keywords: 'stories' }, blurb: 'How interviewees narrate memory, history, humor, trauma, and political meaning.' },
      { id: 'community-infrastructure', name: 'Community Infrastructure', query: { keywords: 'barbershop' }, blurb: 'Barbershops, beauty parlors, funeral homes, pool halls, and the everyday institutions that supported organizing.' },
    ],
  },
  {
    id: 'organizations-leadership-strategic-debate',
    name: 'Organizations, Leadership, and Strategic Debate',
    blurb: 'The movement as a network of organizations, leaders, local workers, and competing strategies.',
    playlists: [
      { id: 'naacp-and-legal-activism', name: 'NAACP and Legal Activism', query: { keywords: 'naacp' }, blurb: 'Local chapters, court cases, membership networks, and long-term institutional organizing.' },
      { id: 'sncc-and-youth-led-fieldwork', name: 'SNCC and Youth-Led Fieldwork', query: { keywords: 'sncc' }, blurb: 'Student organizing, voter registration, direct action, and grassroots movement-building.' },
      { id: 'sclc-and-church-based-mobilization', name: 'SCLC and Church-Based Mobilization', query: { keywords: 'sclc' }, blurb: 'Mass campaigns, ministers, moral framing, and national coordination.' },
      { id: 'core-and-interracial-direct-action', name: 'CORE and Interracial Direct Action', query: { keywords: 'congress of racial equality' }, blurb: 'Freedom Rides, sit-ins, and early nonviolent direct action campaigns.' },
      { id: 'highlander-folk-school', name: 'Highlander Folk School and Movement Training', query: { keywords: 'highlander' }, blurb: 'Leadership development, political education, and cross-movement learning.' },
      { id: 'mississippi-freedom-democratic-party', name: 'Mississippi Freedom Democratic Party', query: { keywords: 'mfdp' }, blurb: 'Political representation, the 1964 Democratic convention challenge, and grassroots democracy.' },
      { id: 'black-panther-party', name: 'Black Panther Party and Community Programs', query: { keywords: 'panther' }, blurb: 'Self-defense, survival programs, political education, and urban organizing.' },
      { id: 'women-and-gender', name: 'Women and Gender in the Movement', query: { keywords: 'women' }, blurb: 'Women organizers, leadership, labor, recognition, and gendered expectations.' },
      { id: 'local-leaders-national-figures', name: 'Local Leaders and National Figures', query: { keywords: 'leadership' }, blurb: 'The relationship between famous leaders and the local people who carried campaigns forward.' },
      { id: 'nonviolence-black-power-self-defense', name: 'Nonviolence, Black Power, and Self-Defense', query: { keywords: 'black power' }, blurb: 'Strategic and philosophical debates over tactics, identity, and political power.' },
    ],
  },
  {
    id: 'voting-law-political-power',
    name: 'Voting, Law, and Political Power',
    blurb: 'The struggle for political participation, legal transformation, and institutional change.',
    playlists: [
      { id: 'voter-registration-drives', name: 'Voter Registration Drives', query: { keywords: 'voter registration' }, blurb: 'Dangerous door-to-door and courthouse work to register Black voters.' },
      { id: 'literacy-tests-poll-taxes', name: 'Literacy Tests, Poll Taxes, and Disenfranchisement', query: { keywords: 'literacy test' }, blurb: 'The legal and administrative barriers used to suppress voting.' },
      { id: 'courthouse-struggles', name: 'Courthouse Struggles', query: { keywords: 'courthouse' }, blurb: 'The local confrontations around registration, intimidation, and access to political rights.' },
      { id: 'civil-rights-act', name: 'Civil Rights Act', query: { keywords: 'civil rights act' }, blurb: 'The legal victory and the uneven process of implementation.' },
      { id: 'voting-rights-act', name: 'Voting Rights Act', query: { keywords: 'voting rights act' }, blurb: 'The organizing, violence, and political pressure that led to voting rights legislation.' },
      { id: 'courts-and-legal-strategy', name: 'Courts and Legal Strategy', query: { keywords: 'lawyer' }, blurb: 'Court cases, legal precedents, judicial bias, and the role of civil rights lawyers.' },
      { id: 'federal-government-pressure', name: 'Federal Government and Institutional Pressure', query: { keywords: 'federal' }, blurb: 'How presidents, federal agencies, courts, and national institutions responded to movement pressure.' },
      { id: 'representation-elected-office', name: 'Representation and Elected Office', query: { keywords: 'elected' }, blurb: 'The fight to move from protest to political representation and governing power.' },
      { id: 'movement-politics-aftermath', name: 'Movement Politics and Aftermath', query: { topic: 'Political Analysis' }, blurb: "How interviewees interpret the movement's political legacy, compromises, and unfinished work." },
    ],
  },
  {
    id: 'violence-repression-resistance',
    name: 'Violence, Repression, and Resistance',
    blurb: 'The force the movement confronted: police violence, white supremacist terror, surveillance, imprisonment, and intimidation.',
    playlists: [
      { id: 'police-violence', name: 'Police Violence and Brutality', query: { keywords: 'police' }, blurb: 'Beatings, harassment, false arrests, and state violence against activists and ordinary citizens.' },
      { id: 'arrest-and-imprisonment', name: 'Arrest and Imprisonment', query: { keywords: 'arrested' }, blurb: 'Jail as punishment, risk, strategy, and recurring cost of activism.' },
      { id: 'klan-and-white-supremacist-terror', name: 'Klan Violence and White Supremacist Terror', query: { keywords: 'klan' }, blurb: 'Threats, mob attacks, cross burnings, and organized intimidation.' },
      { id: 'bombings-and-church-bombings', name: 'Bombings and Church Bombings', query: { keywords: 'bombing' }, blurb: 'Terror attacks against homes, churches, and movement spaces.' },
      { id: 'lynching-and-racial-terror', name: 'Lynching and Racial Terror', query: { keywords: 'lynching' }, blurb: 'The historical memory of lynching and its role in shaping fear and resistance.' },
      { id: 'intimidation-and-surveillance', name: 'Intimidation and Surveillance', query: { keywords: 'intimidation' }, blurb: 'Threats against activists, families, communities, and supporters.' },
      { id: 'fbi-cointelpro-state-repression', name: 'FBI, COINTELPRO, and State Repression', query: { keywords: 'fbi' }, blurb: 'Federal surveillance, infiltration, and disruption of civil rights and Black freedom organizations.' },
      { id: 'self-defense-community-protection', name: 'Self-Defense and Community Protection', query: { keywords: 'self-defense' }, blurb: 'Armed protection, the Deacons for Defense, and arguments over how communities kept organizers safe.' },
      { id: 'fear-courage-resilience', name: 'Fear, Courage, and Resilience', query: { keywords: 'fear' }, blurb: 'How interviewees describe fear, risk, endurance, and moral commitment.' },
    ],
  },
  {
    id: 'education-schools-student-formation',
    name: 'Education, Schools, and Student Formation',
    blurb: 'The schoolhouse as both a site of segregation and a training ground for activism.',
    playlists: [
      { id: 'segregated-schooling', name: 'Segregated Schooling', query: { keywords: 'segregated school' }, blurb: 'Unequal schools, underfunded classrooms, and the lived experience of educational apartheid.' },
      { id: 'brown-v-board', name: 'Brown v. Board and Legal Desegregation', query: { keywords: 'brown v. board' }, blurb: 'The legal struggle over school segregation and the promise and limits of court victories.' },
      { id: 'school-integration-the-firsts', name: 'School Integration and the Firsts', query: { keywords: 'integration' }, blurb: 'Students who entered previously white schools and faced isolation, hostility, and institutional resistance.' },
      { id: 'freedom-schools', name: 'Freedom Schools', query: { keywords: 'freedom school' }, blurb: 'Alternative educational spaces created to teach history, citizenship, literacy, and political empowerment.' },
      { id: 'teachers-and-movement-education', name: 'Teachers and Movement Education', query: { keywords: 'teacher' }, blurb: 'Teachers, mentors, and educational institutions that shaped political consciousness.' },
      { id: 'high-school-activists', name: 'High School Activists', query: { keywords: 'high school' }, blurb: 'The central role of high school students in local campaigns.' },
      { id: 'campus-activism', name: 'Campus Activism and Student Movements', query: { keywords: 'college' }, blurb: 'College students, HBCUs, Howard University, Tougaloo College, and campus-based organizing.' },
    ],
  },
  {
    id: 'major-campaigns-places-turning-points',
    name: 'Major Campaigns, Places, and Turning Points',
    blurb: 'Key campaigns and locations that anchor the geography and chronology of the movement.',
    playlists: [
      { id: 'montgomery-bus-boycott', name: 'Montgomery and the Bus Boycott', query: { keywords: 'montgomery' }, blurb: 'Mass mobilization, carpool systems, long walks, and the emergence of national leadership.' },
      { id: 'greensboro-sit-in-movement', name: 'Greensboro and the Sit-In Movement', query: { keywords: 'greensboro' }, blurb: 'Student-led direct action and the spread of lunch counter protests.' },
      { id: 'albany-movement', name: 'Albany Movement', query: { keywords: 'albany' }, blurb: 'A broad local campaign and a major learning moment in movement strategy.' },
      { id: 'birmingham-campaign', name: 'Birmingham Campaign', query: { keywords: 'birmingham' }, blurb: "Children's marches, police violence, bombings, mass arrests, and national visibility." },
      { id: 'mississippi-freedom-summer', name: 'Mississippi Freedom Summer', query: { keywords: 'freedom summer' }, blurb: 'Voter registration, Freedom Schools, local risk, outside volunteers, and national attention.' },
      { id: 'selma-and-bloody-sunday', name: 'Selma and Bloody Sunday', query: { keywords: 'selma' }, blurb: 'Voting rights, the Edmund Pettus Bridge, televised brutality, and federal legislation.' },
      { id: 'lowndes-county', name: 'Lowndes County and Black Political Organizing', query: { keywords: 'lowndes' }, blurb: 'Local political power, independent organizing, and the roots of Black Panther symbolism.' },
      { id: 'bogalusa-armed-self-defense', name: 'Bogalusa and Armed Self-Defense', query: { keywords: 'bogalusa' }, blurb: 'Community protection, the Deacons for Defense, and debates over nonviolence and self-defense.' },
      { id: 'memphis-economic-justice', name: 'Memphis and Economic Justice', query: { keywords: 'memphis' }, blurb: "Labor, sanitation workers, King's final campaign, and the link between civil rights and economic justice." },
    ],
  },
  {
    id: 'direct-action-protest-nonviolence',
    name: 'Direct Action, Protest, and Nonviolence',
    blurb: 'The tactics activists used to confront segregation and force public attention.',
    playlists: [
      { id: 'sit-ins-lunch-counters', name: 'Sit-Ins and Lunch Counter Protests', query: { keywords: 'sit-in' }, blurb: 'Deliberate confrontations with segregated public accommodations.' },
      { id: 'boycotts-economic-withdrawal', name: 'Boycotts and Economic Withdrawal', query: { keywords: 'boycott' }, blurb: 'Community-based refusals to support segregated businesses and services.' },
      { id: 'marches-and-demonstrations', name: 'Marches and Demonstrations', query: { keywords: 'demonstration' }, blurb: 'Public protest as both moral witness and political pressure.' },
      { id: 'freedom-rides', name: 'Freedom Rides', query: { keywords: 'freedom rid' }, blurb: 'Challenges to segregation in interstate travel and the violence riders faced.' },
      { id: 'nonviolence-strategy-discipline', name: 'Nonviolence as Strategy and Discipline', query: { keywords: 'nonviolence' }, blurb: 'Training, philosophy, restraint, and debate around nonviolent action.' },
      { id: 'jail-no-bail', name: 'Jail No Bail', query: { keywords: 'jail no bail' }, blurb: 'Using arrest and imprisonment as political pressure.' },
      { id: 'picket-lines', name: 'Picket Lines and Public Pressure', query: { keywords: 'picket' }, blurb: 'Visible protest outside businesses, workplaces, and public institutions.' },
    ],
  },
  {
    id: 'life-history-political-awakening',
    name: 'Life History and Political Awakening',
    blurb: 'How interviewees describe childhood, family, community, school, and early encounters with injustice before entering the movement.',
    playlists: [
      { id: 'growing-up-under-jim-crow', name: 'Growing Up Under Jim Crow', query: { keywords: 'childhood' }, blurb: 'Childhood and daily life under legal segregation.' },
      { id: 'family-influence', name: 'Family Influence', query: { keywords: 'parents' }, blurb: 'Parents, grandparents, siblings, and kin networks that shaped values, courage, and political awareness.' },
      { id: 'community-respect-dignity', name: 'Community Respect and Dignity', query: { keywords: 'respect' }, blurb: 'The social worlds, expectations, and forms of pride that sustained Black communities.' },
      { id: 'early-encounters-injustice', name: 'Early Encounters with Injustice', query: { keywords: 'racism' }, blurb: 'Moments when interviewees first understood segregation, racism, or unequal treatment.' },
      { id: 'emmett-till-generational-memory', name: 'Emmett Till and Generational Memory', query: { keywords: 'emmett till' }, blurb: 'How the murder of Emmett Till became a formative political memory across the interviews.' },
      { id: 'coming-of-age-in-the-movement', name: 'Coming of Age in the Movement', query: { keywords: 'came of age' }, blurb: 'Stories of young people growing into political consciousness through activism.' },
    ],
  },
  {
    id: 'segregation-everyday-life',
    name: 'Segregation and Everyday Life',
    blurb: 'The racial order the movement confronted: schools, buses, businesses, neighborhoods, jobs, and public space.',
    playlists: [
      { id: 'jim-crow-daily-segregation', name: 'Jim Crow and Daily Segregation', query: { keywords: 'segregation' }, blurb: 'The everyday rules, customs, and humiliations of segregated life.' },
      { id: 'public-accommodations', name: 'Public Accommodations', query: { keywords: 'public accommodation' }, blurb: 'Restaurants, lunch counters, hotels, theaters, and other public spaces where segregation was enforced and challenged.' },
      { id: 'transportation-bus-segregation', name: 'Transportation and Bus Segregation', query: { keywords: 'buses' }, blurb: 'Buses, stations, interstate travel, and the fight over mobility.' },
      { id: 'housing-redlining', name: 'Housing, Redlining, and Spatial Segregation', query: { keywords: 'housing' }, blurb: 'Where people could live, how neighborhoods were divided, and how inequality was built into place.' },
      { id: 'work-farming-sharecropping', name: 'Work, Farming, and Sharecropping', query: { keywords: 'sharecropper' }, blurb: 'Agricultural labor, domestic work, employment discrimination, and economic dependence.' },
      { id: 'racial-identity-self-understanding', name: 'Racial Identity and Self-Understanding', query: { keywords: 'identity' }, blurb: 'How interviewees describe identity, pride, belonging, and the emotional effects of racial hierarchy.' },
    ],
  },
  {
    id: 'economic-justice-labor-sustainability',
    name: 'Economic Justice, Labor, and Movement Sustainability',
    blurb: 'The material conditions of the movement: jobs, poverty, funding, transportation, housing, and long-term survival.',
    playlists: [
      { id: 'poverty-economic-exploitation', name: 'Poverty and Economic Exploitation', query: { keywords: 'poverty' }, blurb: 'The relationship between racial injustice and material deprivation.' },
      { id: 'employment-discrimination', name: 'Employment Discrimination', query: { keywords: 'employment' }, blurb: 'Jobs, wages, workplace exclusion, and unequal opportunity.' },
      { id: 'labor-and-unions', name: 'Labor and Unions', query: { keywords: 'union' }, blurb: 'Connections between civil rights, worker organizing, and collective bargaining.' },
      { id: 'farming-and-sharecropping', name: 'Farming and Sharecropping', query: { keywords: 'plantation' }, blurb: 'Rural labor, debt, land, and economic dependence in the South.' },
      { id: 'black-owned-businesses', name: 'Black-Owned Businesses', query: { keywords: 'businesses' }, blurb: 'Economic independence, community support, and the role of local businesses in sustaining activism.' },
      { id: 'fundraising-outside-support', name: 'Fundraising and Outside Support', query: { keywords: 'fundraising' }, blurb: 'How campaigns were financed through donors, foundations, churches, and national networks.' },
      { id: 'movement-logistics', name: 'Movement Logistics', query: { keywords: 'transportation' }, blurb: 'The hidden work of transportation, lodging, food, offices, phones, and staff.' },
    ],
  },
  {
    id: 'media-visibility-public-opinion',
    name: 'Media, Visibility, and Public Opinion',
    blurb: 'How images, television, newspapers, testimony, and public spectacle shaped the movement, who became visible, and how competing narratives framed public opinion.',
    playlists: [
      { id: 'photography-and-television', name: 'Photography and Television', query: { keywords: 'television' }, blurb: 'The role of visual media in making violence and resistance visible.' },
      { id: 'protest-as-public-spectacle', name: 'Protest as Public Spectacle', query: { keywords: 'protest' }, blurb: 'Demonstrations designed to expose injustice to national audiences, and the politics of who became visible.' },
      { id: 'newspapers-movement-narratives', name: 'Newspapers and Movement Narratives', query: { keywords: 'newspaper' }, blurb: 'Local and national press coverage, framing, and the competing stories told about the movement.' },
      { id: 'emmett-till-media-shock', name: 'Emmett Till and Media Shock', query: { keywords: 'emmett till' }, blurb: 'The circulation of images and the formation of a shared political memory.' },
      { id: 'march-on-washington', name: 'March on Washington and National Broadcast', query: { keywords: 'march on washington' }, blurb: 'The movement on a national stage: scale, symbolism, speeches, and unity.' },
    ],
  },
  {
    id: 'grassroots-organizing-infrastructure',
    name: 'Grassroots Organizing and Movement Infrastructure',
    blurb: 'How the movement was built, sustained, and coordinated on the ground.',
    playlists: [
      { id: 'community-organizing', name: 'Community Organizing', query: { keywords: 'organizing' }, blurb: 'Local people organizing meetings, campaigns, voter drives, and direct action.' },
      { id: 'door-to-door-canvassing', name: 'Door-to-Door Work and Canvassing', query: { keywords: 'canvassing' }, blurb: 'The patient, dangerous work of reaching people household by household.' },
      { id: 'mass-meetings', name: 'Mass Meetings', query: { keywords: 'mass meeting' }, blurb: 'Large gatherings where communities shared information, built morale, and planned action.' },
      { id: 'local-networks', name: 'Local Networks and Informal Communication', query: { keywords: 'local people' }, blurb: 'The relationships, word-of-mouth systems, and trusted local channels that made organizing possible.' },
      { id: 'logistics-movement-support', name: 'Logistics and Movement Support', query: { keywords: 'logistics' }, blurb: 'Transportation, housing, food, printing, phones, staff support, and communication systems.' },
      { id: 'funding-resource-networks', name: 'Funding and Resource Networks', query: { keywords: 'funding' }, blurb: 'How money, donors, foundations, churches, and outside supporters helped sustain campaigns.' },
      { id: 'training-political-education', name: 'Training and Political Education', query: { keywords: 'workshop' }, blurb: 'Workshops, nonviolence training, Highlander Folk School, citizenship education, and leadership development.' },
    ],
  },
  {
    id: 'memory-legacy-ongoing-struggles',
    name: 'Memory, Legacy, and Ongoing Struggles',
    blurb: 'How interviewees remember the movement and connect it to later struggles for justice.',
    playlists: [
      { id: 'movement-memory', name: 'Movement Memory', query: { keywords: 'memory' }, blurb: 'How participants narrate what happened, what mattered, and what is often misunderstood.' },
      { id: 'civil-rights-legacy', name: 'Civil Rights Legacy', query: { keywords: 'legacy' }, blurb: 'The legal, cultural, political, and personal consequences of the movement.' },
      { id: 'black-power-later-movements', name: 'Black Power and Later Movements', query: { keywords: 'black power' }, blurb: 'The shift toward racial pride, self-determination, and more radical frameworks.' },
      { id: 'human-rights-global-influence', name: 'Human Rights and Global Influence', query: { keywords: 'human rights' }, blurb: 'Connections between the U.S. freedom struggle and international movements.' },
      { id: 'womens-rights-gender-justice', name: "Women's Rights and Gender Justice", query: { keywords: "women's rights" }, blurb: 'How civil rights struggles intersected with feminist and gender equality movements.' },
      { id: 'black-lives-matter', name: 'Black Lives Matter and Contemporary Movements', query: { keywords: 'black lives matter' }, blurb: 'How interviewees connect civil rights history to contemporary struggles against police violence and systemic racism.' },
      { id: 'unfinished-work', name: 'Unfinished Work', query: { keywords: 'unfinished' }, blurb: 'Persistent discrimination, structural inequality, environmental and economic justice, and the continuing struggle for racial justice.' },
    ],
  },
];

/**
 * Build the in-app href for a playlist node. The static playlist page reads
 * ?topic / ?keywords / ?label, so this carries the query plus the display
 * label (so the playlist page can title itself and situate itself in the book).
 */
export function playlistHref(playlist) {
  const params = new URLSearchParams();
  if (playlist.query?.topic) params.set('topic', playlist.query.topic);
  if (playlist.query?.keywords) params.set('keywords', playlist.query.keywords);
  if (playlist.name) params.set('label', playlist.name);
  return `/playlist-builder?${params.toString()}`;
}

/** Flatten the taxonomy to a list of { theme, playlist } pairs. */
export function allPlaylists() {
  const out = [];
  for (const theme of THEMES) {
    for (const playlist of theme.playlists) out.push({ theme, playlist });
  }
  return out;
}

/**
 * Find the taxonomy node that matches a current playlist view. Matches by the
 * display label first (the Table of Contents always passes &label=, so it is
 * the most reliable key), then falls back to the query (topic or keywords).
 * Returns { theme, playlist } or null when the view is not a taxonomy playlist
 * (for example a cluster-derived ?entries= playlist).
 */
export function findPlaylist({ label, topic, keywords } = {}) {
  const norm = (s) => (s || '').trim().toLowerCase();
  const L = norm(label);
  const T = norm(topic);
  const K = norm(keywords);
  if (L) {
    for (const theme of THEMES) {
      for (const playlist of theme.playlists) {
        if (norm(playlist.name) === L) return { theme, playlist };
      }
    }
  }
  if (T || K) {
    for (const theme of THEMES) {
      for (const playlist of theme.playlists) {
        const q = playlist.query || {};
        if (T && norm(q.topic) === T) return { theme, playlist };
        if (K && norm(q.keywords) === K) return { theme, playlist };
      }
    }
  }
  return null;
}

/**
 * Related Playlists for a current playlist view: two closely related (siblings
 * in the same theme) plus one unexpected but relevant (the lead playlist of a
 * different theme). Deterministic, so the same playlist always yields the same
 * recommendations. Each returned playlist carries its parent themeName.
 * Returns { close: Playlist[], surprise: Playlist|null } or null when the
 * current view is not a taxonomy playlist.
 */
export function relatedPlaylists(current) {
  const match = findPlaylist(current);
  if (!match) return null;
  const { theme, playlist } = match;
  const withTheme = (p, t) => ({ ...p, themeId: t.id, themeName: t.name });

  const siblings = theme.playlists.filter((p) => p.id !== playlist.id);
  const close = siblings.slice(0, 2).map((p) => withTheme(p, theme));

  // Surprise: walk to the next theme (cyclic) and take its first playlist, so
  // the recommendation always crosses into a different section of the book.
  const ti = THEMES.findIndex((t) => t.id === theme.id);
  let surprise = null;
  for (let step = 1; step < THEMES.length; step++) {
    const other = THEMES[(ti + step) % THEMES.length];
    if (other.id === theme.id) continue;
    if (other.playlists.length) {
      surprise = withTheme(other.playlists[0], other);
      break;
    }
  }
  return { close, surprise };
}
