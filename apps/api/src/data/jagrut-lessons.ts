import type { LessonCard, QuizQuestion } from '@nyayasetu/shared-types';

// ---------------------------------------------------------------------------
// Category metadata (for frontend display)
// ---------------------------------------------------------------------------

export interface CategoryMeta {
  id: string;
  label: string;
  description: string;
  lessonCount: number;
}

export function getCategoryMeta(lessons: LessonCard[]): CategoryMeta[] {
  const cats: Record<string, CategoryMeta> = {
    'fundamental-rights': { id: 'fundamental-rights', label: 'Fundamental Rights', description: 'Your constitutional guarantees as an Indian citizen', lessonCount: 0 },
    'police-powers': { id: 'police-powers', label: 'Police & Arrests', description: 'Know what police can and cannot do', lessonCount: 0 },
    'traffic-laws': { id: 'traffic-laws', label: 'Traffic & Vehicles', description: 'Challans, licenses, accidents and your rights', lessonCount: 0 },
    'tenancy': { id: 'tenancy', label: 'Rent & Tenancy', description: 'Landlord-tenant rights and dispute resolution', lessonCount: 0 },
    'consumer-rights': { id: 'consumer-rights', label: 'Consumer Rights', description: 'Returns, complaints, and protection from fraud', lessonCount: 0 },
    'workplace-rights': { id: 'workplace-rights', label: 'Workplace Rights', description: 'Employment law, wages, and harassment protection', lessonCount: 0 },
  };
  for (const l of lessons) {
    if (cats[l.category]) cats[l.category].lessonCount++;
  }
  return Object.values(cats);
}

// ---------------------------------------------------------------------------
// Lessons
// ---------------------------------------------------------------------------

export const LESSONS: LessonCard[] = [
  // ── Fundamental Rights ───────────────────────────────────────────────────
  {
    id: 'fr-art21',
    act: 'Constitution of India',
    section: 'Article 21',
    title: 'Right to Life & Personal Liberty',
    category: 'fundamental-rights',
    difficulty: 'beginner',
    order: 1,
    jurisdiction: { scope: 'central' },
    readingTimeSeconds: 90,
    plainLanguageExplanation:
      'Article 21 guarantees that no person can be deprived of life or personal liberty except according to procedure established by law. This is the most powerful fundamental right.',
    content: `Article 21 of the Constitution states: "No person shall be deprived of his life or personal liberty except according to procedure established by law."

This single sentence is the foundation of dozens of rights the Supreme Court has recognised over the decades. It doesn't just mean the right to not be killed — it means the right to live with **dignity**.

The Supreme Court has interpreted Article 21 to include:
- Right to clean drinking water and air
- Right to livelihood
- Right to shelter
- Right to health and medical care
- Right to privacy (Puttaswamy v. Union of India, 2017)
- Right to travel abroad
- Right to legal aid

**Why it matters in daily life:** If a government action affects your ability to live with dignity — be it demolishing your home without notice, denying you medical treatment in a government hospital, or detaining you without legal grounds — Article 21 is the shield.

**Important:** Article 21 protects every "person" in India, not just citizens. Even a foreign national on Indian soil has Article 21 protection.`,
    keyTakeaways: [
      'Article 21 protects life AND personal liberty — not just survival',
      'The Supreme Court has expanded it to include dignity, privacy, health, livelihood',
      'It applies to every person in India, including non-citizens',
      'Any government action that violates dignity can be challenged under Article 21',
      'It is the most litigated fundamental right in Indian constitutional history',
    ],
  },
  {
    id: 'fr-art22',
    act: 'Constitution of India',
    section: 'Article 22',
    title: 'Protection Against Arrest & Detention',
    category: 'fundamental-rights',
    difficulty: 'beginner',
    order: 2,
    jurisdiction: { scope: 'central' },
    readingTimeSeconds: 90,
    plainLanguageExplanation:
      'Article 22 gives you specific rights when arrested: you must be told the grounds, you must be produced before a magistrate within 24 hours, and you have the right to a lawyer.',
    content: `When the police arrest you, the Constitution gives you specific, non-negotiable protections under Article 22.

**Your rights upon arrest:**

1. **Right to know why** — The police MUST inform you of the grounds of arrest immediately. They cannot simply handcuff you and take you away without explanation.

2. **Right to a lawyer** — You have the right to consult and be defended by a legal practitioner of your choice. If you cannot afford one, the state must provide one (this was reinforced by the Supreme Court in Hussainara Khatoon v. State of Bihar).

3. **24-hour rule** — You must be produced before the nearest magistrate within 24 hours of arrest (excluding travel time). The police CANNOT keep you in custody beyond this without judicial authorisation.

4. **No detention beyond magistrate's order** — After 24 hours, only a magistrate can authorise further detention, and only for valid legal reasons.

**What the police CANNOT do:**
- Arrest you at night (between sunset and sunrise) for non-cognizable offences without a magistrate's order
- Detain you without producing you before a magistrate within 24 hours
- Deny you access to a lawyer
- Refuse to inform your family about the arrest

**Exception:** These protections do NOT apply to enemy aliens or persons detained under preventive detention laws (like the National Security Act). Preventive detention has a separate set of safeguards.`,
    keyTakeaways: [
      'Police must tell you WHY you are being arrested — immediately',
      'You must be brought before a magistrate within 24 hours',
      'You always have the right to a lawyer, even if you cannot afford one',
      'Night arrests are restricted for non-cognizable offences',
      'These rights are constitutional — no police officer can override them',
    ],
  },
  {
    id: 'fr-art19',
    act: 'Constitution of India',
    section: 'Article 19',
    title: 'Freedom of Speech & Expression',
    category: 'fundamental-rights',
    difficulty: 'intermediate',
    order: 3,
    jurisdiction: { scope: 'central' },
    readingTimeSeconds: 90,
    plainLanguageExplanation:
      'Article 19(1)(a) guarantees freedom of speech and expression. But this right has reasonable restrictions — you cannot incite violence, defame someone, or threaten national security.',
    content: `Article 19(1)(a) guarantees every Indian citizen the right to freedom of speech and expression. This includes the right to:
- Speak freely
- Write and publish
- Use the internet and social media
- Film and photograph in public places
- Peaceful protest and dissent

**But it has limits.** Article 19(2) allows the government to impose "reasonable restrictions" on this right in the interest of:
- Sovereignty and integrity of India
- Security of the State
- Public order
- Decency or morality
- Contempt of court
- Defamation
- Incitement to an offence

**What this means practically:**
- You CAN criticise the government, politicians, and policies
- You CANNOT make statements intended to incite violence or communal hatred
- You CAN record police officers performing public duties
- You CANNOT defame a specific person with false statements
- You CAN share opinions on social media
- You CANNOT share obscene material or child exploitation content

**The Shreya Singhal case (2015):** The Supreme Court struck down Section 66A of the IT Act (which criminalised "offensive" online speech) as unconstitutional. This landmark ruling confirmed that mere offensiveness is NOT grounds to restrict speech.

**Key principle:** Restrictions must be "reasonable" — the government bears the burden of proving that a restriction is justified.`,
    keyTakeaways: [
      'Freedom of speech is guaranteed but NOT absolute — it has reasonable restrictions',
      'You can criticise the government; you cannot incite violence',
      'The Shreya Singhal ruling (2015) protects online speech from vague censorship',
      'Recording police in public is generally protected under Article 19(1)(a)',
      'The government must prove restrictions are "reasonable" — not the citizen',
    ],
  },

  // ── Police Powers ────────────────────────────────────────────────────────
  {
    id: 'pp-arrest',
    act: 'CrPC',
    section: 'Section 41',
    title: 'When Can Police Arrest Without Warrant?',
    category: 'police-powers',
    difficulty: 'beginner',
    order: 1,
    jurisdiction: { scope: 'central' },
    readingTimeSeconds: 90,
    plainLanguageExplanation:
      'Police can arrest without a warrant only for cognizable offences AND only when specific conditions are met under Section 41. After the 2009 amendment, arrest is no longer automatic even for cognizable offences.',
    content: `Section 41 of CrPC was amended in 2009 (Arnesh Kumar v. State of Bihar) to prevent unnecessary arrests. The police can now arrest without a warrant ONLY if:

**The offence is cognizable** (serious offences like theft, assault, murder) AND at least one of these applies:
1. The person has committed a cognizable offence punishable with imprisonment up to 7 years, AND the officer has reason to believe arrest is necessary to:
   - Prevent further offences
   - Ensure proper investigation
   - Prevent evidence tampering
   - Prevent the person from threatening witnesses
   - Ensure court appearance

2. The offence is punishable with more than 7 years, life imprisonment, or death

**Section 41A — Notice of Appearance:**
For offences punishable up to 7 years, the police should FIRST issue a **notice of appearance** (Section 41A) instead of arresting. The person must comply with the notice. Arrest is only if the person fails to comply.

**What the police CANNOT do:**
- Arrest for non-cognizable offences (minor offences) without a magistrate's warrant
- Arrest without recording written reasons
- Use arrest as a tool of harassment or intimidation

**The D.K. Basu Guidelines (1997):**
The Supreme Court mandated:
- Arresting officer must wear visible ID
- Arrest memo must be prepared at the time of arrest
- Family must be informed immediately
- Medical examination within 48 hours
- Arrested person must be informed of their right to a lawyer`,
    keyTakeaways: [
      'Arrest without warrant is only for cognizable offences, not all offences',
      'For offences up to 7 years, police should issue a notice first (Section 41A)',
      'Police must record written reasons for every arrest',
      'D.K. Basu guidelines mandate ID display, arrest memo, and family notification',
      'Unnecessary arrest can be challenged — the 2009 amendment restricts police power',
    ],
  },
  {
    id: 'pp-fir',
    act: 'CrPC',
    section: 'Section 154',
    title: 'FIR: Your Right to File & What Happens Next',
    category: 'police-powers',
    difficulty: 'beginner',
    order: 2,
    jurisdiction: { scope: 'central' },
    readingTimeSeconds: 90,
    plainLanguageExplanation:
      'An FIR (First Information Report) is a document that sets the criminal justice process in motion. The police are legally obligated to register an FIR for cognizable offences — they cannot refuse.',
    content: `An FIR (First Information Report) under Section 154 CrPC is the first step in the criminal justice process. Here is what every citizen needs to know:

**What is an FIR?**
It is a written document prepared by the police when they receive information about a cognizable offence. It is NOT a charge or conviction — it merely records what was reported.

**Who can file an FIR?**
Anyone. You do not need to be the victim. You can file an FIR:
- In person at the police station
- By sending a written letter to the SP/SSP
- Through an online portal (available in most states)
- Through a magistrate (Section 156(3)) if police refuse

**Can the police refuse to register an FIR?**
**NO.** Under Section 154, the police are LEGALLY OBLIGATED to register an FIR for cognizable offences. Refusal to do so is punishable under Section 166A of IPC.

The Supreme Court in **Lalita Kumari v. Government of UP (2014)** made it mandatory:
> "Registration of FIR is mandatory under Section 154 if the information discloses commission of a cognizable offence. No preliminary inquiry is permissible in such a situation."

**If the police refuse:**
1. Send a written complaint to the Superintendent of Police (SP)
2. Approach the magistrate under Section 156(3) to direct FIR registration
3. File a complaint with the State Human Rights Commission

**After FIR is filed:**
- You get a free copy of the FIR (mandatory)
- Investigation begins under Section 156
- Charge sheet must be filed within 60–90 days (depending on offence severity)
- If no charge sheet is filed, you can apply for default bail`,
    keyTakeaways: [
      'Police CANNOT refuse to register an FIR for cognizable offences — it is mandatory',
      'Lalita Kumari (2014) makes FIR registration mandatory, no preliminary inquiry allowed',
      'If police refuse, approach the SP or magistrate under Section 156(3)',
      'You are entitled to a free copy of the FIR',
      'Refusal to register an FIR is itself a punishable offence under Section 166A IPC',
    ],
  },
  {
    id: 'pp-search',
    act: 'CrPC',
    section: 'Section 100',
    title: 'Search of Your Home: Rules Police Must Follow',
    category: 'police-powers',
    difficulty: 'intermediate',
    order: 3,
    jurisdiction: { scope: 'central' },
    readingTimeSeconds: 90,
    plainLanguageExplanation:
      'Police need a search warrant to search your home. Even with a warrant, they must follow strict rules — including having independent witnesses and giving you a copy of the seized items list.',
    content: `The police cannot simply walk into your home and search it. Section 100 CrPC lays down strict rules:

**General Rule: Search warrant required**
Under Section 93, a magistrate must issue a search warrant before police can search private premises. The warrant must specify:
- The place to be searched
- The thing being searched for
- The time period (day or night)

**Rules during search (Section 100):**
1. **Independent witnesses** — At least two respectable inhabitants of the locality must be present as witnesses. The police cannot search your home alone.
2. **Occupant has the right to be present** — The occupant or a representative can watch the search.
3. **List of seized items** — Police must prepare a list of all items seized, signed by the witnesses.
4. **Copy to occupant** — You are entitled to a copy of the seizure list immediately.
5. **Women's privacy** — If a woman's body needs to be searched, it must be done by a female officer only, with strict regard for decency (Section 51(2)).

**When police can search WITHOUT a warrant:**
- Under Section 165 — if the officer has reasonable grounds to believe evidence will be destroyed by the time a warrant is obtained
- Even then, the officer must record reasons in writing BEFORE the search and send a copy to the nearest magistrate

**What to do if police arrive without a warrant:**
- Politely ask to see the warrant
- Note down the officer's name and badge number
- Call two neighbours as witnesses
- Do not physically resist — but note every irregularity
- File a complaint later if rules were violated`,
    keyTakeaways: [
      'Police generally need a search warrant to enter your home',
      'Two independent witnesses from the locality are mandatory during search',
      'You are entitled to a copy of the list of seized items',
      'Even without a warrant (Section 165), police must record written reasons',
      'Do not physically resist — document violations and complain through legal channels',
    ],
  },

  // ── Traffic Laws ─────────────────────────────────────────────────────────
  {
    id: 'tl-challan',
    act: 'Motor Vehicles Act, 1988',
    section: 'Section 183-194',
    title: 'Traffic Challans: Know Your Rights',
    category: 'traffic-laws',
    difficulty: 'beginner',
    order: 1,
    jurisdiction: { scope: 'central' },
    readingTimeSeconds: 90,
    plainLanguageExplanation:
      'When a traffic police officer issues a challan, they must follow specific rules. You have the right to see their ID, receive a proper receipt, and contest the challan in court.',
    content: `Traffic challans (fines) are governed by the Motor Vehicles Act, 1988. After the 2019 amendment, fines were significantly increased. Here is what you need to know:

**Your rights when stopped by traffic police:**

1. **Officer must show ID** — The officer must be in uniform and show identification if requested. A person in plain clothes cannot issue a challan.

2. **Proper challan receipt** — You must receive a written or electronic challan. A verbal demand for money is NOT a valid challan — it is bribery.

3. **Right to contest** — You can contest any challan in the designated traffic court within 30 days.

4. **No vehicle seizure for minor offences** — The police cannot seize your vehicle for minor offences like not carrying a document. They can only impound vehicles in specific situations (Section 207).

**Common offences and fines (post-2019 amendment):**
- Driving without licence: up to Rs 5,000
- Driving without insurance: Rs 2,000 (first), Rs 4,000 (repeat)
- Over-speeding: Rs 1,000–2,000
- Not wearing seatbelt: Rs 1,000
- Not wearing helmet (two-wheeler): Rs 1,000 + licence suspension for 3 months
- Using mobile phone while driving: Rs 5,000
- Drink driving: Rs 10,000 and/or 6 months imprisonment

**E-challan system:**
Most states now use electronic challans with CCTV cameras. These are sent to the registered vehicle owner. You can pay online or contest within 30 days.

**Important:** If you are asked to pay cash on the spot without a receipt, that is extortion, not a lawful fine.`,
    keyTakeaways: [
      'Traffic police must be in uniform and show ID when issuing challans',
      'Always demand a written/electronic receipt — verbal fines are illegal',
      'You can contest any challan in traffic court within 30 days',
      'Vehicles cannot be seized for minor documentation offences',
      'Cash payment without receipt is bribery, not a lawful fine',
    ],
  },
  {
    id: 'tl-drunk',
    act: 'Motor Vehicles Act, 1988',
    section: 'Section 185',
    title: 'Drink Driving: Laws & Consequences',
    category: 'traffic-laws',
    difficulty: 'intermediate',
    order: 2,
    jurisdiction: { scope: 'central' },
    readingTimeSeconds: 75,
    plainLanguageExplanation:
      'Driving under the influence of alcohol or drugs is a criminal offence under Section 185. The legal limit is 30 mg of alcohol per 100 ml of blood. Penalties include jail time, heavy fines, and licence suspension.',
    content: `Section 185 of the Motor Vehicles Act makes driving under the influence of alcohol or drugs a criminal offence.

**The legal limit:**
- Blood Alcohol Content (BAC): 30 mg per 100 ml of blood
- This is one of the lowest thresholds in the world
- Even 1-2 drinks can put you over the limit

**Penalties (post-2019 amendment):**
- **First offence:** Up to 6 months imprisonment AND/OR fine up to Rs 10,000
- **Repeat offence (within 3 years):** Up to 2 years imprisonment AND/OR fine up to Rs 15,000
- Licence suspension or revocation

**Breath analyser test:**
- Police can ask you to take a breath analyser test
- Refusing the test is itself an offence under Section 185
- The test result is admissible as evidence in court

**Your rights during a drink driving check:**
1. The officer must use a calibrated, sealed breath analyser
2. You can request a blood test as a second opinion
3. You are entitled to a medical examination by a registered doctor
4. The officer must record the reading and give you a copy

**Important:** Causing an accident while drunk is treated far more severely. Under Section 304A (causing death by negligence) combined with Section 185, you could face up to 10 years imprisonment.

**Practical note:** There is no safe amount of alcohol for driving in India given the low legal limit. The safest approach is zero alcohol if you plan to drive.`,
    keyTakeaways: [
      'India has one of the lowest legal BAC limits in the world: 30 mg / 100 ml',
      'First offence: up to 6 months jail and/or Rs 10,000 fine',
      'Refusing a breath test is itself a punishable offence',
      'Causing death while drunk driving can lead to up to 10 years imprisonment',
      'There is no "safe" number of drinks before driving in India',
    ],
  },
  {
    id: 'tl-accident',
    act: 'Motor Vehicles Act, 1988',
    section: 'Section 134',
    title: 'Road Accidents: Your Legal Obligations',
    category: 'traffic-laws',
    difficulty: 'beginner',
    order: 3,
    jurisdiction: { scope: 'central' },
    readingTimeSeconds: 75,
    plainLanguageExplanation:
      'If you are involved in a road accident, the law requires you to stop, help the injured, inform police, and not flee the scene. The Good Samaritan law protects people who help accident victims.',
    content: `If you are involved in or witness a road accident, the Motor Vehicles Act requires specific actions:

**Your legal obligations under Section 134:**

1. **Stop immediately** — You must stop your vehicle at or near the scene. Fleeing the scene is a separate criminal offence.

2. **Help the injured** — You must take reasonable steps to secure medical attention for the injured. This can include:
   - Calling an ambulance (108)
   - Transporting the injured to the nearest hospital
   - Providing first aid if you can

3. **Inform the police** — Report the accident to the nearest police station within 24 hours. If you transport the injured to a hospital, give your details to the hospital.

4. **Do not move the vehicle** — Unless absolutely necessary for traffic or to rescue injured persons, leave vehicles where they are until police arrive.

**The Good Samaritan Law (2015):**
The Supreme Court and subsequent government guidelines protect Good Samaritans:
- **No hospital can refuse treatment** to an accident victim — this is a legal obligation
- **Good Samaritans cannot be detained** or forced to become witnesses
- **No civil or criminal liability** for bystanders who help in good faith
- **Police cannot force you** to disclose personal details if you are a Good Samaritan

**Hit and run:**
If the driver flees, the victim can claim compensation from the Motor Accident Claims Tribunal (MACT). The Solatium Fund provides Rs 2 lakh for death and Rs 50,000 for grievous injury in hit-and-run cases.

**Insurance:** Third-party motor insurance (mandatory under Section 146) covers accident liability. Driving without insurance makes you personally liable.`,
    keyTakeaways: [
      'You must stop, help the injured, and inform police — fleeing is a crime',
      'Good Samaritans are legally protected and cannot be detained or harassed',
      'No hospital can refuse treatment to an accident victim',
      'Hit-and-run victims can claim from the Solatium Fund',
      'Third-party insurance is mandatory — driving without it makes you personally liable',
    ],
  },

  // ── Tenancy ──────────────────────────────────────────────────────────────
  {
    id: 'tn-basics',
    act: 'Model Tenancy Act, 2021',
    section: 'Section 4-8',
    title: 'Renting a Home: Essential Rights',
    category: 'tenancy',
    difficulty: 'beginner',
    order: 1,
    jurisdiction: { scope: 'central' },
    readingTimeSeconds: 90,
    plainLanguageExplanation:
      'The Model Tenancy Act 2021 standardises rental agreements across India. It covers security deposits, rent agreements, and both landlord and tenant rights.',
    content: `Renting a home in India is governed by state-specific rent control acts and the Model Tenancy Act, 2021 (which states are adopting gradually).

**Security deposit limits:**
- **Residential:** Maximum 2 months' rent as security deposit
- **Commercial:** Maximum 6 months' rent
- The landlord MUST return the deposit within 1 month of vacating (after deducting legitimate damages)

**Mandatory written agreement:**
- Every tenancy must have a written rental agreement
- The agreement must be registered if the tenancy is for 12 months or more
- Oral agreements are legally weak and hard to enforce

**What the agreement must include:**
- Monthly rent amount and due date
- Security deposit amount
- Duration of tenancy
- Maintenance responsibilities
- Conditions for rent revision (cannot increase more than once a year)
- Notice period for termination

**Tenant rights:**
- **Right to essential services** — Landlord cannot cut water, electricity, or access as a way to force eviction
- **Right to privacy** — Landlord must give 24 hours' notice before visiting
- **Right to receipts** — Demand a receipt for every rent payment
- **No arbitrary eviction** — Landlord must give proper notice and can only evict through legal process

**Landlord rights:**
- Right to timely rent payment
- Right to evict for non-payment (after notice)
- Right to reasonable property inspection (with notice)
- Right to recover property for personal use (with proper notice)`,
    keyTakeaways: [
      'Security deposit is capped at 2 months rent for residential property',
      'Always insist on a written and registered rental agreement',
      'Cutting water/electricity to force eviction is illegal',
      'Landlord must give 24 hours notice before visiting your rented home',
      'Deposit must be returned within 1 month of vacating',
    ],
  },
  {
    id: 'tn-eviction',
    act: 'Model Tenancy Act, 2021',
    section: 'Section 21-22',
    title: 'Eviction: When & How a Landlord Can Ask You to Leave',
    category: 'tenancy',
    difficulty: 'intermediate',
    order: 2,
    jurisdiction: { scope: 'central' },
    readingTimeSeconds: 75,
    plainLanguageExplanation:
      'A landlord cannot simply throw you out. There are strict legal procedures for eviction. Even if your lease has expired, the landlord must go through due process.',
    content: `Eviction is one of the most contentious areas of rental law. The key principle: **a landlord cannot evict you through force or intimidation — only through legal process.**

**Valid grounds for eviction:**
1. Non-payment of rent for 2 or more consecutive months
2. Subletting without landlord's written permission
3. Misuse of the property (using residential for commercial purposes)
4. The property is required for the landlord's own use
5. The property needs substantial repairs that require vacating
6. The tenant has caused significant damage to the property

**Eviction process:**
1. **Written notice** — The landlord must serve a written notice (typically 1-3 months depending on state law)
2. **Opportunity to remedy** — For non-payment, the tenant usually gets 15 days to clear arrears
3. **Filing in Rent Authority/Court** — If the tenant doesn't comply, the landlord must file before the Rent Authority or Rent Court
4. **Court order** — Only after a court order can eviction be enforced
5. **No self-help eviction** — Changing locks, removing belongings, or cutting utilities is ILLEGAL

**What to do if your landlord tries to force you out:**
- Document everything (photos, messages, witnesses)
- File a police complaint if there is physical intimidation
- Approach the Rent Authority or civil court for protection
- Continue paying rent (keep receipts/bank transfer proof)

**Important for tenants:** If you stay beyond the lease period without a new agreement, you become a "tenant at will" — you still have legal protections but your position is weaker.`,
    keyTakeaways: [
      'Forced eviction (changing locks, cutting utilities) is illegal',
      'Only a court order can legally enforce eviction',
      'Non-payment of 2+ months rent is valid grounds for eviction proceedings',
      'Landlord must serve written notice before starting eviction process',
      'Always keep proof of rent payments — bank transfers are safest',
    ],
  },
  {
    id: 'tn-disputes',
    act: 'Model Tenancy Act, 2021',
    section: 'Section 30-33',
    title: 'Rental Disputes: Where to Go for Help',
    category: 'tenancy',
    difficulty: 'intermediate',
    order: 3,
    jurisdiction: { scope: 'central' },
    readingTimeSeconds: 75,
    plainLanguageExplanation:
      'Rental disputes have a dedicated resolution system. The Rent Authority and Rent Court handle disputes — you do not always need a civil court.',
    content: `When a rental dispute arises, there is a structured system for resolution:

**Step 1: Direct negotiation**
Many disputes can be resolved through direct communication. Document all agreements in writing. If the landlord is unresponsive, send a formal legal notice through a lawyer.

**Step 2: Rent Authority**
The Model Tenancy Act establishes Rent Authorities in each district to handle:
- Security deposit disputes
- Maintenance and repair disputes
- Rent revision disputes
- Tenant services disputes (utilities, access)

The Rent Authority must resolve disputes within **60 days**.

**Step 3: Rent Court**
For more serious matters like eviction, the Rent Court handles:
- Eviction proceedings
- Ownership disputes
- Illegal occupation claims

The Rent Court must decide cases within **60 days** and appeals must be disposed of within **90 days**.

**Step 4: Rent Tribunal (Appeal)**
If either party disagrees with the Rent Court decision, an appeal can be filed before the Rent Tribunal within 30 days.

**Common dispute scenarios and remedies:**
- **Deposit not returned:** File before Rent Authority; landlord may have to pay interest
- **Illegal eviction attempt:** File police complaint + approach Rent Court for injunction
- **Excessive rent increase:** Challenge before Rent Authority
- **Property not maintained:** Written notice → Rent Authority → deduct from rent (with permission)

**Legal aid:** If you cannot afford a lawyer, apply to the District Legal Services Authority (DLSA) for free legal aid under the Legal Services Authorities Act, 1987.`,
    keyTakeaways: [
      'Rent Authorities handle deposit, maintenance, and service disputes',
      'Rent Courts handle eviction — decisions must come within 60 days',
      'You can appeal Rent Court decisions to the Rent Tribunal within 30 days',
      'Free legal aid is available through District Legal Services Authority',
      'Always document disputes in writing — emails and registered post create evidence',
    ],
  },

  // ── Consumer Rights ──────────────────────────────────────────────────────
  {
    id: 'cr-basics',
    act: 'Consumer Protection Act, 2019',
    section: 'Section 2(7)',
    title: 'Your Rights as a Consumer',
    category: 'consumer-rights',
    difficulty: 'beginner',
    order: 1,
    jurisdiction: { scope: 'central' },
    readingTimeSeconds: 90,
    plainLanguageExplanation:
      'The Consumer Protection Act 2019 gives you 6 fundamental rights as a consumer, including the right to safety, information, choice, redressal, and consumer education.',
    content: `The Consumer Protection Act, 2019 replaced the older 1986 Act with stronger protections. As a consumer, you have six fundamental rights:

**1. Right to Safety**
Protection against goods and services that are hazardous to life and property. Manufacturers can be held liable for defective products.

**2. Right to Information**
You must be informed about the quality, quantity, potency, purity, standard, and price of goods. MRP (Maximum Retail Price) must be displayed on all packaged goods.

**3. Right to Choose**
Access to a variety of goods at competitive prices. No one can force you to buy bundled products or services you don't want.

**4. Right to be Heard**
Your complaints must be given due attention by consumer forums. The process is designed to be simple and accessible.

**5. Right to Redressal**
You can seek compensation for defective goods, deficient services, unfair trade practices, and restrictive trade practices.

**6. Right to Consumer Education**
You have the right to be informed about consumer rights and responsibilities.

**Who is a "consumer"?**
Anyone who buys goods or hires services for personal use (not for resale or commercial purpose). This includes online purchases.

**What counts as a "complaint"?**
- Defective goods (manufacturing defects, not as advertised)
- Deficient services (poor quality, delayed service)
- Overcharging (charging more than MRP or agreed price)
- Misleading advertisements
- Unfair trade practices

**New in 2019 Act:**
- E-commerce is explicitly covered
- Product liability provisions (manufacturers can be sued directly)
- Central Consumer Protection Authority (CCPA) for class actions
- Mediation as an alternative to litigation`,
    keyTakeaways: [
      'You have 6 fundamental consumer rights including safety, information, and redressal',
      'Online purchases are fully covered under the 2019 Act',
      'Charging above MRP is illegal and grounds for complaint',
      'You can sue manufacturers directly for defective products (product liability)',
      'Consumer forums are designed to be simple and accessible — no lawyer required',
    ],
  },
  {
    id: 'cr-complaint',
    act: 'Consumer Protection Act, 2019',
    section: 'Section 34-37',
    title: 'Filing a Consumer Complaint: Step by Step',
    category: 'consumer-rights',
    difficulty: 'beginner',
    order: 2,
    jurisdiction: { scope: 'central' },
    readingTimeSeconds: 90,
    plainLanguageExplanation:
      'You can file a consumer complaint yourself — no lawyer needed. Complaints can be filed online through the e-Daakhil portal. The process is free for claims up to Rs 5 lakh.',
    content: `Filing a consumer complaint is simpler than most people think. Here is the step-by-step process:

**Where to file:**
- **District Consumer Forum:** Claims up to Rs 1 crore
- **State Consumer Commission:** Claims Rs 1 crore to Rs 10 crore
- **National Consumer Commission:** Claims above Rs 10 crore

**How to file (online — e-Daakhil portal):**
1. Visit edaakhil.nic.in
2. Register with your mobile number
3. Fill in the complaint form
4. Upload supporting documents (bills, photos, correspondence)
5. Pay the filing fee (free for claims up to Rs 5 lakh)
6. Submit — you get a tracking number

**What to include in your complaint:**
- Your details (name, address, contact)
- Details of the opposite party (seller, company, service provider)
- Facts of the complaint (what happened, when, how much you paid)
- Supporting documents (receipts, bills, warranty cards, photos, screenshots)
- Relief sought (refund, replacement, compensation, etc.)

**Time limit:**
File within **2 years** of the date the cause of action arose.

**Filing fees:**
- Up to Rs 5 lakh: FREE
- Rs 5 lakh to Rs 10 lakh: Rs 200
- Rs 10 lakh to Rs 20 lakh: Rs 400
- Rs 20 lakh to Rs 50 lakh: Rs 1,000
- Rs 50 lakh to Rs 1 crore: Rs 2,000

**Timeline for resolution:**
The forum must dispose of the complaint within **3 months** (if no testing is required) or **5 months** (if testing is required).

**Key tip:** Always keep bills, receipts, warranty cards, and written correspondence. Screenshots of online transactions are valid evidence.`,
    keyTakeaways: [
      'Consumer complaints can be filed online at edaakhil.nic.in',
      'Filing is FREE for claims up to Rs 5 lakh — no lawyer needed',
      'File within 2 years of the problem occurring',
      'District Forum handles claims up to Rs 1 crore',
      'Forums must resolve complaints within 3-5 months',
    ],
  },
  {
    id: 'cr-online',
    act: 'Consumer Protection (E-Commerce) Rules, 2020',
    section: 'Rule 4-6',
    title: 'Online Shopping: Your Legal Protections',
    category: 'consumer-rights',
    difficulty: 'intermediate',
    order: 3,
    jurisdiction: { scope: 'central' },
    readingTimeSeconds: 75,
    plainLanguageExplanation:
      'E-commerce platforms must provide clear return/refund policies, accurate product descriptions, and a grievance officer. You have specific rights when shopping online.',
    content: `The Consumer Protection (E-Commerce) Rules, 2020 provide specific protections for online shoppers:

**Platform obligations:**
- Display accurate product descriptions, price (including taxes), and delivery charges
- Clearly state return, refund, exchange, and warranty policies BEFORE purchase
- Provide a grievance redressal mechanism and appoint a Grievance Officer
- Respond to complaints within **48 hours** and resolve within **1 month**
- Display country of origin for imported goods

**Your rights when shopping online:**
1. **Right to accurate information** — Product photos and descriptions must match reality
2. **Right to cancel** — You can cancel orders before shipment (most platforms allow this)
3. **Right to return** — If the product is defective or not as described, you can return it
4. **Right to refund** — Refunds for returned products must be processed within the stated timeline
5. **No forced cancellation** — The seller cannot cancel your order arbitrarily after confirmation

**What is prohibited:**
- Fake reviews and manipulated ratings
- Selling counterfeit goods
- Charging hidden fees not disclosed at the time of purchase
- Discriminatory pricing (showing different prices to different users without transparency)

**Filing complaints for online purchases:**
1. First complain to the platform's Grievance Officer
2. If unresolved within 1 month, escalate to the National Consumer Helpline (1800-11-4000)
3. File a formal complaint on e-Daakhil portal
4. You can file the complaint from where YOU live — not where the seller is located

**Key tip:** Always take screenshots of the product listing, price, and order confirmation before and after purchase.`,
    keyTakeaways: [
      'E-commerce platforms must respond to complaints within 48 hours',
      'Product descriptions must be accurate — misleading listings are actionable',
      'You can file complaints from your own location, not the seller\'s',
      'National Consumer Helpline: 1800-11-4000 (toll-free)',
      'Screenshots of product listings are valid evidence for consumer complaints',
    ],
  },

  // ── Workplace Rights ─────────────────────────────────────────────────────
  {
    id: 'wr-wages',
    act: 'Payment of Wages Act, 1936',
    section: 'Section 3-5',
    title: 'Your Right to Timely Wages',
    category: 'workplace-rights',
    difficulty: 'beginner',
    order: 1,
    jurisdiction: { scope: 'central' },
    readingTimeSeconds: 75,
    plainLanguageExplanation:
      'Your employer must pay your wages on time, without unauthorised deductions. The law sets clear deadlines and limits on what can be deducted from your salary.',
    content: `The Payment of Wages Act, 1936 ensures that workers receive their wages on time and without illegal deductions.

**When must wages be paid?**
- Establishments with fewer than 1,000 workers: before the 7th of the following month
- Establishments with 1,000+ workers: before the 10th of the following month
- On termination: within 2 working days

**Authorised deductions (Section 7):**
Only these deductions are legally permitted:
- Income tax (TDS)
- Provident Fund (PF) contributions
- ESI contributions
- Court-ordered deductions
- Absence from duty (proportionate deduction)
- Damage to property (only with proper inquiry)
- Recovery of advances/loans (with written agreement)

**Total deductions cannot exceed 50% of wages** (75% if deduction includes cooperative society dues).

**What employers CANNOT do:**
- Delay wages beyond the statutory deadline
- Make deductions not authorised by law
- Impose fines without a proper show-cause notice and inquiry
- Withhold wages as punishment
- Pay wages in kind instead of cash/bank transfer (without agreement)

**If your wages are delayed or deducted illegally:**
1. Send a written complaint to the employer
2. File a claim with the Labour Commissioner
3. Approach the Labour Court for recovery
4. The employer can be fined up to Rs 7,500 for wage delays

**New developments — Code on Wages, 2019:**
The government is consolidating 4 wage-related laws into one. Key changes include:
- Universal minimum wage for all workers
- Equal pay for equal work regardless of gender
- Wages include basic pay + DA (dearness allowance)`,
    keyTakeaways: [
      'Wages must be paid by the 7th (small) or 10th (large) of the following month',
      'Total deductions from salary cannot exceed 50% of wages',
      'On termination, wages must be paid within 2 working days',
      'Unauthorised deductions can be challenged before the Labour Commissioner',
      'The Code on Wages 2019 mandates equal pay for equal work regardless of gender',
    ],
  },
  {
    id: 'wr-harassment',
    act: 'POSH Act, 2013',
    section: 'Section 2-4',
    title: 'Workplace Harassment: POSH Act Explained',
    category: 'workplace-rights',
    difficulty: 'intermediate',
    order: 2,
    jurisdiction: { scope: 'central' },
    readingTimeSeconds: 90,
    plainLanguageExplanation:
      'The POSH Act (Prevention of Sexual Harassment) protects all employees from sexual harassment at the workplace. Every employer with 10+ employees must have an Internal Complaints Committee.',
    content: `The Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013 — commonly called the POSH Act — is a critical workplace protection law.

**What constitutes sexual harassment?**
The Act defines it broadly, including:
- Physical contact and advances
- Demand or request for sexual favours
- Making sexually coloured remarks
- Showing pornography
- Any other unwelcome physical, verbal, or non-verbal conduct of a sexual nature

It also covers **quid pro quo** harassment (implied or explicit promise of preferential treatment in exchange for sexual favours, or threats for refusal).

**Who is protected?**
All women working in an organisation, including:
- Regular, temporary, and contractual employees
- Interns and apprentices
- Domestic workers
- Women visiting the workplace (clients, customers)

**Employer obligations:**
Every organisation with 10+ employees MUST:
1. Constitute an Internal Complaints Committee (ICC)
2. The ICC must be headed by a senior woman employee
3. At least half the ICC members must be women
4. Include an external member (from an NGO or legal background)
5. Display POSH policy prominently at the workplace
6. Conduct awareness sessions regularly

**Filing a complaint:**
- File a written complaint with the ICC within **3 months** of the incident
- The ICC must complete its inquiry within **90 days**
- The ICC can recommend: warning, transfer, termination, or compensation
- If the employer has no ICC, file with the Local Complaints Committee (LCC)

**Protection for the complainant:**
- No retaliation allowed against the complainant
- Transfer of the complainant or respondent during inquiry
- Leave of up to 3 months for the complainant during inquiry`,
    keyTakeaways: [
      'Every employer with 10+ employees must have an Internal Complaints Committee',
      'Sexual harassment includes verbal remarks, showing pornography, and quid pro quo',
      'Complaints must be filed within 3 months; inquiry completed within 90 days',
      'ICC must be headed by a senior woman and have at least 50% women members',
      'Retaliation against a complainant is itself a violation of the POSH Act',
    ],
  },
  {
    id: 'wr-termination',
    act: 'Industrial Disputes Act, 1947',
    section: 'Section 25F-N',
    title: 'Wrongful Termination: Know Your Protections',
    category: 'workplace-rights',
    difficulty: 'intermediate',
    order: 3,
    jurisdiction: { scope: 'central' },
    readingTimeSeconds: 75,
    plainLanguageExplanation:
      'Your employer cannot fire you without notice and valid reasons. For workers who have been employed for over a year, specific protections apply including notice pay and retrenchment compensation.',
    content: `Being fired is stressful, but the law provides significant protections against wrongful termination.

**For workmen under the Industrial Disputes Act:**

Section 25F requires that before retrenching (laying off) a workman who has been in continuous service for 1+ year, the employer must:
1. Give **1 month's written notice** (or pay in lieu of notice)
2. Pay **retrenchment compensation**: 15 days' average pay for every completed year of service
3. Notify the appropriate government authority

**Section 25N — Prior permission:**
In establishments with 100+ workers, the employer needs **prior government permission** before:
- Laying off workers
- Retrenching workers
- Closing the establishment

**What counts as wrongful termination:**
- Firing without notice or compensation
- Firing for trade union activities
- Firing for filing a legal complaint against the employer
- Firing during maternity leave (Maternity Benefit Act, 1961)
- Firing based on discrimination (caste, religion, gender)

**What to do if wrongfully terminated:**
1. Demand a written termination letter with reasons
2. Calculate your dues: notice pay + retrenchment compensation + pending wages + leave encashment + gratuity (if 5+ years)
3. File a complaint with the Labour Commissioner for conciliation
4. If conciliation fails, approach the Labour Court/Industrial Tribunal
5. The court can order reinstatement with back wages

**Gratuity (Payment of Gratuity Act, 1972):**
If you have completed 5+ years of continuous service, you are entitled to gratuity: 15 days' wages for each year of service. This must be paid within 30 days of termination.`,
    keyTakeaways: [
      'Employer must give 1 month notice or pay in lieu before termination',
      'Retrenchment compensation: 15 days pay per year of service',
      'Establishments with 100+ workers need government permission to lay off',
      'Firing for union activity, complaints, or during maternity leave is illegal',
      'After 5 years, you are entitled to gratuity — 15 days pay per year of service',
    ],
  },
];

// ---------------------------------------------------------------------------
// Quiz Questions
// ---------------------------------------------------------------------------

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // ── Fundamental Rights quizzes ───────────────────────────────────────────
  { id: 'q-fr1', lessonId: 'fr-art21', jurisdiction: { scope: 'central' },
    scenario: 'A municipal corporation demolishes an unauthorised slum dwelling without any prior notice. The residents claim violation of Article 21. Are they right?',
    options: ['No — unauthorised structures have no legal protection', 'Yes — Article 21 includes the right to shelter, and due process must be followed even for demolitions', 'Only if the residents are Indian citizens', 'Only if they have a court order preventing demolition'],
    correctIndex: 1, explanation: 'The Supreme Court has held that the right to shelter is part of Article 21. Even illegal structures cannot be demolished without following due process (notice, hearing, relocation assistance).' },
  { id: 'q-fr2', lessonId: 'fr-art22', jurisdiction: { scope: 'central' },
    scenario: 'Ravi is arrested at 2 AM on a Monday. He is produced before a magistrate on Wednesday afternoon. Has any law been violated?',
    options: ['No — 48 hours is the rule', 'Yes — he must be produced within 24 hours, excluding travel time', 'Only if the offence is bailable', 'No — the police have 72 hours for serious offences'],
    correctIndex: 1, explanation: 'Article 22(2) mandates production before the nearest magistrate within 24 hours of arrest (excluding travel time). Monday 2 AM to Wednesday afternoon exceeds this limit.' },
  { id: 'q-fr3', lessonId: 'fr-art19', jurisdiction: { scope: 'central' },
    scenario: 'A social media user posts a meme criticising a government policy. The police threaten to arrest them under Section 66A of the IT Act. Is the arrest valid?',
    options: ['Yes — criticising the government online is illegal', 'Yes — if the meme is offensive to any community', 'No — Section 66A was struck down by the Supreme Court in 2015 as unconstitutional', 'It depends on whether the post went viral'],
    correctIndex: 2, explanation: 'The Supreme Court struck down Section 66A in Shreya Singhal v. Union of India (2015). Mere criticism or offensive speech online is not criminal. Despite this, some police stations still wrongly invoke it.' },

  // ── Police Powers quizzes ────────────────────────────────────────────────
  { id: 'q-pp1', lessonId: 'pp-arrest', jurisdiction: { scope: 'central' },
    scenario: 'A police officer arrests a man for theft (punishable up to 3 years) without first issuing a notice of appearance. Is this legal?',
    options: ['Yes — police can arrest anyone for theft', 'No — for offences up to 7 years, Section 41A requires a notice of appearance first', 'Yes — but only in daytime', 'No — the police need a warrant for theft'],
    correctIndex: 1, explanation: 'Under the 2009 amendment to Section 41, for offences punishable up to 7 years, police should first issue a notice of appearance (Section 41A). Direct arrest should be a last resort.' },
  { id: 'q-pp2', lessonId: 'pp-fir', jurisdiction: { scope: 'central' },
    scenario: 'You go to a police station to report a chain-snatching incident. The officer says "We will look into it" but does not write an FIR. What can you do?',
    options: ['Nothing — the police decide whether to file an FIR', 'Send a written complaint to the SP and approach a magistrate under Section 156(3)', 'File a complaint on social media', 'Only a lawyer can file an FIR'],
    correctIndex: 1, explanation: 'Chain snatching is a cognizable offence. Under Lalita Kumari v. Government of UP (2014), FIR registration is mandatory. If the station refuses, you can approach the SP or magistrate under Section 156(3).' },
  { id: 'q-pp3', lessonId: 'pp-search', jurisdiction: { scope: 'central' },
    scenario: 'Police officers arrive at your home at 11 PM and say they need to search for stolen goods. They do not have a search warrant. What are your rights?',
    options: ['You must let them in — they are police', 'You can refuse entry and ask for a warrant; note down their details', 'You should run away', 'Call a lawyer and wait inside for 3 hours'],
    correctIndex: 1, explanation: 'Without a warrant, police generally cannot search a home. You can politely refuse entry and ask to see the warrant. Note their names and badge numbers. Do not physically resist but document everything.' },

  // ── Traffic Laws quizzes ─────────────────────────────────────────────────
  { id: 'q-tl1', lessonId: 'tl-challan', jurisdiction: { scope: 'central' },
    scenario: 'A traffic police officer in plain clothes stops you and demands Rs 500 for over-speeding without giving any receipt. What should you do?',
    options: ['Pay the Rs 500 and leave', 'Ask for their ID and a proper e-challan receipt — verbal fines without receipt are not valid', 'Argue loudly and refuse to stop', 'Pay and then file an RTI later'],
    correctIndex: 1, explanation: 'Traffic officers must be in uniform and issue a proper challan (written or electronic). A verbal demand for cash without a receipt is not a lawful fine — it constitutes bribery.' },
  { id: 'q-tl2', lessonId: 'tl-drunk', jurisdiction: { scope: 'central' },
    scenario: 'After two beers at dinner, you drive home and are stopped at a checkpoint. The officer asks you to take a breath test. Can you refuse?',
    options: ['Yes — breath tests are optional', 'No — refusing a breath test is itself a punishable offence under Section 185', 'Yes — if you feel sober enough to drive', 'Only if your BAC is below 30 mg'],
    correctIndex: 1, explanation: 'Under Section 185 of the Motor Vehicles Act, refusing to take a breath analyser test when asked by a police officer is itself a punishable offence. You can, however, request a blood test as a second opinion.' },
  { id: 'q-tl3', lessonId: 'tl-accident', jurisdiction: { scope: 'central' },
    scenario: 'You see a road accident victim bleeding on the highway. You are afraid to help because you might get dragged into police proceedings. Are your fears justified?',
    options: ['Yes — never get involved in accidents', 'No — the Good Samaritan law protects you from police harassment and legal liability', 'Only if you are a doctor', 'Only if there are other witnesses present'],
    correctIndex: 1, explanation: 'The Good Samaritan Law (Supreme Court guidelines + government rules) protects bystanders who help accident victims. You cannot be detained, forced to be a witness, or held liable for helping in good faith.' },

  // ── Tenancy quizzes ──────────────────────────────────────────────────────
  { id: 'q-tn1', lessonId: 'tn-basics', jurisdiction: { scope: 'central' },
    scenario: 'Your landlord demands 6 months rent as a security deposit for a residential flat. Is this legal under the Model Tenancy Act?',
    options: ['Yes — the landlord can set any deposit amount', 'No — the maximum is 2 months rent for residential property', 'It depends on the city', 'Only if the flat is furnished'],
    correctIndex: 1, explanation: 'Under the Model Tenancy Act, 2021, the security deposit for residential premises is capped at 2 months rent. For commercial premises, the cap is 6 months.' },
  { id: 'q-tn2', lessonId: 'tn-eviction', jurisdiction: { scope: 'central' },
    scenario: 'Your lease ended 2 months ago and you have not signed a new one. Your landlord changes the locks while you are at work and puts your belongings outside. Is this legal?',
    options: ['Yes — the lease is over, so the landlord can take the property back', 'No — eviction must go through the Rent Court; self-help eviction is illegal', 'Only if the landlord gave verbal notice', 'Yes — if the landlord owns the property'],
    correctIndex: 1, explanation: 'Even after lease expiry, eviction must follow legal process (notice → Rent Authority/Court → court order). Changing locks, removing belongings, or cutting utilities without a court order is illegal self-help eviction.' },
  { id: 'q-tn3', lessonId: 'tn-disputes', jurisdiction: { scope: 'central' },
    scenario: 'You vacated your flat 2 months ago but the landlord still has not returned your security deposit. What is the most effective first step?',
    options: ['Post about it on social media', 'Send a formal written demand and file with the Rent Authority if not returned within 1 month', 'Break into the flat to recover your belongings', 'Simply forget about it'],
    correctIndex: 1, explanation: 'Under the Model Tenancy Act, the deposit must be returned within 1 month of vacating. Send a written demand first. If ignored, file a complaint with the Rent Authority which must resolve it within 60 days.' },

  // ── Consumer Rights quizzes ──────────────────────────────────────────────
  { id: 'q-cr1', lessonId: 'cr-basics', jurisdiction: { scope: 'central' },
    scenario: 'A shopkeeper sells you a packaged food item at Rs 120 when the MRP printed on the packet is Rs 100. Is this legal?',
    options: ['Yes — shops can charge what they want', 'No — charging above MRP is illegal and you can file a consumer complaint', 'Only if the shop is in a mall', 'Yes — if the shopkeeper claims "taxes extra"'],
    correctIndex: 1, explanation: 'MRP includes all taxes. Selling above MRP is a violation of the Legal Metrology Act and the Consumer Protection Act. You can file a complaint with the consumer forum or call 1800-11-4000.' },
  { id: 'q-cr2', lessonId: 'cr-complaint', jurisdiction: { scope: 'central' },
    scenario: 'You bought a washing machine that stopped working after 3 months within the warranty period. The company refuses to repair it. How much does it cost to file a consumer complaint?',
    options: ['Rs 5,000 minimum', 'Rs 500 flat fee', 'FREE — for claims up to Rs 5 lakh, there is no filing fee', 'You need a lawyer, so at least Rs 10,000'],
    correctIndex: 2, explanation: 'Filing a consumer complaint is free for claims up to Rs 5 lakh. You can file online at edaakhil.nic.in without a lawyer. The forum must resolve it within 3-5 months.' },
  { id: 'q-cr3', lessonId: 'cr-online', jurisdiction: { scope: 'central' },
    scenario: 'You ordered a blue shirt from an e-commerce platform but received a red one. The platform says "no returns" in their policy. Can you still return it?',
    options: ['No — you agreed to the return policy', 'Yes — if the product received does not match the listing, you have the right to return or refund', 'Only if the price was above Rs 1,000', 'Only within 24 hours'],
    correctIndex: 1, explanation: 'Under the Consumer Protection (E-Commerce) Rules, 2020, product descriptions must be accurate. Receiving a product that does not match the listing is grounds for return/refund regardless of the platform\'s stated return policy.' },

  // ── Workplace Rights quizzes ─────────────────────────────────────────────
  { id: 'q-wr1', lessonId: 'wr-wages', jurisdiction: { scope: 'central' },
    scenario: 'Your employer deducts Rs 3,000 from your salary as a "fine" for coming late, without any prior warning or show-cause notice. Is this legal?',
    options: ['Yes — employers can fine workers for tardiness', 'No — fines require prior notice and a show-cause inquiry; unauthorised deductions are illegal', 'Only if the amount is less than Rs 5,000', 'Yes — if it is mentioned in the offer letter'],
    correctIndex: 1, explanation: 'Under the Payment of Wages Act, fines can only be imposed after a show-cause notice and proper inquiry. The fine amount is also capped. Arbitrary deductions without following due process are illegal.' },
  { id: 'q-wr2', lessonId: 'wr-harassment', jurisdiction: { scope: 'central' },
    scenario: 'A woman working in a company with 15 employees faces repeated inappropriate comments from a colleague. The company says they are "too small" to have a complaints committee. Is this correct?',
    options: ['Yes — small companies are exempt', 'No — every employer with 10 or more employees must have an Internal Complaints Committee', 'Only government offices need a complaints committee', 'Only if the company has an HR department'],
    correctIndex: 1, explanation: 'Under the POSH Act, 2013, every employer with 10 or more employees is legally required to constitute an Internal Complaints Committee (ICC). Not having one is itself a violation punishable with fine up to Rs 50,000.' },
  { id: 'q-wr3', lessonId: 'wr-termination', jurisdiction: { scope: 'central' },
    scenario: 'After working for 3 years, you are terminated without any notice or compensation. Your employer says "at-will employment means we can fire you anytime." Is this correct in India?',
    options: ['Yes — Indian law follows at-will employment', 'No — Indian law requires notice, retrenchment compensation, and valid grounds for termination', 'Only for government jobs', 'Only if you were a permanent employee'],
    correctIndex: 1, explanation: 'India does NOT follow "at-will" employment. The Industrial Disputes Act requires 1 month notice (or pay in lieu) and retrenchment compensation of 15 days pay per year of service for workers with 1+ year of service.' },
];
