import { ShieldCheck, BookOpen, AlertTriangle, ExternalLink, Sparkles, Scale } from 'lucide-react';

export const AboutDataPage: React.FC = () => {
  return (
    <div className="space-y-12 max-w-4xl mx-auto text-[#0A2F25]">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF5F0] border border-teal-600/30 text-[#087E83] text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-[#087E83]" />
          <span>FUSION 2026 Deliverable 3 Alignment</span>
        </div>
        <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#0A2F25]">
          Responsible Design Canvas & Data Methodology
        </h1>
        <p className="text-sm text-[#0A2F25]/75 leading-relaxed">
          Full disclosure of cultural governance, ethical AI boundaries, data verification sources, and system limitations.
        </p>
      </div>

      {/* 1. Responsible Design Canvas Section */}
      <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-md border border-teal-900/10 shadow-sm space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-teal-900/10">
          <Scale className="w-5 h-5 text-[#C5A028]" />
          <h2 className="font-serif font-bold text-xl text-[#0A2F25]">
            Responsible Design Canvas Breakdown
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[#0A2F25]/85">
          <div className="p-4 rounded-2xl bg-[#EBF5F0] border border-teal-900/15 space-y-2">
            <h3 className="font-bold uppercase tracking-wider text-[11px] text-[#B88E18]">
              1. Whose Culture & Data is Involved?
            </h3>
            <p className="leading-relaxed text-[#0A2F25]/80">
              Encompasses the intangible and architectural heritage of Malaysian multicultural communities: Malay Sultanate and vernacular traditions, Straits-born Chinese (Baba-Nyonya), Indian Muslim trading enclaves, Portuguese Eurasians, and Indigenous communities of Peninsular Malaysia and Borneo (Sabah & Sarawak).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#EBF5F0] border border-teal-900/15 space-y-2">
            <h3 className="font-bold uppercase tracking-wider text-[11px] text-[#B88E18]">
              2. Potential Harms & Cultural Risks
            </h3>
            <ul className="list-disc list-inside space-y-1 leading-relaxed text-[#0A2F25]/80">
              <li>Generative AI hallucinating sacred beliefs or inventing dates</li>
              <li>Tourism behavior disrupting active prayers and rites</li>
              <li>Overtourism overcrowding delicate fragile monuments</li>
              <li>Treating living artisans as passive spectacles without consent</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-[#EBF5F0] border border-teal-900/15 space-y-2">
            <h3 className="font-bold uppercase tracking-wider text-[11px] text-[#B88E18]">
              3. Prevention by Design (Mitigations)
            </h3>
            <ul className="list-disc list-inside space-y-1 leading-relaxed text-[#0A2F25]/80">
              <li><strong>Zero-Speculation Rule:</strong> AI narration strictly constrained to cited archival records</li>
              <li><strong>Cultural Care Prompts:</strong> Automated modest dress and photography warnings at sacred sites</li>
              <li><strong>Honest Estimations:</strong> Distinguishing verified data from estimated and simulated transit</li>
              <li><strong>Local-First Storage:</strong> Zero invasive cloud profiling or personal tracking</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-[#EBF5F0] border border-teal-900/15 space-y-2">
            <h3 className="font-bold uppercase tracking-wider text-[11px] text-[#B88E18]">
              4. SDG Alignment
            </h3>
            <p className="leading-relaxed text-[#0A2F25]/80">
              Directly contributes to <strong>UN Sustainable Development Goal 11.4</strong> (Strengthen efforts to protect and safeguard the world's cultural and natural heritage) and <strong>SDG 12.b</strong> (Sustainable tourism that creates jobs and promotes local culture).
            </p>
          </div>
        </div>
      </div>

      {/* 2. Official AI Tool Disclosure */}
      <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-md border border-teal-900/10 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-4 border-b border-teal-900/10">
          <Sparkles className="w-5 h-5 text-[#087E83]" />
          <h2 className="font-serif font-bold text-xl text-[#0A2F25]">
            Mandatory AI Tool Disclosure
          </h2>
        </div>

        <div className="p-4 rounded-2xl bg-[#EBF5F0] border border-teal-900/15 text-xs text-[#0A2F25]/90 space-y-3 leading-relaxed">
          <p>
            In accordance with the FUSION 2026 Competition Rules requiring complete transparency:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-white rounded-xl border border-teal-900/15">
              <strong className="block text-[#B88E18] mb-1">AI Tools Used:</strong>
              Google Antigravity Agent & Gemini Developer Models
            </div>
            <div className="p-3 bg-white rounded-xl border border-teal-900/15">
              <strong className="block text-[#B88E18] mb-1">Application Scope:</strong>
              Scaffolding TypeScript interfaces, drafting architectural layouts, styling with Tailwind CSS
            </div>
            <div className="p-3 bg-white rounded-xl border border-teal-900/15">
              <strong className="block text-[#B88E18] mb-1">Verification Method:</strong>
              Manual human verification against UNESCO dossiers and Jabatan Warisan Negara archives
            </div>
          </div>
          <p className="text-[11px] text-[#B88E18]">
            *Every single historical statement and GPS coordinate was manually cross-checked against primary archival and institutional documentation.
          </p>
        </div>
      </div>

      {/* 3. Official Bibliography & Sources Cited */}
      <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-md border border-teal-900/10 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-4 border-b border-teal-900/10">
          <BookOpen className="w-5 h-5 text-[#C5A028]" />
          <h2 className="font-serif font-bold text-xl text-[#0A2F25]">
            Official Heritage Data Sources
          </h2>
        </div>

        <div className="space-y-3 text-xs text-[#0A2F25]">
          {[
            {
              title: 'UNESCO World Heritage Centre: Historic Cities of the Straits of Malacca (Melaka & George Town)',
              publisher: 'United Nations Educational, Scientific and Cultural Organization',
              url: 'https://whc.unesco.org/en/list/1223',
            },
            {
              title: 'National Heritage Register of Historic Buildings and Monuments',
              publisher: 'Jabatan Warisan Negara (National Heritage Department Malaysia)',
              url: 'https://www.heritage.gov.my',
            },
            {
              title: 'Melaka Museum Corporation (PERZIM) Historical Monograph Series',
              publisher: 'Perbadanan Muzium Melaka',
              url: 'https://perzim.gov.my',
            },
            {
              title: 'George Town World Heritage Incorporated Research & Conservation Guidelines',
              publisher: 'GTWHI',
              url: 'https://gtwhi.com.my',
            },
            {
              title: 'National Archives of Malaysia (Arkib Negara Malaysia)',
              publisher: 'Ministry of National Unity Malaysia',
              url: 'http://www.arkib.gov.my',
            },
            {
              title: 'Sarawak Museum Department & Living Cultural Archives',
              publisher: 'Government of Sarawak',
              url: 'https://museum.sarawak.gov.my',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-[#EBF5F0] border border-teal-900/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <span className="font-bold text-[#0A2F25]">{item.title}</span>
                <span className="text-[#0A2F25]/60 block sm:inline sm:ml-2">
                  — {item.publisher}
                </span>
              </div>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="text-[#087E83] hover:underline font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
              >
                Access Source <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Known Limitations */}
      <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-md border border-teal-900/10 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h2 className="font-serif font-bold text-xl text-[#0A2F25]">
            Known System Limitations (Honest Disclosure)
          </h2>
        </div>

        <ul className="space-y-2 text-xs text-[#0A2F25]/75 leading-relaxed list-disc list-inside">
          <li><strong>Geographic Routing:</strong> Route connections use urban Haversine distance with street coefficients rather than live traffic telemetry.</li>
          <li><strong>Public Transit:</strong> Transit estimates are labelled as <em>Simulated</em> because real-time bus GTFS feeds were not connected during this sprint.</li>
          <li><strong>Dynamic Pricing & Hours:</strong> Entry fees and opening schedules change over time; places without recent confirmation are explicitly marked as <em>Pending Verification</em>.</li>
          <li><strong>Offline Storage:</strong> Saved itineraries and badges live inside the user's browser localStorage and do not sync across separate physical devices.</li>
        </ul>
      </div>
    </div>
  );
};
