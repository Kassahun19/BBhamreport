import { useState, FormEvent } from "react";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Users, 
  Send, 
  ShieldCheck, 
  Award,
  CheckCircle2,
  FileText
} from "lucide-react";

interface AboutContactProps {
  onNotification: (msg: string, type: "success" | "error") => void;
}

export default function AboutContactPage({ onNotification }: AboutContactProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      onNotification("Please fill out all required fields.", "error");
      return;
    }

    setIsSending(true);
    // Simulate sending with standard timer
    setTimeout(() => {
      onNotification("Your message has been received by Hamusit Branch leadership! We will get back to you shortly.", "success");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setIsSending(false);
    }, 1200);
  };

  return (
    <div id="about-contact-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Page Title Header */}
      <div className="text-left bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 h-full w-2 bg-brand-gold" />
        <h2 className="text-xl sm:text-2xl font-extrabold text-brand-green tracking-tight flex items-center gap-2">
          <Building2 className="w-5 h-5 text-brand-gold" />
          About Bunna Bank Hamusit Branch
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Learn about our branch development, financial inclusion goals, and contact our regional leadership team.
        </p>
      </div>

      {/* Grid section for About details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
        
        {/* Left Column: Branch History & Vision */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            
            <div className="space-y-3">
              <h3 className="text-lg font-extrabold text-brand-green">Branch Mission & Impact</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Established as a crucial financial hub in South Gondar, the **Hamusit Branch of Bunna Bank S.C.** serves a vibrant community of farmers, traders, cooperative unions, and individuals. Our primary mission is to expand digital finance capabilities, offering immediate accessibility through local outreach, mobile apps, and merchant onboarding.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                <div className="flex items-center gap-2 text-brand-green font-bold text-xs mb-1">
                  <Award className="w-4.5 h-4.5 text-brand-gold shrink-0" />
                  Local Leadership
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Driving localized retail campaign efforts to support agricultural cooperatives and small merchant trading.
                </p>
              </div>

              <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                <div className="flex items-center gap-2 text-brand-green font-bold text-xs mb-1">
                  <ShieldCheck className="w-4.5 h-4.5 text-brand-gold shrink-0" />
                  Certified Digital Base
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Over 10,000 active mobile banking activations and secure debit card onboarding across Hamusit town.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-gold-dark font-mono">Our Operational Standards</h4>
              <ul className="space-y-2 text-xs text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                  <span>Transparent daily reporting of commercial campaign efforts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                  <span>Continuous system auditing and operator tracking logs</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                  <span>Direct regional coordination for merchant PoS deployment</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Business Hours & Location detail */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-brand-green uppercase tracking-wider font-mono flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-gold" />
                Business Hours
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-600 font-mono">
                <li>Monday - Friday: 8:00 AM - 5:00 PM</li>
                <li>Saturday: 8:00 AM - 12:30 PM</li>
                <li className="text-red-500">Sunday & Public Holidays: Closed</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-brand-green uppercase tracking-wider font-mono flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand-gold" />
                Branch Details
              </h4>
              <ul className="space-y-1 text-xs text-gray-600">
                <li><strong>Branch Manager:</strong> Kassahun Mulatu</li>
                <li><strong>Branch Code:</strong> BB-HAM-047</li>
                <li><strong>Region:</strong> Amhara, South Gondar, Ethiopia</li>
              </ul>
            </div>
          </div>

        </div>

        {/* Right Column: Contact Directory & Message Form */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Quick Contact Box */}
          <div className="bg-brand-green text-white p-6 rounded-2xl shadow-md space-y-4">
            <h3 className="font-extrabold text-base tracking-tight text-brand-gold">
              Contact Directory
            </h3>
            
            <ul className="space-y-3.5 text-xs">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                <span>Hamusit Branch Building, Commercial Strip, Hamusit town, Ethiopia</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-brand-gold shrink-0" />
                <span>Office: +251 58 123 4567</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-brand-gold shrink-0" />
                <span>hamusit@bunnabanksc.com</span>
              </li>
            </ul>
          </div>

          {/* Interactive Message Form */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-gray-800">
              Submit a Query to the Manager
            </h3>

            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 block uppercase">Your Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Abebe Kebede"
                  className="w-full px-3 py-2 border border-gray-200 focus:border-brand-green focus:outline-none rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 block uppercase">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. abebe@gmail.com"
                  className="w-full px-3 py-2 border border-gray-200 focus:border-brand-green focus:outline-none rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 block uppercase">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. QR/PoS Activation request"
                  className="w-full px-3 py-2 border border-gray-200 focus:border-brand-green focus:outline-none rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 block uppercase">Message / Inquiry *</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your detailed query here..."
                  className="w-full px-3 py-2 border border-gray-200 focus:border-brand-green focus:outline-none rounded-xl text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-green hover:bg-brand-green-light text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-green-glow disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-brand-gold" />
                {isSending ? "Sending message..." : "Send to Branch"}
              </button>
            </form>

          </div>

        </div>

      </div>

    </div>
  );
}
