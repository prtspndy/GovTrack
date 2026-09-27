import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { publicService } from '../../services/publicService.js';
import { DocumentType } from '../../types/index.js';
import {
  Search,
  FileCheck2,
  Clock,
  Shield,
  BellRing,
  Download,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  Building2,
  FileText,
  UserCheck,
  ChevronDown,
  Sparkles
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [trackNumber, setTrackNumber] = useState('');
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({ 0: true });

  useEffect(() => {
    async function loadDocTypes() {
      const res = await publicService.getPublicDocumentTypes();
      if (res.success && res.data) {
        setDocTypes(res.data.slice(0, 6));
      }
    }
    loadDocTypes();
  }, []);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackNumber.trim()) {
      navigate(`/track-request?ref=${encodeURIComponent(trackNumber.trim())}`);
    }
  };

  const toggleFaq = (idx: number) => {
    setFaqOpen((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const faqs = [
    {
      q: 'Do I still need to visit the local revenue or municipal office to check status?',
      a: 'No. The primary purpose of GovTrack is to provide 100% online transparency. Every transition—from preliminary scrutiny to field inquiry and magistrate signing—is published live to your request timeline.'
    },
    {
      q: 'What should I do if the officer requests an additional document?',
      a: 'When an officer marks your request as "Additional Document Required", you will receive an in-portal notification specifying the exact document required. You can simply upload the scanned file directly from your citizen dashboard without making an in-person visit.'
    },
    {
      q: 'How do I download the final certificate once approved?',
      a: 'Once the application reaches "Ready for Download", a secure digital certificate download button appears on your dashboard and request details page. You can save and print the certified document anytime.'
    },
    {
      q: 'Are the certificates verifiable by third-party employers or universities?',
      a: 'Yes. Every issued certificate carries a unique reference number (e.g. GOV-2026-000001) that anyone can publicly track and verify on this portal via the "Track Status" tab.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-950 via-slate-900 to-slate-900 text-white pt-16 pb-24 overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {/* Tagline */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-6">
              <Shield className="w-3.5 h-3.5" />
              Public Service Transparency Initiative
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Government Services. <br />
              <span className="text-blue-400">Now Trackable Online.</span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed">
              Submit your document request and track every stage of the process without visiting the office just to check your status.
            </p>

            {/* Quick Track Input Bar */}
            <div className="mt-8 max-w-xl mx-auto">
              <form onSubmit={handleTrackSubmit} className="relative flex items-center">
                <input
                  type="text"
                  value={trackNumber}
                  onChange={(e) => setTrackNumber(e.target.value)}
                  placeholder="Enter Request Number (e.g., GOV-2026-000001)"
                  className="w-full pl-11 pr-28 py-3.5 rounded-lg bg-white text-slate-900 placeholder-slate-400 text-sm font-medium shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
                <button
                  type="submit"
                  className="absolute right-2 px-4 py-2 rounded-md bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition-colors shadow-xs"
                >
                  Track Status
                </button>
              </form>

              {/* Sample Quick Chips */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
                <span>Try sample numbers:</span>
                <button
                  type="button"
                  onClick={() => setTrackNumber('GOV-2026-000001')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[11px] border border-slate-700 transition-colors"
                >
                  GOV-2026-000001 (Ready)
                </button>
                <button
                  type="button"
                  onClick={() => setTrackNumber('GOV-2026-000002')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[11px] border border-slate-700 transition-colors"
                >
                  GOV-2026-000002 (Verification)
                </button>
                <button
                  type="button"
                  onClick={() => setTrackNumber('GOV-2026-000003')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[11px] border border-slate-700 transition-colors"
                >
                  GOV-2026-000003 (Doc Needed)
                </button>
              </div>
            </div>

            {/* Main Action CTA Buttons */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/services"
                className="px-6 py-3 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all flex items-center gap-2"
              >
                Apply for Document
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/track-request"
                className="px-6 py-3 rounded-lg text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center gap-2"
              >
                Track Application
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 rounded-lg text-sm font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Citizen / Officer Login →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Advantages */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold text-blue-700 uppercase tracking-wider">Citizen Benefits</h2>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              End-to-End Digital Certification Without Bureaucratic Delays
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:shadow-xs transition-all">
              <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center mb-4">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Paperless Online Application</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Submit details from home, scan and attach UIDAI Aadhaar, address proofs, and photos directly in PDF or image format.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:shadow-xs transition-all">
              <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Real-Time Status Timeline</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                View chronological progress markers as your application moves from scrutiny to circle verification, approval, and issuance.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:shadow-xs transition-all">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Verified Digital Download</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Once sanctioned by the designated officer, download your official certificate with tamper-proof digital seals anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6-Stage Process Flow Diagram */}
      <section id="workflow" className="py-16 bg-slate-100/70 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold text-blue-700 uppercase tracking-wider">Transparent Pipeline</h2>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              How Your Government Document Request Moves Through the System
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
            {[
              { num: '01', title: 'Submit Application', desc: 'Fill form & state details' },
              { num: '02', title: 'Upload Proofs', desc: 'Aadhaar, income, photos' },
              { num: '03', title: 'Desk Scrutiny', desc: 'Officer verifies records' },
              { num: '04', title: 'Field Processing', desc: 'Clearance & draft certificate' },
              { num: '05', title: 'Sanction & Seal', desc: 'Approved by Magistrate/SDM' },
              { num: '06', title: 'Digital Download', desc: 'Certificate ready for print' }
            ].map((step, idx) => (
              <div key={idx} className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs relative">
                <div className="text-xs font-black text-blue-700 mb-1 font-mono">{step.num}</div>
                <h4 className="text-xs font-bold text-slate-900">{step.title}</h4>
                <p className="text-[11px] text-slate-500 mt-1">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Available Certificates */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-xs font-bold text-blue-700 uppercase tracking-wider">Citizen Catalog</h2>
              <p className="text-2xl font-bold text-slate-900 mt-1">Popular Government Certificates</p>
            </div>
            <Link
              to="/services"
              className="text-sm font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
            >
              Browse all available documents →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {docTypes.map((doc) => (
              <div
                key={doc._id}
                className="p-6 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="font-medium text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                      {doc.department.split(' ')[0]} Dept
                    </span>
                    <span className="font-mono">Est. {doc.processingTime} Days</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{doc.name}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2 mb-4">{doc.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">Statutory Fee</span>
                    <span className="text-sm font-bold text-slate-800">
                      {doc.fee === 0 ? 'Free (₹0)' : `₹${doc.fee}`}
                    </span>
                  </div>

                  <Link
                    to={`/citizen/apply?docType=${doc._id}`}
                    className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 transition-colors"
                  >
                    Apply Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-xs font-bold text-blue-700 uppercase tracking-wider">Frequently Asked Questions</h2>
            <p className="text-2xl font-bold text-slate-900 mt-1">Frequently Asked Questions by Citizens</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-xs">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-semibold text-sm text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                      faqOpen[idx] ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {faqOpen[idx] && (
                  <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
