import { Phone, Mail, MapPin, Globe, ArrowUp, ShieldCheck } from "lucide-react";

interface FooterProps {
  setView: (view: string) => void;
}

export default function Footer({ setView }: FooterProps) {
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-brand-green-dark text-white pt-12 pb-6 border-t-4 border-brand-gold mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Column 1: Brand & Bio */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                <span className="text-brand-green font-extrabold text-lg tracking-tighter">BB</span>
              </div>
              <div>
                <h3 className="font-extrabold text-base tracking-tight text-white leading-none">
                  BUNNA BANK
                </h3>
                <p className="text-[10px] font-medium text-brand-gold font-mono tracking-widest uppercase mt-0.5">
                  Hamusit Branch
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed max-w-sm">
              Bunna Bank Hamusit Branch is committed to providing highly accessible, digital, and modern financial service campaign options. Our Campaign Report System tracks daily performance milestones toward banking excellence.
            </p>
            <div className="flex items-center gap-2 text-xs text-brand-gold font-mono">
              <ShieldCheck className="w-4 h-4" />
              Secure Bank Cryptographic API Environment
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-brand-gold font-mono">
              Quick Portals
            </h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li>
                <button 
                  onClick={() => { setView("home"); handleScrollToTop(); }} 
                  className="hover:text-brand-gold transition-colors"
                >
                  Home / Info Hub
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setView("dashboard"); handleScrollToTop(); }} 
                  className="hover:text-brand-gold transition-colors"
                >
                  Live Analytics Dashboard
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setView("reports"); handleScrollToTop(); }} 
                  className="hover:text-brand-gold transition-colors"
                >
                  Daily Campaign Journals
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setView("statistics"); handleScrollToTop(); }} 
                  className="hover:text-brand-gold transition-colors"
                >
                  Growth Metrics (Charts)
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact details */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-brand-gold font-mono">
              Hamusit Branch
            </h4>
            <ul className="space-y-2.5 text-xs text-gray-300">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                <span>Hamusit Branch Office, Hamusit, Amhara Region, Ethiopia</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-gold shrink-0" />
                <span>+251584430376/77</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-gold shrink-0" />
                <span>hamusit@bunnabanksc.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-brand-gold shrink-0" />
                <a href="https://bunnabanksc.com" target="_blank" rel="noreferrer" className="hover:text-brand-gold transition-colors">
                  bunnabanksc.com
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Divider */}
        <hr className="my-8 border-brand-green-light" />

        {/* Bottom copyright row */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <div>
            <p>© 2026 Bunna Bank Hamusit Branch. All Rights Reserved.</p>
            <p className="text-[10px] font-mono text-gray-500 mt-1">
              Developed by <span className="text-brand-gold">Hamusit Branch Bunna Families</span>
            </p>
          </div>
          
          <button
            onClick={handleScrollToTop}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-green hover:bg-brand-green-light border border-brand-green-light text-brand-gold text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            Back to Top
          </button>
        </div>

      </div>
    </footer>
  );
}
