const SOURCES = [
  {
    category: 'Bare Acts (Central)',
    items: [
      {
        name: 'Constitution of India',
        description: 'Fundamental rights, directive principles, and constitutional provisions.',
        url: 'https://legislative.gov.in/constitution-of-india/',
      },
      {
        name: 'Indian Penal Code, 1860',
        description: 'Criminal offences and penalties applicable across India.',
        url: 'https://legislative.gov.in/acts-of-the-indian-parliament/',
      },
      {
        name: 'Code of Criminal Procedure, 1973',
        description: 'Procedures for criminal investigation, trial, and arrest.',
        url: 'https://legislative.gov.in/acts-of-the-indian-parliament/',
      },
      {
        name: 'Code of Civil Procedure, 1908',
        description: 'Procedures for civil litigation and court processes.',
        url: 'https://legislative.gov.in/acts-of-the-indian-parliament/',
      },
      {
        name: 'Right to Information Act, 2005',
        description: 'Citizens\u2019 right to access information from public authorities.',
        url: 'https://rti.gov.in/',
      },
      {
        name: 'Indian Evidence Act, 1872',
        description: 'Rules governing admissibility of evidence in court.',
        url: 'https://legislative.gov.in/acts-of-the-indian-parliament/',
      },
    ],
  },
  {
    category: 'Court Judgments',
    items: [
      {
        name: 'Supreme Court of India',
        description: 'Landmark rulings and binding precedents from the apex court.',
        url: 'https://main.sci.gov.in/',
      },
      {
        name: 'Calcutta High Court',
        description: 'Judgments relevant to West Bengal jurisdiction.',
        url: 'https://www.calcuttahighcourt.gov.in/',
      },
      {
        name: 'Jharkhand High Court',
        description: 'Judgments relevant to Jharkhand jurisdiction.',
        url: 'https://jharkhandhighcourt.nic.in/',
      },
    ],
  },
  {
    category: 'State Rules',
    items: [
      {
        name: 'West Bengal State Rules & Notifications',
        description: 'State-specific rules, notifications, and orders.',
        url: 'https://wbxpress.com/',
      },
      {
        name: 'Jharkhand State Rules & Notifications',
        description: 'State-specific rules, notifications, and orders.',
        url: 'https://jharkhand.gov.in/',
      },
    ],
  },
] as const;

export default function Sources() {
  return (
    <main className="mx-auto max-w-4xl px-3 sm:px-4 py-6 sm:py-10 pb-20 sm:pb-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          Legal <span className="text-gradient">Sources</span>
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          NyayaSetu retrieves information exclusively from verified legal
          sources. Every response is grounded in the materials listed below.
        </p>
      </div>

      <div className="space-y-8">
        {SOURCES.map((group) => (
          <section key={group.category}>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-500">
              {group.category}
            </h2>
            <div className="space-y-3">
              {group.items.map((item) => (
                <div
                  key={item.name}
                  className="glass-card-hover flex items-start justify-between gap-4 py-4"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {item.name}
                    </h3>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {item.description}
                    </p>
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-lg border border-neon-cyan/20 bg-neon-cyan/5 px-3 py-1.5 text-xs font-medium text-neon-cyan transition-colors hover:bg-neon-cyan/10"
                  >
                    Visit
                  </a>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10 glass-card">
        <p className="text-sm font-medium text-gray-300">About our sources</p>
        <p className="mt-2 text-sm text-gray-500">
          All legal texts are sourced from official government websites and
          verified court databases. Source material is periodically reviewed for
          accuracy. If you believe a source is outdated or incorrect, please
          contact us.
        </p>
      </div>
    </main>
  );
}
