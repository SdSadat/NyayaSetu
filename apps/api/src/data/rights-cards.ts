import type { RightsCard } from '@nyayasetu/shared-types';

export const RIGHTS_CARDS: RightsCard[] = [
  // ── STANDARD CARDS ─────────────────────────────────────────────────────────

  {
    id: 'std-fundamental-arrest',
    variant: 'standard',
    category: 'fundamental-rights',
    title: 'Rights When Arrested',
    subtitle: 'What the Constitution guarantees at the moment of arrest',
    legalRef: 'Article 22, Constitution of India · Sections 50–56 CrPC',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-12-01',
    lessonId: 'fundamental-rights-1',
    tags: ['arrest', 'detention', 'police', 'bail'],
    rights: [
      'Right to be told the grounds of arrest immediately.',
      'Right to consult and be defended by a lawyer of your choice.',
      'Right to be produced before a magistrate within 24 hours.',
    ],
    duties: [
      'Remain calm and do not physically resist a lawful arrest.',
      'Provide your correct name and address when asked.',
    ],
    safetyTip: 'Say clearly: "I want to speak to a lawyer." You do not have to answer questions until your lawyer arrives.',
  },

  {
    id: 'std-workplace-wages',
    variant: 'standard',
    category: 'workplace-rights',
    title: 'Wage & Payment Rights',
    subtitle: 'Your entitlements when it comes to salary and payment',
    legalRef: 'Payment of Wages Act 1936 · Minimum Wages Act 1948',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-11-15',
    lessonId: 'workplace-rights-1',
    tags: ['salary', 'wages', 'employer', 'payment'],
    rights: [
      'Right to receive wages on time — within 7 days of wage period end (establishments ≤1000 workers).',
      'Right to receive wages in legal tender (cash or bank transfer) — not goods or tokens.',
      'Right to a minimum wage set by the relevant state government for your category of work.',
    ],
    duties: [
      'Keep copies of your appointment letter and payslips as proof.',
      'Report underpayment to the Labour Inspector for your district.',
    ],
    safetyTip: 'Employer deductions must be authorised by law. Unauthorised deductions can be challenged before the Payment of Wages Authority.',
  },

  {
    id: 'std-consumer-defective',
    variant: 'standard',
    category: 'consumer-rights',
    title: 'Right Against Defective Goods',
    subtitle: 'What to do when a product fails or is defective',
    legalRef: 'Consumer Protection Act 2019 · Sections 2(10), 35, 47',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-10-20',
    lessonId: 'consumer-rights-1',
    tags: ['defective product', 'refund', 'complaint', 'consumer forum'],
    rights: [
      'Right to replacement, repair, or full refund for a product with a manufacturing defect.',
      'Right to compensation for any injury or loss caused by the defective product.',
      'Right to file a complaint at the District Consumer Commission (claims up to ₹1 crore).',
    ],
    duties: [
      'Keep the original bill/invoice and packaging as proof of purchase.',
      'File the complaint within two years of the defect being discovered.',
    ],
    safetyTip: 'You can file online at consumerhelpline.gov.in or call 1800-11-4000 (toll-free) for guidance.',
  },

  {
    id: 'std-tenancy-eviction',
    variant: 'standard',
    category: 'tenancy',
    title: 'Protection Against Illegal Eviction',
    subtitle: 'Landlords cannot remove you without following due process',
    legalRef: 'Transfer of Property Act 1882 · State Rent Control Acts',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-09-10',
    lessonId: 'tenancy-1',
    tags: ['eviction', 'landlord', 'rent', 'notice'],
    rights: [
      'Right to receive a written notice before eviction — typically 15–30 days depending on state law.',
      'Right to contest eviction in a Rent Control Court before being removed.',
      'Right to remain in possession until a court order directs otherwise.',
    ],
    duties: [
      'Pay agreed rent on time and keep proof of payment (receipts or bank transfers).',
      'Maintain the premises in reasonable condition and follow agreed terms.',
    ],
    safetyTip: 'A landlord physically locking you out without a court order is an offence. You can approach a magistrate under Section 145 CrPC for restoration of possession.',
  },

  // ── CRISIS CARDS ───────────────────────────────────────────────────────────

  {
    id: 'crisis-police-detention',
    variant: 'crisis',
    category: 'police-powers',
    title: 'Detained by Police',
    subtitle: 'Immediate steps if you are stopped or detained',
    legalRef: 'Article 22 Constitution · Section 50 CrPC',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-12-01',
    lessonId: 'police-powers-1',
    tags: ['detained', 'custody', 'police', 'emergency'],
    situation: 'You have been stopped and detained by police officers.',
    doNow: [
      'Stay calm. Do not run or physically resist.',
      'Ask clearly: "Am I under arrest? What is the reason?"',
      'Immediately call a family member or lawyer — you have this right.',
      'Remember badge numbers and officer names if possible.',
    ],
    doNotDo: [
      'Do not sign any document without your lawyer present.',
      'Do not answer questions beyond confirming your name and address.',
      'Do not hand over your phone without a proper search warrant.',
    ],
    helplineNumber: '14567',
    helplineLabel: 'National Human Rights Commission Helpline',
  },

  {
    id: 'crisis-workplace-harassment',
    variant: 'crisis',
    category: 'workplace-rights',
    title: 'Facing Workplace Harassment',
    subtitle: 'Steps if you experience sexual harassment or bullying at work',
    legalRef: 'POSH Act 2013 · IPC Section 354A',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-11-01',
    tags: ['harassment', 'posh', 'workplace', 'complaint'],
    situation: 'You are experiencing harassment or hostile behaviour at your workplace.',
    doNow: [
      'Document every incident: date, time, place, witnesses, exact words or actions.',
      'File a written complaint with the Internal Complaints Committee (ICC) — every employer with 10+ employees must have one.',
      'If no ICC exists, file with the District Officer (Local Complaints Committee).',
      'Keep copies of all correspondence with your employer.',
    ],
    doNotDo: [
      'Do not delay beyond 3 months of the last incident — ICC complaints have a time limit.',
      'Do not confront the harasser alone or without witnesses.',
      'Do not assume HR will always be neutral — you can go to the District Officer directly.',
    ],
    helplineNumber: '181',
    helplineLabel: 'Women Helpline (24×7)',
  },

  {
    id: 'crisis-illegal-eviction',
    variant: 'crisis',
    category: 'tenancy',
    title: 'Landlord Locking You Out',
    subtitle: 'Immediate steps if you are forcibly evicted without court order',
    legalRef: 'Section 145 CrPC · State Rent Control Acts',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-09-15',
    tags: ['eviction', 'lockout', 'landlord', 'emergency'],
    situation: 'Your landlord has changed locks or forcibly removed you without a court order.',
    doNow: [
      'Call police (112) and report the illegal lockout — this is a criminal act.',
      'Photograph or video the locked premises and any signs of forced entry.',
      'Approach the nearest Magistrate Court for a Section 145 CrPC order to restore possession.',
      'Contact a legal aid centre if you cannot afford a lawyer (free under NALSA).',
    ],
    doNotDo: [
      'Do not break in yourself — even if it is your home — without a court order.',
      'Do not accept a settlement under pressure without written documentation.',
      'Do not vacate voluntarily under threats before consulting a lawyer.',
    ],
    helplineNumber: '15100',
    helplineLabel: 'National Legal Services Authority (NALSA)',
  },

  // ── MYTH BUSTER CARDS ──────────────────────────────────────────────────────

  {
    id: 'myth-police-powers',
    variant: 'myth-buster',
    category: 'police-powers',
    title: 'Police Powers — Myth vs Law',
    subtitle: 'Common misconceptions about what police can and cannot do',
    legalRef: 'CrPC Sections 41, 49, 50, 160 · Evidence Act',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-12-01',
    lessonId: 'police-powers-2',
    tags: ['police', 'arrest', 'search', 'rights'],
    myths: [
      {
        myth: 'Police can arrest anyone without a warrant at any time.',
        reality: 'Police can arrest without a warrant only for cognisable offences listed in Schedule 1 of CrPC. For non-cognisable offences, a magistrate order is required.',
        legalBasis: 'Section 41, CrPC',
      },
      {
        myth: 'You must unlock your phone for police if they ask.',
        reality: 'Police need a lawful search warrant to compel access to a digital device. You can refuse without a warrant.',
        legalBasis: 'Section 165 CrPC · Article 20(3) Constitution',
      },
      {
        myth: 'Remaining silent means you are guilty.',
        reality: 'You have the absolute right to remain silent. Silence cannot be used as evidence of guilt.',
        legalBasis: 'Article 20(3) Constitution of India',
      },
    ],
  },

  {
    id: 'myth-consumer-rights',
    variant: 'myth-buster',
    category: 'consumer-rights',
    title: 'Consumer Rights — Myth vs Law',
    subtitle: 'What sellers claim and what the law actually says',
    legalRef: 'Consumer Protection Act 2019',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-10-20',
    lessonId: 'consumer-rights-2',
    tags: ['refund', 'warranty', 'return', 'consumer'],
    myths: [
      {
        myth: '"No refund, no exchange" policies are legally binding.',
        reality: 'Such policies cannot override your statutory right to refund for defective goods or deficient services under the Consumer Protection Act.',
        legalBasis: 'Section 2(10), Consumer Protection Act 2019',
      },
      {
        myth: 'You can only complain to the company — courts are for big issues.',
        reality: 'You can file a case directly at the District Consumer Commission for claims up to ₹1 crore with a simple affidavit and no lawyer required.',
        legalBasis: 'Section 35, Consumer Protection Act 2019',
      },
      {
        myth: 'Warranty only covers manufacturing defects shown at purchase.',
        reality: 'Warranty covers defects that arise within the warranty period, even if not visible at purchase. Hidden defects are also covered.',
        legalBasis: 'Section 2(34), Consumer Protection Act 2019',
      },
    ],
  },

  {
    id: 'myth-fundamental-rights',
    variant: 'myth-buster',
    category: 'fundamental-rights',
    title: 'Fundamental Rights — Myth vs Law',
    subtitle: 'Clearing confusion about your constitutional guarantees',
    legalRef: 'Part III, Constitution of India',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-11-10',
    lessonId: 'fundamental-rights-2',
    tags: ['constitution', 'rights', 'state', 'citizen'],
    myths: [
      {
        myth: 'Fundamental Rights only apply against the government.',
        reality: 'While most rights are against the State, some (like right against untouchability, forced labour) apply against private individuals too.',
        legalBasis: 'Articles 17, 23 — Constitution of India',
      },
      {
        myth: 'Freedom of speech means you can say anything without consequence.',
        reality: 'Article 19(2) allows "reasonable restrictions" on speech for sovereignty, public order, decency, and defamation.',
        legalBasis: 'Article 19(1)(a) and 19(2), Constitution of India',
      },
      {
        myth: 'You need a lawyer to enforce Fundamental Rights.',
        reality: 'You can file a writ petition directly in the High Court or Supreme Court without a lawyer (though one is recommended).',
        legalBasis: 'Articles 226 and 32, Constitution of India',
      },
    ],
  },

  // ── PROCEDURE CARDS ────────────────────────────────────────────────────────

  {
    id: 'proc-traffic-challan',
    variant: 'procedure',
    category: 'traffic-laws',
    title: 'Contesting a Traffic Challan',
    subtitle: 'Step-by-step process to challenge a wrongful traffic fine',
    legalRef: 'Motor Vehicles Act 1988 · Section 206',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-10-01',
    lessonId: 'traffic-laws-1',
    tags: ['challan', 'fine', 'traffic', 'court'],
    scenario: 'You received a traffic challan you believe is incorrect or unjust.',
    steps: [
      {
        label: 'Collect evidence on the spot',
        description: 'Photograph your vehicle, the location, relevant road signs, and your documents. Note the officer\'s name, badge number, and time.',
        documents: ['Driving licence', 'Vehicle RC', 'Insurance certificate'],
      },
      {
        label: 'Do not pay if you dispute',
        description: 'Paying the challan online is treated as an admission of guilt. If you plan to contest, do not pay and instead mark the challan as "disputed."',
      },
      {
        label: 'Appear before the Traffic Magistrate',
        description: 'The challan will specify the date and court. Appear in person or through a lawyer on the specified date.',
        authority: 'Traffic Magistrate / Judicial Magistrate First Class',
        documents: ['Original challan', 'Vehicle documents', 'Any photographic evidence'],
      },
      {
        label: 'Present your case',
        description: 'Explain the facts clearly and submit your evidence. The magistrate will hear both sides.',
      },
      {
        label: 'Receive the order',
        description: 'If found not guilty, the challan is cancelled. If guilty, you pay the fine as ordered by the court.',
      },
    ],
    commonFailurePoints: [
      'Paying the fine online before consulting a lawyer (treated as guilty plea).',
      'Not noting down officer details at the time of the stop.',
      'Missing the court date without applying for an adjournment.',
    ],
    timeframe: 'First hearing typically within 30–90 days of challan date.',
  },

  {
    id: 'proc-consumer-complaint',
    variant: 'procedure',
    category: 'consumer-rights',
    title: 'Filing a Consumer Complaint',
    subtitle: 'How to take a seller or service provider to the Consumer Commission',
    legalRef: 'Consumer Protection Act 2019 · Sections 35–40',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-10-20',
    lessonId: 'consumer-rights-1',
    tags: ['complaint', 'consumer forum', 'refund', 'defective'],
    scenario: 'A seller or service provider has wronged you and refused to remedy the issue.',
    steps: [
      {
        label: 'Send a legal notice first',
        description: 'Write a formal notice to the seller specifying the defect, your demand (refund/repair/replacement), and a 15–30 day deadline to respond.',
        documents: ['Notice letter', 'Invoice/bill', 'Product photos'],
      },
      {
        label: 'Prepare your complaint',
        description: 'Draft a written complaint with: your name and address, opposite party details, facts of the case, reliefs sought, and supporting documents.',
        documents: ['Complaint affidavit', 'Invoice', 'Warranty card', 'Correspondence proof', 'Expert report (if any)'],
      },
      {
        label: 'File at the correct Commission',
        description: 'District Commission for claims up to ₹1 crore. State Commission for ₹1–10 crore. National Commission for above ₹10 crore.',
        authority: 'District Consumer Disputes Redressal Commission',
      },
      {
        label: 'Pay the filing fee',
        description: 'Fees range from ₹200–₹7500 depending on claim amount. Fee is waived for Below Poverty Line complainants.',
      },
      {
        label: 'Attend hearings',
        description: 'The Commission will serve notice to the opposite party. Both sides present their case. You can represent yourself without a lawyer.',
      },
    ],
    commonFailurePoints: [
      'Filing after the 2-year limitation period from the date of cause of action.',
      'Filing at the wrong commission level (wrong pecuniary jurisdiction).',
      'Not keeping originals of all documents — only submitting photocopies.',
    ],
    timeframe: 'Target 90–150 days for District Commission orders (though delays are common).',
  },

  {
    id: 'proc-labour-complaint',
    variant: 'procedure',
    category: 'workplace-rights',
    title: 'Filing a Wage / Labour Complaint',
    subtitle: 'Steps to recover unpaid wages or report labour law violations',
    legalRef: 'Payment of Wages Act 1936 · Industrial Disputes Act 1947',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-11-01',
    tags: ['wages', 'unpaid', 'labour', 'complaint'],
    scenario: 'Your employer has not paid your wages or has violated labour law.',
    steps: [
      {
        label: 'Collect proof of employment and wages',
        description: 'Gather your appointment letter, payslips, bank statements showing salary credits, and any written communications about the dispute.',
        documents: ['Appointment letter', 'Payslips or salary receipts', 'Bank statements'],
      },
      {
        label: 'Write to your employer',
        description: 'Send a written demand (letter or email) specifying the unpaid amount, period, and a deadline of 7–14 days to pay.',
      },
      {
        label: 'File with the Labour Inspector',
        description: 'Approach the Labour Inspector (or Assistant Labour Commissioner) for your district with a written complaint.',
        authority: 'District Labour Office',
        documents: ['Written complaint', 'Proof of employment', 'Proof of non-payment'],
      },
      {
        label: 'File an application with the Payment of Wages Authority',
        description: 'If wages are under the Payment of Wages Act, file an application before the Authority for recovery of dues within 1 year of the payment date.',
        authority: 'Payment of Wages Authority (usually the Labour Commissioner)',
      },
      {
        label: 'Appeal if needed',
        description: 'If the Authority\'s order is unsatisfactory, appeal before the High Court under Section 17 of the Payment of Wages Act.',
      },
    ],
    commonFailurePoints: [
      'No written proof of employment (relying only on verbal agreement).',
      'Missing the 1-year limitation period for wage claims.',
      'Not filing with the correct district Labour Office (jurisdiction matters).',
    ],
    timeframe: 'Labour Inspector enquiry: 30–60 days. Authority order: 3–6 months.',
  },

  {
    id: 'proc-fir-filing',
    variant: 'procedure',
    category: 'police-powers',
    title: 'Filing a FIR',
    subtitle: 'How to register a First Information Report if police refuse',
    legalRef: 'Section 154 CrPC · Section 166A IPC',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-12-01',
    tags: ['FIR', 'complaint', 'police', 'crime'],
    scenario: 'A cognisable offence has occurred and you need to register an FIR.',
    steps: [
      {
        label: 'Go to the relevant police station',
        description: 'FIR must be filed at the station where the offence occurred. Take an ID proof and a written account of the incident.',
        documents: ['ID proof (Aadhaar/Voter ID)', 'Written account of incident'],
      },
      {
        label: 'Insist on a written FIR',
        description: 'Police MUST register the FIR for cognisable offences — they cannot refuse. Ask for a signed copy free of charge.',
      },
      {
        label: 'If police refuse, approach the SP/DCP',
        description: 'Send a written complaint by registered post to the Superintendent of Police or DCP. They can direct registration.',
        authority: 'Superintendent of Police (SP) / Deputy Commissioner of Police (DCP)',
      },
      {
        label: 'File a magistrate complaint',
        description: 'If still refused, file a complaint under Section 156(3) CrPC before the Judicial Magistrate who can order the police to register the FIR.',
        authority: 'Judicial Magistrate First Class (JMFC)',
      },
      {
        label: 'Get your FIR copy',
        description: 'Once registered, you are entitled to a free copy immediately. Keep it safely — it is your official record of the complaint.',
      },
    ],
    commonFailurePoints: [
      'Going to the wrong police station (wrong jurisdiction).',
      'Not getting a written acknowledgment when police claim they will "look into it."',
      'Waiting too long — delay in FIR filing can be used against you in court.',
    ],
    timeframe: 'FIR should be registered immediately. Magistrate direction: within 7–15 days if applied.',
  },

  // ── QUICK REFERENCE CARDS ──────────────────────────────────────────────────

  {
    id: 'qref-traffic-stops',
    variant: 'quick-ref',
    category: 'traffic-laws',
    title: 'Traffic Stop Quick Reference',
    subtitle: 'Your rights and obligations when stopped by traffic police',
    legalRef: 'Motor Vehicles Act 1988 · Sections 130, 185, 206',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-10-01',
    lessonId: 'traffic-laws-2',
    tags: ['traffic', 'police', 'documents', 'stop'],
    rows: [
      {
        situation: 'Officer asks to see licence',
        yourRight: 'You must produce it. A digital RC/licence on DigiLocker is legally valid.',
        legalSource: 'Section 130, MVA 1988',
      },
      {
        situation: 'Officer demands your key',
        yourRight: 'You do not have to give your key unless under lawful arrest.',
        legalSource: 'Section 49 CrPC',
      },
      {
        situation: 'Officer wants to search your vehicle',
        yourRight: 'Demand to know the reason. A search requires "reasonable grounds to believe." Ask for a copy of any seizure memo.',
        legalSource: 'Section 165 CrPC',
      },
      {
        situation: 'Challan is issued',
        yourRight: 'You may pay on the spot or contest in court. Paying is admission of guilt.',
        legalSource: 'Section 206, MVA 1988',
      },
      {
        situation: 'Vehicle is seized',
        yourRight: 'Demand a written seizure receipt. Vehicle must be returned on paying fine or court order.',
        legalSource: 'Section 207, MVA 1988',
      },
    ],
    bottomNote: 'Always stay calm. If you believe your rights are violated, note the officer\'s name and badge number and file a complaint with the SP/DCP.',
  },

  {
    id: 'qref-tenancy-rights',
    variant: 'quick-ref',
    category: 'tenancy',
    title: 'Tenant Rights Quick Reference',
    subtitle: 'Key entitlements for residential tenants across common situations',
    legalRef: 'Transfer of Property Act 1882 · State Rent Control Acts',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-09-10',
    lessonId: 'tenancy-2',
    tags: ['tenant', 'rent', 'landlord', 'deposit'],
    rows: [
      {
        situation: 'Landlord increases rent suddenly',
        yourRight: 'Rent increase requires notice and must comply with state Rent Control Act limits. Check your state\'s specific rules.',
        legalSource: 'State Rent Control Act',
      },
      {
        situation: 'Landlord refuses to return security deposit',
        yourRight: 'Deposit must be returned within agreed time (typically 30–60 days) after vacancy minus documented deductions.',
        legalSource: 'Model Tenancy Act 2021 · Section 10',
      },
      {
        situation: 'Landlord enters without permission',
        yourRight: 'Landlord must give 24-hour notice before entry (except genuine emergency).',
        legalSource: 'Model Tenancy Act 2021 · Section 19',
      },
      {
        situation: 'Essential services cut off (water/power)',
        yourRight: 'Landlord cannot cut off essential services as a means of eviction. This is a criminal offence.',
        legalSource: 'Model Tenancy Act 2021 · Section 14',
      },
      {
        situation: 'Eviction notice received',
        yourRight: 'You cannot be evicted without a court order. Notice alone is not sufficient to require you to leave.',
        legalSource: 'Section 111, Transfer of Property Act 1882',
      },
    ],
    bottomNote: 'Laws vary significantly by state. Contact your District Legal Services Authority (DLSA) for state-specific advice — first consultation is free.',
  },

  {
    id: 'qref-fundamental-rights',
    variant: 'quick-ref',
    category: 'fundamental-rights',
    title: 'Fundamental Rights at a Glance',
    subtitle: 'Core constitutional rights every citizen must know',
    legalRef: 'Part III, Articles 12–35, Constitution of India',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-11-10',
    lessonId: 'fundamental-rights-1',
    tags: ['constitution', 'rights', 'liberty', 'equality'],
    rows: [
      {
        situation: 'Discriminated against by a government body',
        yourRight: 'Right to Equality — the State cannot discriminate on grounds of religion, race, caste, sex, or place of birth.',
        legalSource: 'Article 15, Constitution',
      },
      {
        situation: 'Forced labour or bonded labour',
        yourRight: 'Right against exploitation — forced labour is absolutely prohibited and a criminal offence.',
        legalSource: 'Article 23, Constitution',
      },
      {
        situation: 'Arrested or detained',
        yourRight: 'Right to know grounds, right to a lawyer, right to be produced before a magistrate within 24 hours.',
        legalSource: 'Article 22, Constitution',
      },
      {
        situation: 'Religious practice restricted by the State',
        yourRight: 'Right to freedom of religion — to profess, practise, and propagate religion freely, subject to public order, morality and health.',
        legalSource: 'Article 25, Constitution',
      },
      {
        situation: 'Fundamental Right violated by the State',
        yourRight: 'Right to Constitutional Remedies — you can move the Supreme Court (Article 32) or High Court (Article 226) directly.',
        legalSource: 'Article 32, Constitution',
      },
    ],
    bottomNote: 'Fundamental Rights are enforceable against the State. For violations by private persons, separate laws (IPC, civil law) apply.',
  },

  {
    id: 'qref-workplace-rights',
    variant: 'quick-ref',
    category: 'workplace-rights',
    title: 'Workplace Rights Quick Reference',
    subtitle: 'Common workplace situations and your legal entitlements',
    legalRef: 'Factories Act 1948 · POSH Act 2013 · Payment of Wages Act 1936',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-11-15',
    tags: ['workplace', 'employee', 'leave', 'termination'],
    rows: [
      {
        situation: 'Denied earned leave / privilege leave',
        yourRight: 'Workers are entitled to paid annual leave (1 day per 20 days worked under Factories Act). Earned leave cannot be forfeited without paying cash equivalent.',
        legalSource: 'Section 79, Factories Act 1948',
      },
      {
        situation: 'Terminated without notice',
        yourRight: 'Workers in establishments with 100+ employees cannot be retrenched without 1 month notice and government permission.',
        legalSource: 'Section 25F & 25N, Industrial Disputes Act 1947',
      },
      {
        situation: 'Sexual harassment at work',
        yourRight: 'File a complaint with the Internal Complaints Committee (ICC). Employer is liable if no ICC exists.',
        legalSource: 'Section 4, POSH Act 2013',
      },
      {
        situation: 'Employer deducting salary without reason',
        yourRight: 'Deductions must be authorised by law. Unauthorised deductions can be challenged before the Payment of Wages Authority.',
        legalSource: 'Section 7, Payment of Wages Act 1936',
      },
      {
        situation: 'Working more than 8 hours without overtime pay',
        yourRight: 'Overtime is mandatory for hours beyond 9 per day / 48 per week. Rate: double the ordinary wage.',
        legalSource: 'Section 59, Factories Act 1948',
      },
    ],
    bottomNote: 'State-specific shops and establishments acts may provide additional protections. Check your state labour department website.',
  },

  // ── MORE STANDARD CARDS ────────────────────────────────────────────────────

  {
    id: 'std-police-stop-search',
    variant: 'standard',
    category: 'police-powers',
    title: 'Rights During a Police Stop & Search',
    subtitle: 'What police can lawfully do — and what they cannot',
    legalRef: 'Sections 41, 100, 165 CrPC · Article 22 Constitution',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-12-01',
    lessonId: 'police-powers-1',
    tags: ['search', 'stop', 'police', 'detention'],
    rights: [
      'Right to know the reason for the stop — police must state grounds for any detention.',
      'Right to refuse consent to a search without a warrant; only a lawful warrant or "reasonable grounds" authorise a warrantless search.',
      'Right to have a woman officer conduct any search on a woman — a male officer cannot body-search a female person.',
    ],
    duties: [
      'Comply calmly with lawful directives — resisting a lawful search may itself be an offence.',
      'Note the officer\'s name, badge number, and time; document the encounter afterwards.',
    ],
    safetyTip: 'If you feel the search is unlawful, say so clearly and calmly: "I do not consent to this search." Do not physically resist — challenge it legally later.',
  },

  {
    id: 'std-traffic-accident',
    variant: 'standard',
    category: 'traffic-laws',
    title: 'Rights After a Road Accident',
    subtitle: 'Legal protection and entitlements when involved in an accident',
    legalRef: 'Motor Vehicles Act 1988 · Sections 134, 161, 166',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-10-01',
    lessonId: 'traffic-laws-1',
    tags: ['accident', 'compensation', 'insurance', 'hit-and-run'],
    rights: [
      'Right to free emergency medical treatment at any hospital — no hospital can refuse first aid citing insurance or payment pending.',
      'Right to compensation from the Motor Accident Claims Tribunal (MACT) for injuries or loss of life, payable by the vehicle\'s insurer.',
      'Right to hit-and-run compensation from the Solatium Fund even if the offending vehicle is untraced.',
    ],
    duties: [
      'Provide assistance to injured persons and report the accident to police within 24 hours.',
      'Stay at the scene unless injured yourself — leaving without reporting is an offence under Section 134 MVA.',
    ],
    safetyTip: 'Keep photos of the accident scene, damage, and all parties\' vehicle numbers. Your claim before MACT requires a police FIR — file it promptly.',
  },

  {
    id: 'std-tenancy-deposit',
    variant: 'standard',
    category: 'tenancy',
    title: 'Security Deposit Rights',
    subtitle: 'Getting your deposit back and challenging unlawful deductions',
    legalRef: 'Model Tenancy Act 2021 · Sections 10, 13',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-09-10',
    tags: ['deposit', 'refund', 'deductions', 'landlord'],
    rights: [
      'Right to full refund of security deposit within the agreed period (typically 30–60 days) after vacating.',
      'Right to a written statement of deductions before any amount is withheld — arbitrary deductions are unlawful.',
      'Right to challenge unfair deductions before the Rent Authority or Small Causes Court.',
    ],
    duties: [
      'Leave the property in the same condition as when received, accounting for fair wear and tear.',
      'Obtain a written receipt for your deposit at the time of payment.',
    ],
    safetyTip: 'Conduct a move-out inspection with the landlord, photograph the premises, and get a written acknowledgment. This prevents dispute over pre-existing damage.',
  },

  {
    id: 'std-consumer-ecommerce',
    variant: 'standard',
    category: 'consumer-rights',
    title: 'E-Commerce & Online Shopping Rights',
    subtitle: 'Protections when buying from online platforms',
    legalRef: 'Consumer Protection Act 2019 · E-Commerce Rules 2020',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-10-20',
    tags: ['online shopping', 'return', 'e-commerce', 'refund'],
    rights: [
      'Right to accurate product descriptions and honest pricing — hidden charges added at checkout can be challenged.',
      'Right to a refund or replacement for products that differ from the online description or image.',
      'Right to file a consumer complaint in your city — jurisdiction is where you received the product, not where the company is registered.',
    ],
    duties: [
      'Report the defect within the platform\'s return window and retain all delivery and payment evidence.',
      'First exhaust the platform\'s own grievance redressal mechanism before approaching the Consumer Commission.',
    ],
    safetyTip: 'Under E-Commerce Rules 2020, all platforms must display a Grievance Officer name and contact. Email them with a complaint reference before going to the Commission — it strengthens your case.',
  },

  {
    id: 'std-workplace-termination',
    variant: 'standard',
    category: 'workplace-rights',
    title: 'Rights on Termination / Retrenchment',
    subtitle: 'Legal protections if you are dismissed or laid off',
    legalRef: 'Industrial Disputes Act 1947 · Sections 25F, 25G, 25N',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-11-15',
    lessonId: 'workplace-rights-1',
    tags: ['termination', 'retrenchment', 'notice', 'severance'],
    rights: [
      'Right to one month\'s notice or pay in lieu of notice before retrenchment (for workers with ≥1 year of continuous service).',
      'Right to retrenchment compensation: 15 days\' average pay for every completed year of service.',
      'Right to re-employment: retrenched workers must be offered the job first if the same post is re-opened within one year.',
    ],
    duties: [
      'Raise a formal dispute with the Labour Commissioner within 3 years of the date of wrongful termination.',
      'Keep your employment contract, payslips, and any termination letters as evidence.',
    ],
    safetyTip: 'A "resignation under pressure" can still be challenged as constructive dismissal if you can show you were forced. Document all coercive communications.',
  },

  // ── MORE CRISIS CARDS ──────────────────────────────────────────────────────

  {
    id: 'crisis-consumer-fraud',
    variant: 'crisis',
    category: 'consumer-rights',
    title: 'Online Fraud / Scam Purchase',
    subtitle: 'Immediate steps if you paid for a product that never arrived or is fraudulent',
    legalRef: 'IT Act 2000 · Consumer Protection Act 2019 · IPC Section 420',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-10-20',
    tags: ['fraud', 'scam', 'online', 'payment'],
    situation: 'You have been cheated in an online transaction — product not delivered, fake item, or payment scam.',
    doNow: [
      'Immediately report to the National Cyber Crime Portal: cybercrime.gov.in or call 1930.',
      'Contact your bank / UPI provider to raise a chargeback or dispute within 24–48 hours of the transaction.',
      'Screenshot all order confirmations, payment proofs, conversations, and the seller\'s page.',
      'File a police complaint (FIR) at your local station for cheating under IPC Section 420.',
    ],
    doNotDo: [
      'Do not share OTPs or banking passwords with anyone claiming to be "resolving" your fraud — that is a second scam.',
      'Do not delete chats or uninstall apps — they are evidence.',
      'Do not pay any "processing fee" promised as a refund condition — this is a recovery scam.',
    ],
    helplineNumber: '1930',
    helplineLabel: 'National Cyber Crime Helpline',
  },

  {
    id: 'crisis-accident-scene',
    variant: 'crisis',
    category: 'traffic-laws',
    title: 'You Caused / Witnessed an Accident',
    subtitle: 'Legal obligations and protective steps at an accident scene',
    legalRef: 'Motor Vehicles Act 1988 · Section 134 · IPC Section 304A',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-10-01',
    tags: ['accident', 'hit-and-run', 'police', 'FIR'],
    situation: 'You are involved in or witness a road accident with injuries.',
    doNow: [
      'Ensure injured persons receive immediate medical help — take them to the nearest hospital; the hospital cannot refuse.',
      'Call police (112) and report the accident — this is a legal obligation under Section 134 MVA.',
      'Collect names and numbers of witnesses and photograph the scene, vehicle positions, and damage.',
      'Obtain a police FIR reference number before leaving the station.',
    ],
    doNotDo: [
      'Do not flee the scene — leaving without reporting is a criminal offence (hit-and-run).',
      'Do not move vehicles before police arrive unless they create immediate danger.',
      'Do not sign any settlement with the other party without legal advice — it may waive your insurance claim.',
    ],
    helplineNumber: '1073',
    helplineLabel: 'National Highways Accident Relief Helpline',
  },

  {
    id: 'crisis-fundamental-rights-violation',
    variant: 'crisis',
    category: 'fundamental-rights',
    title: 'State Violating Your Fundamental Rights',
    subtitle: 'Immediate steps when a government authority is violating your constitutional rights',
    legalRef: 'Articles 32 & 226, Constitution · Protection of Human Rights Act 1993',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-11-10',
    tags: ['writ', 'habeas corpus', 'fundamental rights', 'violation'],
    situation: 'A government body or official is actively violating your constitutional rights.',
    doNow: [
      'File a writ petition in the High Court (Article 226) or Supreme Court (Article 32) — you can do this yourself without a lawyer.',
      'For illegal detention, apply for a Writ of Habeas Corpus immediately — the court can order release within hours.',
      'File a complaint with the National Human Rights Commission (NHRC) at nhrc.nic.in or call 14433.',
      'Document everything: dates, officials involved, orders issued, witnesses.',
    ],
    doNotDo: [
      'Do not sign any document confessing guilt under pressure.',
      'Do not assume you must wait for a lower court — High Court writ jurisdiction is direct and fast.',
      'Do not accept verbal assurances from officials — insist on written orders.',
    ],
    helplineNumber: '14433',
    helplineLabel: 'National Human Rights Commission',
  },

  // ── MORE MYTH BUSTER CARDS ─────────────────────────────────────────────────

  {
    id: 'myth-tenancy',
    variant: 'myth-buster',
    category: 'tenancy',
    title: 'Tenancy — Myth vs Law',
    subtitle: 'What landlords commonly claim and what the law actually says',
    legalRef: 'Transfer of Property Act 1882 · Model Tenancy Act 2021',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-09-10',
    lessonId: 'tenancy-1',
    tags: ['landlord', 'rent', 'lease', 'tenant'],
    myths: [
      {
        myth: 'An 11-month rental agreement means you have no tenancy protection.',
        reality: 'An 11-month agreement is used to avoid registration requirements, not to strip your rights. You still have statutory protections under the applicable Rent Control Act.',
        legalBasis: 'State Rent Control Acts · Registration Act 1908',
      },
      {
        myth: 'A landlord can raise rent whenever they want.',
        reality: 'Most state rent control laws cap rent increases and require advance notice. Even without rent control, an increase during a fixed-term agreement is invalid without your consent.',
        legalBasis: 'State Rent Control Acts (varies by state)',
      },
      {
        myth: 'If your name is not on the agreement, you have no rights.',
        reality: 'If you are paying rent and living in the premises with the landlord\'s knowledge, courts have recognised de facto tenancy rights even without a written agreement.',
        legalBasis: 'Section 106, Transfer of Property Act 1882',
      },
    ],
  },

  {
    id: 'myth-workplace-rights',
    variant: 'myth-buster',
    category: 'workplace-rights',
    title: 'Workplace Rights — Myth vs Law',
    subtitle: 'Common misconceptions about employee protections in India',
    legalRef: 'Industrial Disputes Act 1947 · Factories Act 1948 · POSH Act 2013',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-11-15',
    lessonId: 'workplace-rights-1',
    tags: ['employee', 'contract', 'dismissal', 'PF'],
    myths: [
      {
        myth: 'If you are on a "contractual" or "third-party payroll," you have no employee rights.',
        reality: 'Contract workers performing perennial work have rights under the Contract Labour (Regulation & Abolition) Act. Their principal employer is still liable for basic wages and safety.',
        legalBasis: 'Contract Labour (R&A) Act 1970 · Section 21',
      },
      {
        myth: 'Your employer can deduct PF from your salary without depositing it.',
        reality: 'Deducting PF and not remitting it to EPFO is a criminal offence. Employees can file a complaint with the Regional PF Commissioner.',
        legalBasis: 'Employees\' Provident Funds Act 1952 · Section 14',
      },
      {
        myth: 'A company can prevent you from joining a competitor by contract.',
        reality: 'Post-employment non-compete clauses are largely unenforceable under Indian contract law — they restrain trade and are void under Section 27 of the Contract Act.',
        legalBasis: 'Section 27, Indian Contract Act 1872',
      },
    ],
  },

  {
    id: 'myth-traffic-laws',
    variant: 'myth-buster',
    category: 'traffic-laws',
    title: 'Traffic Laws — Myth vs Law',
    subtitle: 'What drivers believe and what the Motor Vehicles Act actually says',
    legalRef: 'Motor Vehicles Act 1988 · Central Motor Vehicles Rules 1989',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-10-01',
    lessonId: 'traffic-laws-1',
    tags: ['driving', 'challan', 'licence', 'insurance'],
    myths: [
      {
        myth: 'You must always carry original documents — photocopies are not accepted.',
        reality: 'DigiLocker copies of RC, DL, and insurance are legally valid under the IT Act 2000 and the Motor Vehicles Act (as amended in 2019). Physical originals are no longer mandatory.',
        legalBasis: 'Section 158, MVA 1988 as amended · IT Act 2000',
      },
      {
        myth: 'Traffic police can seize your vehicle for any minor offence.',
        reality: 'Vehicle seizure requires specific grounds (e.g. driving without licence, no insurance, repeat offences). A seizure memo must be issued and a receipt provided.',
        legalBasis: 'Section 207, MVA 1988',
      },
      {
        myth: 'If you pay the challan on the spot, you avoid a court record.',
        reality: 'Spot payment or online payment of a challan is treated as an admission of guilt and creates a record. If you wish to dispute, you must opt to contest in court.',
        legalBasis: 'Section 206, MVA 1988',
      },
    ],
  },

  // ── MORE PROCEDURE CARDS ───────────────────────────────────────────────────

  {
    id: 'proc-tenancy-rent-dispute',
    variant: 'procedure',
    category: 'tenancy',
    title: 'Resolving a Rent or Deposit Dispute',
    subtitle: 'How to formally challenge an unfair landlord through proper channels',
    legalRef: 'State Rent Control Acts · Model Tenancy Act 2021 · Section 13',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-09-10',
    lessonId: 'tenancy-2',
    tags: ['rent dispute', 'deposit', 'landlord', 'rent court'],
    scenario: 'Your landlord is withholding your deposit or demanding an unlawful rent increase.',
    steps: [
      {
        label: 'Gather all documentary proof',
        description: 'Collect your rental agreement, rent receipts (or bank transfer proof), move-in/move-out photographs, and all WhatsApp/email communications.',
        documents: ['Rent agreement', 'Payment receipts / bank statements', 'Photos of property condition'],
      },
      {
        label: 'Send a formal legal notice',
        description: 'Send a registered post letter demanding the deposit within 15 days, specifying the amount and reason. Keep the postal receipt.',
        documents: ['Notice letter (signed)', 'Postal acknowledgement slip'],
      },
      {
        label: 'File a complaint with the Rent Authority',
        description: 'Under the Model Tenancy Act 2021 (adopted states) or the applicable state Rent Control Act, file a complaint with the Rent Authority (usually the Revenue Officer or Rent Controller for your area).',
        authority: 'Rent Authority / Rent Controller',
        documents: ['Copy of agreement', 'Proof of deposit paid', 'Notice sent', 'Proof of non-refund'],
      },
      {
        label: 'Attend hearings',
        description: 'Both parties are heard. The Authority may direct the landlord to refund within a set period.',
      },
      {
        label: 'Appeal if unsatisfied',
        description: 'Appeal the Rent Authority\'s order to the Rent Court or Civil Court within the limitation period specified in your state\'s law.',
        authority: 'Rent Court / Civil Court',
      },
    ],
    commonFailurePoints: [
      'No written proof of deposit payment — always pay by bank transfer or take signed receipts.',
      'Missing the limitation period — file within 1–3 years depending on state law.',
      'Not sending the notice by registered post — hand-delivered notices are harder to prove.',
    ],
    timeframe: 'Rent Authority proceedings: 2–6 months. Appellate stage: 6–18 months additional.',
  },

  {
    id: 'proc-writ-petition',
    variant: 'procedure',
    category: 'fundamental-rights',
    title: 'Filing a Writ Petition (High Court)',
    subtitle: 'How to approach the High Court when your Fundamental Rights are violated',
    legalRef: 'Article 226, Constitution of India',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-11-10',
    tags: ['writ', 'High Court', 'petition', 'fundamental rights'],
    scenario: 'A government authority has violated your fundamental rights and ordinary remedies are insufficient.',
    steps: [
      {
        label: 'Identify the correct writ',
        description: 'Habeas Corpus (illegal detention) · Mandamus (public authority not doing its duty) · Certiorari (quashing a bad order) · Prohibition (stopping an inferior court) · Quo Warranto (challenging a public office).',
      },
      {
        label: 'Draft the petition',
        description: 'Write a concise petition stating: your name, the respondent authority, facts, the right violated, the relief sought, and why other remedies are inadequate. Attach supporting documents as annexures.',
        documents: ['Affidavit verifying facts', 'Copies of all relevant orders / letters', 'ID proof'],
      },
      {
        label: 'File at the High Court registry',
        description: 'Submit the petition (in triplicate) to the High Court registry. Obtain a diary number. Filing fees are modest (₹100–500 typically).',
        authority: 'High Court Registry (Filing Section)',
      },
      {
        label: 'Appear on the first hearing date',
        description: 'The court may issue notice to the respondent authority, admit the petition, or ask for clarifications. Urgent matters (Habeas Corpus) can get same-day hearings.',
      },
      {
        label: 'Attend subsequent hearings',
        description: 'The government will file a counter-affidavit. Both sides argue. The court passes an order — which may be interim (immediate) or final.',
      },
    ],
    commonFailurePoints: [
      'Filing in the wrong High Court (should be the court with territorial jurisdiction over the respondent authority).',
      'Not exhausting other available remedies first — courts may ask why you did not use a lower remedy.',
      'Vague or poorly evidenced petitions — be specific about dates, officials, and violations.',
    ],
    timeframe: 'Urgent writs (Habeas Corpus): can be heard same day. Regular writs: first hearing in 2–8 weeks.',
  },

  {
    id: 'proc-police-complaint-against-officer',
    variant: 'procedure',
    category: 'police-powers',
    title: 'Complaining Against Police Misconduct',
    subtitle: 'How to report abuse of power, custodial violence, or illegal demands',
    legalRef: 'Police Act · NHRC Guidelines · Section 197 CrPC · DK Basu Directions (1996 SC)',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-12-01',
    tags: ['police complaint', 'misconduct', 'custodial', 'NHRC'],
    scenario: 'A police officer has abused their power — illegal detention, assault, bribery, or refusal to register FIR.',
    steps: [
      {
        label: 'Document the incident immediately',
        description: 'Write a dated account of what happened. Include the officer\'s name, badge/PC number, station, date, time, and any witnesses. Photograph injuries if applicable.',
      },
      {
        label: 'Approach the Station House Officer (SHO) or SP',
        description: 'File a written complaint at the same station (if SHO is the subject, escalate directly to the Superintendent of Police by registered post).',
        authority: 'Superintendent of Police (SP) / District Superintendent',
        documents: ['Written complaint', 'Medical report (if assault)', 'Witness details'],
      },
      {
        label: 'File with the State Police Complaints Authority',
        description: 'Each state has a Police Complaints Authority (post-Prakash Singh judgment) which independently investigates serious misconduct.',
        authority: 'State Police Complaints Authority',
      },
      {
        label: 'File a complaint with NHRC',
        description: 'For custodial torture or death, file online at nhrc.nic.in — the NHRC can issue notices directly to state governments.',
        authority: 'National Human Rights Commission',
      },
      {
        label: 'File a Writ Petition if urgent',
        description: 'For ongoing violations (illegal detention, custodial assault), file a Habeas Corpus or Writ in the High Court for immediate relief.',
        authority: 'High Court',
      },
    ],
    commonFailurePoints: [
      'Delay in documenting and filing — memories fade and evidence disappears quickly.',
      'Filing only orally — always put complaints in writing and get an acknowledgment.',
      'Not approaching the NHRC for custodial matters — they have strong supervisory powers.',
    ],
    timeframe: 'SP inquiry: 30–60 days. NHRC response: 4–12 weeks. Writ: can be urgent (days).',
  },

  // ── MORE QUICK REFERENCE CARDS ─────────────────────────────────────────────

  {
    id: 'qref-police-powers-limits',
    variant: 'quick-ref',
    category: 'police-powers',
    title: 'Police Powers — Quick Reference',
    subtitle: 'What police can and cannot do in common situations',
    legalRef: 'CrPC Sections 41, 49, 100, 160, 165 · Article 22 Constitution',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-12-01',
    lessonId: 'police-powers-2',
    tags: ['police', 'rights', 'warrant', 'detention'],
    rows: [
      {
        situation: 'Police want to arrest you',
        yourRight: 'For non-cognisable offences, they need a magistrate\'s warrant. For cognisable offences, they may arrest without warrant but must inform you of the grounds.',
        legalSource: 'Section 41, CrPC',
      },
      {
        situation: 'Police want to question you at the station',
        yourRight: 'You may be called as a witness. You must appear if served notice, but you cannot be detained overnight without arrest.',
        legalSource: 'Section 160, CrPC',
      },
      {
        situation: 'Police want to enter and search your home',
        yourRight: 'A warrant is required except in certain urgent cognisable-offence situations. Search must be in your presence and a list of seized items must be given.',
        legalSource: 'Sections 100, 165 CrPC',
      },
      {
        situation: 'Police are holding you beyond 24 hours',
        yourRight: 'You must be produced before a magistrate within 24 hours of arrest (excluding travel time). Beyond that, detention requires a magistrate\'s remand order.',
        legalSource: 'Article 22(2), Constitution · Section 57 CrPC',
      },
      {
        situation: 'Police refuse to register your FIR',
        yourRight: 'For cognisable offences, registration is mandatory. You can escalate to SP or the magistrate under Section 156(3) CrPC to compel registration.',
        legalSource: 'Section 154 CrPC · Lalita Kumari v. UP (2013 SC)',
      },
    ],
    bottomNote: 'The DK Basu guidelines (1996 SC) require police to display name tags, prepare a memo of arrest, and inform a relative. Violations can be reported to the NHRC.',
  },

  {
    id: 'qref-traffic-accident-rights',
    variant: 'quick-ref',
    category: 'traffic-laws',
    title: 'Road Accident — Rights & Obligations',
    subtitle: 'Legal duties and entitlements at and after an accident',
    legalRef: 'Motor Vehicles Act 1988 · Sections 134, 161, 163A, 166',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-10-01',
    tags: ['accident', 'MACT', 'hit-and-run', 'insurance'],
    rows: [
      {
        situation: 'Injured in an accident, need hospital immediately',
        yourRight: 'Any hospital (private or government) must provide free emergency treatment. The hospital cannot demand payment or insurance proof before first aid.',
        legalSource: 'Section 134A, MVA 1988',
      },
      {
        situation: 'Claiming compensation for accident injuries',
        yourRight: 'File a claim petition before the Motor Accident Claims Tribunal (MACT). No court fee. Compensation from the at-fault vehicle\'s insurer.',
        legalSource: 'Section 166, MVA 1988',
      },
      {
        situation: 'Hit-and-run — offending vehicle not traced',
        yourRight: 'Claim from the Motor Vehicle Accident Fund (Solatium Fund). ₹2 lakh for death, ₹50,000 for grievous injury. Apply within 6 months.',
        legalSource: 'Section 161, MVA 1988',
      },
      {
        situation: 'Third party insurer refuses your claim',
        yourRight: 'Appeal to the MACT or file a complaint with the Insurance Ombudsman if the insurer acts in bad faith.',
        legalSource: 'IRDAI Ombudsman Rules 2017',
      },
      {
        situation: 'Police charge you without evidence after an accident',
        yourRight: 'You have the right to bail for most accident offences. Engage a lawyer immediately and exercise your right to silence before your lawyer arrives.',
        legalSource: 'Sections 436–440 CrPC (bail provisions)',
      },
    ],
    bottomNote: 'Always obtain a police FIR within 24 hours — it is mandatory for insurance claims and MACT proceedings. Delay can weaken or invalidate your claim.',
  },

  {
    id: 'qref-consumer-digital-rights',
    variant: 'quick-ref',
    category: 'consumer-rights',
    title: 'Digital & Subscription Consumer Rights',
    subtitle: 'Your entitlements for app subscriptions, OTT services, and online payments',
    legalRef: 'Consumer Protection Act 2019 · E-Commerce Rules 2020 · RBI Payment Guidelines',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-10-20',
    tags: ['subscription', 'OTT', 'auto-debit', 'digital'],
    rows: [
      {
        situation: 'App auto-renewed your subscription without notice',
        yourRight: 'Under RBI e-mandate rules, recurring payments above ₹15,000 require an Additional Factor of Authentication (AFA) and pre-debit notification. You can dispute unauthorised auto-renewals.',
        legalSource: 'RBI Circular on Recurring Payments 2021',
      },
      {
        situation: 'OTT / SaaS service not delivering what was advertised',
        yourRight: 'You are entitled to refund or service credits for material failure to deliver the subscribed service — even digital services fall under CPA 2019.',
        legalSource: 'Section 2(42), CPA 2019 (definition of service)',
      },
      {
        situation: 'Fraudulent UPI transaction from your account',
        yourRight: 'Report to your bank within 3 days for zero liability if negligence was on the bank\'s side. File at cybercrime.gov.in and call 1930.',
        legalSource: 'RBI Circular on Customer Protection DBR 2017',
      },
      {
        situation: 'Dark patterns — tricked into buying something you didn\'t want',
        yourRight: 'Dark patterns in e-commerce (false urgency, hidden charges, forced sign-ups) are prohibited under CCPA Guidelines 2023. File a complaint with the Central Consumer Protection Authority.',
        legalSource: 'CCPA Guidelines for Prevention and Regulation of Dark Patterns 2023',
      },
      {
        situation: 'Platform refuses to give refund citing "no refund policy"',
        yourRight: 'A blanket no-refund policy cannot override statutory rights under CPA 2019 for defective services. Escalate to the Consumer Commission.',
        legalSource: 'Section 2(11), CPA 2019',
      },
    ],
    bottomNote: 'For digital payment disputes, first raise a formal complaint with your bank. Unresolved complaints can go to the RBI Banking Ombudsman at cms.rbi.org.in.',
  },

  {
    id: 'qref-fundamental-remedies',
    variant: 'quick-ref',
    category: 'fundamental-rights',
    title: 'Legal Remedies for Rights Violations',
    subtitle: 'Which writ or remedy to use for which fundamental rights violation',
    legalRef: 'Articles 32 & 226 Constitution · Protection of Human Rights Act 1993',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-11-10',
    tags: ['writ', 'remedy', 'High Court', 'NHRC'],
    rows: [
      {
        situation: 'Illegally detained or imprisoned by the State',
        yourRight: 'Apply for Writ of Habeas Corpus — the court can order immediate release and production of the detained person.',
        legalSource: 'Article 226 / 32, Constitution',
      },
      {
        situation: 'Government authority refuses to perform a legal duty',
        yourRight: 'Apply for Writ of Mandamus — compels the authority to perform its mandatory public duty.',
        legalSource: 'Article 226, Constitution',
      },
      {
        situation: 'Unfair or illegal order passed by a tribunal or lower authority',
        yourRight: 'Apply for Writ of Certiorari to quash the order, or Writ of Prohibition to prevent further proceedings.',
        legalSource: 'Article 226, Constitution',
      },
      {
        situation: 'Person holding a public office illegally or without authority',
        yourRight: 'Apply for Writ of Quo Warranto to challenge the right to hold the office.',
        legalSource: 'Article 226, Constitution',
      },
      {
        situation: 'Human rights violation by State actor',
        yourRight: 'File a complaint with the National Human Rights Commission (NHRC) — free, no advocate required, can be filed online.',
        legalSource: 'Section 12, Protection of Human Rights Act 1993',
      },
    ],
    bottomNote: 'High Court writs (Article 226) have wider scope than Supreme Court writs (Article 32) — start at the High Court unless the matter is of national importance.',
  },

  {
    id: 'qref-workplace-pf-esi',
    variant: 'quick-ref',
    category: 'workplace-rights',
    title: 'PF, ESI & Social Security Rights',
    subtitle: 'Entitlements under India\'s mandatory social security schemes',
    legalRef: 'EPF Act 1952 · ESI Act 1948 · Code on Social Security 2020',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-11-15',
    tags: ['PF', 'ESI', 'provident fund', 'social security'],
    rows: [
      {
        situation: 'Employer not depositing your PF deductions',
        yourRight: 'File a complaint with the Regional PF Commissioner. It is a criminal offence for employers to deduct PF without depositing. You can check your balance on EPFO portal.',
        legalSource: 'Section 14, EPF & MP Act 1952',
      },
      {
        situation: 'Not enrolled in PF despite being eligible',
        yourRight: 'Employees earning up to ₹15,000/month must be enrolled in EPF. You can file a complaint with the nearest EPFO regional office if your employer refuses.',
        legalSource: 'Section 2(f), EPF & MP Act 1952',
      },
      {
        situation: 'Medical emergency — no ESI coverage provided',
        yourRight: 'Employees earning up to ₹21,000/month must be covered under ESI. Employer denial can be reported to the ESI Corporation regional office.',
        legalSource: 'Section 2(9), ESI Act 1948',
      },
      {
        situation: 'Company shutting down — what happens to gratuity',
        yourRight: 'Gratuity is payable for continuous service of 5+ years. It is due even if the company closes, and is a first charge on the company\'s assets.',
        legalSource: 'Payment of Gratuity Act 1972 · Section 4',
      },
      {
        situation: 'Want to withdraw PF after leaving job',
        yourRight: 'Full withdrawal allowed after 2 months of unemployment. File Form 19 (PF withdrawal) and Form 10C (pension withdrawal) online on the EPFO portal.',
        legalSource: 'EPF Scheme 1952 · Paragraphs 68-K, 69',
      },
    ],
    bottomNote: 'All PF and ESI grievances can be lodged online at the respective portals: epfigms.gov.in (PF) and esic.in (ESI). Anonymous complaints are also accepted.',
  },

  {
    id: 'qref-consumer-remedies',
    variant: 'quick-ref',
    category: 'consumer-rights',
    title: 'Consumer Remedies Quick Reference',
    subtitle: 'Which forum handles your complaint and what relief you can get',
    legalRef: 'Consumer Protection Act 2019 · Sections 35, 47, 58',
    jurisdiction: { scope: 'central' },
    reviewedAt: '2025-10-20',
    lessonId: 'consumer-rights-1',
    tags: ['forum', 'complaint', 'relief', 'compensation'],
    rows: [
      {
        situation: 'Claim up to ₹1 crore',
        yourRight: 'File at the District Consumer Disputes Redressal Commission. You can represent yourself.',
        legalSource: 'Section 35, CPA 2019',
      },
      {
        situation: 'Claim ₹1 crore to ₹10 crore',
        yourRight: 'File at the State Consumer Disputes Redressal Commission.',
        legalSource: 'Section 47, CPA 2019',
      },
      {
        situation: 'Claim above ₹10 crore',
        yourRight: 'File at the National Consumer Disputes Redressal Commission (New Delhi).',
        legalSource: 'Section 58, CPA 2019',
      },
      {
        situation: 'Online purchase defect / e-commerce fraud',
        yourRight: 'E-commerce companies are liable under CPA 2019. File complaint in your city — jurisdiction is where you received the product.',
        legalSource: 'Section 2(7) read with E-Commerce Rules 2020',
      },
      {
        situation: 'Medical negligence by hospital',
        yourRight: 'Medical services fall under CPA 2019. Relief includes compensation for negligence-caused harm.',
        legalSource: 'Indian Medical Association v. V.P. Shantha (1995 SC)',
      },
    ],
    bottomNote: 'All consumer complaints can be filed online at edaakhil.nic.in. Court fees are nominal and waived for BPL complainants.',
  },
];
