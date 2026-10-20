import { Link } from "react-router-dom";

export function AboutPage() {

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-16">
      <div className="max-w-3xl">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">ስለ LearnHUB / About LearnHUB</span>
        <h1 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
          በአስተማሪ የሚመራ፣ የተደራጀ እና እውነተኛ የትምህርት መድረክ
        </h1>
        <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed">
          LearnHUB ለተማሪዎች ጥራት ያለው፣ በብቁ አስተማሪዎች የሚመራ እና በአስተዳዳሪ ጥንቃቄ የተመደበ ዘመናዊ የመማር ተሞክሮ ለመስጠት የተገነባ መድረክ ነው።
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600">
            🎯
          </div>
          <h3 className="mt-6 text-xl font-bold text-slate-900">ተልዕኮ (Mission)</h3>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            ማንኛውም ተማሪ ጥራት ያለው ትምህርት፣ ከአስተማሪ ጋር በቀጥታ በሚደረግ የGoogle Meet ግንኙነት እና በተግባራዊ ስራዎች እንዲያገኝ ማስቻል ነው።
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-2xl text-cyan-600">
            🔭
          </div>
          <h3 className="mt-6 text-xl font-bold text-slate-900">ራዕይ (Vision)</h3>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            በቴክኖሎጂ፣ በቋንቋ እና በሙያዊ ዘርፎች የታመነ፣ ግልጽ እና ውጤት ተኮር ቀዳሚ የኦንላይን የትምህርት አስተዳደር መድረክ መሆን።
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl text-emerald-600">
            💎
          </div>
          <h3 className="mt-6 text-xl font-bold text-slate-900">ዋና እሴቶች (Values)</h3>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            ጥራት፣ ታማኝነት፣ ግልጽ የተማሪ እድገት ክትትል፣ ደህንነት እና የተረጋገጠ የአስተማሪ ብቃት የመድረኩ መሰረታዊ እሴቶች ናቸው።
          </p>
        </div>
      </div>

      {/* Unique Placement Model */}
      <div className="rounded-3xl bg-slate-900 p-8 sm:p-12 text-white">
        <div className="max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">የአሰራር ስርዓታችን / Architecture</span>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold">
            ለምን የHub Admin የተማሪ ምደባ ስርዓት እንጠቀማለን?
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            በLearnHUB ተማሪዎች በራሳቸው ወደ ክፍል አይመደቡም። ይልቁንስ የHub Admin ቡድን የተማሪውን ደረጃ እና የጊዜ ምርጫ መርምሮ ወደ ተመጣጣኝ ክፍል እና ለአስተማሪው የተመጠነ የተማሪ ቁጥር (Capacity) ይመድባል። ይህ ስርዓት የአስተማሪዎችን የጊዜ መደራረብ ይከላከላል፣ የተማሪዎችን ውጤታማነት በእጅጉ ያረጋግጣል።
          </p>
          <div className="mt-8 flex gap-4">
            <Link
              to="/register/student"
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition-colors"
            >
              ተማሪ ይሁኑ / Become a Student
            </Link>
            <Link
              to="/apply/teacher"
              className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              አስተማሪ ይሁኑ / Apply to Teach
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
