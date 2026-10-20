import React from "react";
import { Link } from "react-router-dom";

function LegalShell({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 space-y-8">
      {/* Disclaimer Alert */}
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 leading-relaxed">
        <strong>ማስታወሻ / Notice:</strong> ይህ የህግ ሰነድ ለመድረኩ የተዘጋጀ የመጀመሪያ ሞዴል (Template) ሲሆን፣ በምርት (Production) ላይ ከመዋሉ በፊት በህግ ባለሙያ መመርመር ይኖርበታል። / This legal document is an operational template and requires qualified legal review before production deployment.
      </div>

      <div>
        <h1 className="text-3xl font-black text-slate-900">{title}</h1>
        <p className="mt-1 text-xs text-slate-500">የመጨረሻ ማሻሻያ / Last Updated: {lastUpdated}</p>
      </div>

      <div className="prose prose-slate max-w-none rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 text-sm leading-relaxed text-slate-700 space-y-6">
        {children}
      </div>

      <div className="flex gap-4 border-t border-slate-200 pt-6 text-xs font-semibold text-blue-600">
        <Link to="/privacy">የግላዊነት መመሪያ (Privacy)</Link>
        <span>•</span>
        <Link to="/terms">የአጠቃቀም ውሎች (Terms)</Link>
        <span>•</span>
        <Link to="/cookies">የኩኪ ፖሊሲ (Cookies)</Link>
        <span>•</span>
        <Link to="/acceptable-use">ተቀባይነት ያለው አጠቃቀም (Acceptable Use)</Link>
      </div>
    </div>
  );
}

export function PrivacyPolicyPage() {
  return (
    <LegalShell title="የግላዊነት መመሪያ / Privacy Policy" lastUpdated="2026-10-20">
      <h3 className="text-lg font-bold text-slate-900">1. የመረጃ አሰባሰብ / Information We Collect</h3>
      <p>
        LearnHUB የተማሪዎችን ስም፣ ኢሜይል፣ የመማር ግቦችንና ፍላጎቶችን እንዲሁም የአስተማሪዎችን የትምህርት ዝግጅት እና የልምድ መረጃዎችን ይሰበስባል። እነዚህ መረጃዎች ለተማሪ ምደባ እና ለክፍል አስተዳደር ብቻ ያገለግላሉ።
      </p>

      <h3 className="text-lg font-bold text-slate-900">2. የመረጃ ደህንነት / Data Security</h3>
      <p>
        ሁሉም የይለፍ ቃላት በዘመናዊ የክሪፕቶግራፊክ አልጎሪዝም (Argon2 / bcrypt) የተመሰጠሩ ናቸው። ክፍለ ጊዜዎች እና የትምህርት ፋይሎች ጥብቅ የፍቃድ ስርዓት (Role-Based Access Control) ባላቸው ተጠቃሚዎች ብቻ እንዲታዩ ይደረጋሉ።
      </p>

      <h3 className="text-lg font-bold text-slate-900">3. ለሶስተኛ ወገን አለማጋራት / Third-Party Disclosure</h3>
      <p>
        LearnHUB የተጠቃሚዎችን የግል መረጃ ለሶስተኛ ወገን አይሸጥም ወይም አያስተላልፍም። አስፈላጊ ሲሆን (ለምሳሌ የGoogle Meet የቀጥታ ስብሰባዎች) አገልግሎት ለመስጠት በሚያስፈልገው መጠን ብቻ ይገናኛል።
      </p>
    </LegalShell>
  );
}

export function TermsOfServicePage() {
  return (
    <LegalShell title="የአጠቃቀም ውሎች / Terms of Service" lastUpdated="2026-10-20">
      <h3 className="text-lg font-bold text-slate-900">1. የመድረኩ አጠቃቀም / Platform Usage</h3>
      <p>
        LearnHUBን በመጠቀም ተማሪዎች እና አስተማሪዎች የተቋቋሙትን የንግድ ደንቦች (Business Rules) ለማክበር ይስማማሉ። ተማሪዎች በአስተዳዳሪው በሚመደቡበት ክፍል ብቻ መሳተፍ ይችላሉ።
      </p>

      <h3 className="text-lg font-bold text-slate-900">2. የአስተማሪዎች ኃላፊነት / Teacher Responsibilities</h3>
      <p>
        አስተማሪዎች የተመደቡላቸውን ክፍሎች በታማኝነት የማስተማር፣ የክፍለ ጊዜ መገኘትን የመመዝገብ፣ እና የተማሪ ስራዎችን በትክክል የመገምገም ኃላፊነት አለባቸው።
      </p>

      <h3 className="text-lg font-bold text-slate-900">3. የአካውንት እገዳ እና መሰረዝ / Suspension</h3>
      <p>
        መድረኩን አላግባብ የሚጠቀም፣ የጥላቻ መልዕክት የሚያስተላልፍ ወይም ደንብ የሚጥስ ተጠቃሚ አካውንት በHub Admin ውሳኔ ሊታገድ ወይም ሊሰረዝ ይችላል።
      </p>
    </LegalShell>
  );
}

export function CookiePolicyPage() {
  return (
    <LegalShell title="የኩኪ ፖሊሲ / Cookie Policy" lastUpdated="2026-10-20">
      <h3 className="text-lg font-bold text-slate-900">1. የኩኪዎች አገልግሎት / Essential Cookies</h3>
      <p>
        LearnHUB ደህንነቱ የተጠበቀ ክፍለ ጊዜን (Secure HttpOnly Session) ለማስጠበቅ እና የመረጡትን የቋንቋ ምርጫ (አማርኛ / English) ለማስታወስ አስፈላጊ ኩኪዎችን ይጠቀማል።
      </p>
      <p>
        ምንም አይነት የማስታወቂያ መከታተያ (Advertising Tracking) ኩኪዎችን አንጠቀምም።
      </p>
    </LegalShell>
  );
}

export function AcceptableUsePage() {
  return (
    <LegalShell title="ተቀባይነት ያለው አጠቃቀም / Acceptable Use Policy" lastUpdated="2026-10-20">
      <h3 className="text-lg font-bold text-slate-900">1. ክልከላዎች / Prohibited Actions</h3>
      <p>
        በLearnHUB ላይ ተንኮል አዘል ፋይሎችን መጫን፣ የሌላ ሰውን የግል መረጃ ለመመልከት መሞከር፣ የGoogle Meet አገናኞችን ላልተፈቀደላቸው ሰዎች ማጋራት፣ እና አላስፈላጊ ይዘቶችን መልቀቅ በጥብቅ የተከለከለ ነው።
      </p>
    </LegalShell>
  );
}
