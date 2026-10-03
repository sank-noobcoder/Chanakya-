import Link from "next/link";
import { ShieldCheck, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#07090F] py-12 relative overflow-hidden">
      {/* Indian tricolor accent gradient line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808] opacity-60"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-3">
              <span className="font-heading font-bold text-lg text-white">CHANAKYA</span>
              <span className="text-xs font-mono text-saffron px-2 py-0.5 rounded bg-saffron/10 border border-saffron/20">
                Sovereign Core
              </span>
            </div>
            <p className="text-sm text-gray-400 max-w-md leading-relaxed">
              India's first from-scratch mathematical optimization engine. Built to eliminate strategic dependency on foreign solvers across refining, petrochemicals, power dispatch, and heavy logistics.
            </p>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-sm text-white mb-3 uppercase tracking-wider">Engine Docs</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/docs" className="hover:text-saffron transition-colors">Revised Dual Simplex</Link></li>
              <li><Link href="/docs" className="hover:text-saffron transition-colors">Mehrotra Interior Point</Link></li>
              <li><Link href="/docs" className="hover:text-saffron transition-colors">Branch-and-Cut Engine</Link></li>
              <li><Link href="/docs" className="hover:text-saffron transition-colors">Verify-Before-Report</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-sm text-white mb-3 uppercase tracking-wider">Security & Compliance</h4>
            <ul className="space-y-2 text-sm text-gray-400 font-mono text-xs">
              <li className="flex items-center space-x-1.5 text-cyan-live">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>7-Layer OSI Defense</span>
              </li>
              <li><span>Apache 2.0 Sovereign License</span></li>
              <li><span>No Foreign Commercial Code</span></li>
              <li><span>Sandboxed Worker Execution</span></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500">
          <p>© 2026 Sovereign Mathematical Optimization Initiative. All rights reserved.</p>
          <p className="flex items-center space-x-1 mt-2 sm:mt-0">
            <span>Engineered with mathematical rigor in India</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
