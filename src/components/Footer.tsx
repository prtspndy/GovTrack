import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Phone, Mail, HelpCircle, ExternalLink, AlertCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      {/* Disclaimer Banner */}
      <div className="bg-amber-950/60 border-b border-amber-900/50 py-2.5 px-4 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Official Prototype Disclaimer:</strong> This portal is a high-fidelity demonstration environment for testing citizen document issuance and transparent tracking workflows. It does not replace statutory offline judicial processes.
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
              <span className="font-bold text-base tracking-tight">GovTrack Portal</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Digitizing civil records, statutory certificates, and transparent tracking to eliminate unnecessary physical office queues for citizens.
            </p>
            <div className="pt-2 text-slate-500">
              Department of Administrative Reforms & Public Grievances (Demo)
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-xs">Citizen Services</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  Income & Asset Certificates
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  Domicile & Residence Proofs
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  Caste & Category Clearances
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  Municipal Birth & Death Extracts
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  Senior Citizen Identity Cards
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-xs">Citizen Help & Transparency</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/track-request" className="hover:text-white transition-colors">
                  Track Application by Number
                </Link>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  Application Timelines & SLA
                </a>
              </li>
              <li>
                <a href="#workflow" className="hover:text-white transition-colors">
                  6-Stage Verification Pipeline
                </a>
              </li>
              <li>
                <span className="text-slate-500">DigiLocker Integration Ready</span>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-xs">Support & Helpdesk</h4>
            <p className="text-slate-400">
              For status enquiries or assistance with document scanning and uploading:
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-4 h-4 text-blue-400" />
                <span className="font-mono">1800-000-GOVTRACK (Toll-Free)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-4 h-4 text-blue-400" />
                <span className="font-mono">support@govtrack.demo</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">Operating Hours: Mon–Sat, 9:00 AM – 6:00 PM IST</p>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
          <p>© {new Date().getFullYear()} GovTrack Digital Citizen Services. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>WCAG 2.1 AA Accessible</span>
            <span>256-Bit SSL Encrypted</span>
            <span>Role-Based Access Control</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
