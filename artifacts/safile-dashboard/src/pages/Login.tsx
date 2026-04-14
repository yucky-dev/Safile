import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldCheck, Network, CheckCircle2, Eye, EyeOff, Loader2, ChevronRight } from "lucide-react";
import logoSrc from "@assets/file_00000000542c72469085e721bd5e845e_1776753245703.png";

type Step = 0 | 1 | 2;

const STEPS = [
  { label: "Credentials" },
  { label: "Indexd Node" },
  { label: "Ready" },
];

export function Login() {
  const { login } = useAuth();

  const [step, setStep] = useState<Step>(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [nodeUrl, setNodeUrl] = useState("http://localhost:9900");
  const [apiPassword, setApiPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showApiPw, setShowApiPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function goNext() {
    setError("");
    if (step === 0) {
      if (!email.trim() || !password.trim() || !name.trim() || !institution.trim()) {
        setError("All fields are required.");
        return;
      }
      if (!email.includes("@")) {
        setError("Enter a valid email address.");
        return;
      }
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setStep(1);
      }, 900);
    } else if (step === 1) {
      if (!nodeUrl.trim()) {
        setError("Node URL is required.");
        return;
      }
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setStep(2);
      }, 1100);
    }
  }

  function handleDone() {
    login({ email, name, institution });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") goNext();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background grid pattern */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(215 28% 17% / 0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(215 28% 17% / 0.4) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo card */}
        <div className="flex flex-col items-center mb-8 gap-2">
          <img
            src={logoSrc}
            alt="Safile"
            className="h-16 w-16 object-contain drop-shadow-lg rounded-2xl"
          />
          <div className="text-center">
            <p className="text-xl font-bold tracking-tight text-foreground">SAFILE</p>
            <p className="text-xs text-muted-foreground">Secure Medical Record Backup</p>
          </div>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={[
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                    i < step
                      ? "bg-primary text-primary-foreground scale-90"
                      : i === step
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/25"
                      : "bg-card border border-border text-muted-foreground",
                  ].join(" ")}
                >
                  {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span
                  className={[
                    "text-[10px] font-medium uppercase tracking-wider hidden sm:block",
                    i === step ? "text-primary" : "text-muted-foreground",
                  ].join(" ")}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={[
                    "w-12 h-px transition-all duration-500 mb-4",
                    i < step ? "bg-primary" : "bg-border",
                  ].join(" ")}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-2xl">
          {/* Step 0 — Credentials */}
          {step === 0 && (
            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); goNext(); }}>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Sign In</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Access your hospital's encrypted backup system.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Dr. Ibrahim Al-Hassan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-background border border-border rounded-md px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Institution Email
                  </label>
                  <input
                    type="email"
                    placeholder="admin@hospital.ng"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-background border border-border rounded-md px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Institution Name
                  </label>
                  <input
                    type="text"
                    placeholder="Lagos General Hospital"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full bg-background border border-border rounded-md px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-background border border-border rounded-md px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-destructive text-xs font-medium">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-2.5 rounded-md hover:bg-primary/90 transition disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Continue <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 1 — Sia Indexd Node */}
          {step === 1 && (
            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); goNext(); }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Network className="w-4 h-4 text-primary" />
                  <h2 className="text-xl font-bold tracking-tight">Sia Indexd Node</h2>
                </div>
                <p className="text-muted-foreground text-sm">
                  Connect your institution's decentralized storage gateway.
                </p>
              </div>

              <div className="bg-background/60 border border-border rounded-lg p-4 space-y-1">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">What is Sia indexd?</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Indexd is Sia's indexing and gateway layer. It routes encrypted EHR data to Sia's decentralized
                  storage network, providing tamper-proof, redundant backups across distributed hosts worldwide.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Indexd Gateway URL
                  </label>
                  <input
                    type="url"
                    placeholder="http://localhost:9900"
                    value={nodeUrl}
                    onChange={(e) => setNodeUrl(e.target.value)}
                    className="w-full bg-background border border-border rounded-md px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono transition"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground mt-1">Default Sia indexd port is 9900</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    API Password <span className="text-muted-foreground/50">(optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showApiPw ? "text" : "password"}
                      placeholder="Leave blank if no auth required"
                      autoComplete="new-password"
                      value={apiPassword}
                      onChange={(e) => setApiPassword(e.target.value)}
                      className="w-full bg-background border border-border rounded-md px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiPw(!showApiPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                    >
                      {showApiPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-destructive text-xs font-medium">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="flex-1 border border-border text-foreground font-semibold py-2.5 rounded-md hover:bg-muted/50 transition text-sm"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-2.5 rounded-md hover:bg-primary/90 transition disabled:opacity-60 text-sm"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Connecting…</>
                  ) : (
                    <>Connect Node <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Step 2 — Ready */}
          {step === 2 && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight">System Ready</h2>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                  Welcome, <span className="text-foreground font-medium">{name}</span>. Your encrypted backup
                  session is configured and your Sia indexd gateway is connected.
                </p>
              </div>

              <div className="bg-background/60 border border-border rounded-lg px-5 py-4 space-y-2 text-left">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Institution</span>
                  <span className="font-medium text-foreground">{institution}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Account</span>
                  <span className="font-medium text-foreground font-mono">{email}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Indexd Gateway</span>
                  <span className="font-medium text-primary font-mono">{nodeUrl}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Encryption</span>
                  <span className="font-medium text-primary">AES-256-GCM ✓</span>
                </div>
              </div>

              <button
                onClick={handleDone}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3 rounded-md hover:bg-primary/90 transition text-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                Enter Dashboard
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          SAFILE v2.0 · AES-256-GCM · Sia Indexd · HIPAA-aligned
        </p>
      </div>
    </div>
  );
}
