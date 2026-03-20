import { useNavigate } from "react-router-dom";

const platforms = [
  { name: "Swiggy", color: "#fc8019" },
  { name: "Zomato", color: "#e23744" },
  { name: "Blinkit", color: "#f8d000" },
  { name: "Zepto", color: "#8b5cf6" },
];

const features = [
  {
    icon: "🌧️",
    title: "Weather disruption cover",
    desc: "Heavy rain, heatwave or AQI spike? Your payout triggers automatically — no claim filing needed.",
  },
  {
    icon: "📉",
    title: "Algorithm downtime cover",
    desc: "Platform shows you online but no orders coming? AI detects demand drops and triggers your payout.",
  },
  {
    icon: "⚡",
    title: "Instant parametric payout",
    desc: "Event detected → claim created → money in your UPI within 2 hours. Zero paperwork.",
  },
  {
    icon: "🗺️",
    title: "Smart zone suggestions",
    desc: "AI recommends the highest-earning delivery zones based on live demand and weather data.",
  },
  {
    icon: "🏊",
    title: "Collective risk pool",
    desc: "Workers contribute ₹25–50/week into a shared city pool. Claims are paid from the pool transparently.",
  },
  {
    icon: "🤖",
    title: "AI fraud protection",
    desc: "Every claim is verified by AI — duplicate detection, GPS check and frequency analysis.",
  },
];

const howItWorks = [
  { step: "1", title: "Sign up in 2 minutes", desc: "Link your Swiggy/Zomato/Blinkit/Zepto account and pick a plan." },
  { step: "2", title: "Pay ₹25–50/week", desc: "Premium is based on your risk score — full-time riders pay more, part-time less." },
  { step: "3", title: "AI monitors 24/7", desc: "Weather, AQI, platform demand and traffic — all tracked in real time." },
  { step: "4", title: "Get paid automatically", desc: "When a trigger fires, your payout hits your UPI. No action needed." },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: "#0f172a", background: "#fff" }}>

      {/* Nav */}
      <nav style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "18px 48px", borderBottom: "1px solid #f1f5f9",
        position: "sticky", top: 0, background: "#fff", zIndex: 100
      }}>
        <div style={{ fontFamily: "'Sora', sans-serif", fontSize: "22px", fontWeight: 700 }}>
          Earn<span style={{ color: "#5b4cf5" }}>Sure</span>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={() => navigate("/login")} style={{
            padding: "9px 20px", borderRadius: "8px", border: "1px solid #e2e8f0",
            background: "#fff", fontWeight: 600, fontSize: "14px", cursor: "pointer"
          }}>Log in</button>
          <button onClick={() => navigate("/login")} style={{
            padding: "9px 20px", borderRadius: "8px", border: "none",
            background: "#5b4cf5", color: "#fff", fontWeight: 600, fontSize: "14px", cursor: "pointer"
          }}>Get started →</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        background: "linear-gradient(135deg, #0f0e1a 0%, #1e1b4b 60%, #0f1a1a 100%)",
        color: "#fff", padding: "80px 48px", textAlign: "center"
      }}>
        <div style={{
          display: "inline-flex", gap: "8px", flexWrap: "wrap", justifyContent: "center",
          marginBottom: "24px"
        }}>
          {platforms.map((p) => (
            <span key={p.name} style={{
              padding: "5px 14px", borderRadius: "999px", fontSize: "13px", fontWeight: 600,
              background: `${p.color}22`, color: p.color, border: `1px solid ${p.color}44`
            }}>{p.name}</span>
          ))}
        </div>

        <h1 style={{
          fontFamily: "'Sora', sans-serif", fontSize: "clamp(32px, 5vw, 56px)",
          fontWeight: 700, lineHeight: 1.15, maxWidth: "720px", margin: "0 auto 20px"
        }}>
          Income protection for<br />
          <span style={{ color: "#a78bfa" }}>food delivery riders</span>
        </h1>

        <p style={{
          fontSize: "18px", color: "rgba(255,255,255,0.6)", maxWidth: "520px",
          margin: "0 auto 36px", lineHeight: 1.6
        }}>
          Rain stops orders. Heatwaves ground riders. Platform glitches kill earnings.
          EarnSure pays you automatically when disruptions hit — no claims, no waiting.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/login")} style={{
            padding: "14px 32px", borderRadius: "12px", border: "none",
            background: "#5b4cf5", color: "#fff", fontWeight: 700, fontSize: "16px", cursor: "pointer"
          }}>I'm a delivery rider →</button>
          <button onClick={() => navigate("/login")} style={{
            padding: "14px 32px", borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.2)", background: "transparent",
            color: "#fff", fontWeight: 600, fontSize: "16px", cursor: "pointer"
          }}>Admin console</button>
        </div>

        <div style={{
          display: "flex", gap: "32px", justifyContent: "center", marginTop: "56px",
          flexWrap: "wrap"
        }}>
          {[
            { value: "4,820+", label: "Active riders" },
            { value: "₹31.6L", label: "Pool balance" },
            { value: "2 hrs", label: "Avg payout time" },
            { value: "92%", label: "Auto-trigger rate" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: "28px", fontWeight: 700, color: "#a78bfa" }}>{stat.value}</div>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", marginTop: "4px" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* What disruptions we cover */}
      <section style={{ padding: "72px 48px", background: "#f8fafc" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.2em", color: "#5b4cf5", textTransform: "uppercase", marginBottom: "10px" }}>Coverage</div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: "32px", fontWeight: 700, margin: 0 }}>
            What disruptions are covered?
          </h2>
          <p style={{ color: "#64748b", marginTop: "12px", fontSize: "16px" }}>
            Specific to food delivery — not generic insurance
          </p>
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px", maxWidth: "1100px", margin: "0 auto"
        }}>
          {[
            { icon: "🌧️", title: "Heavy rain", desc: "Rainfall > 20mm in 3 hours. Orders drop, roads flood, riders can't work." },
            { icon: "🌡️", title: "Heatwave", desc: "Temperature > 42°C. Unsafe riding conditions, platform demand drops." },
            { icon: "🌫️", title: "AQI spike", desc: "Air quality index > 200. Health risk for riders on the road for 8+ hours." },
            { icon: "📉", title: "Algorithm downtime", desc: "You're online but getting zero orders. AI detects the demand anomaly." },
            { icon: "⛈️", title: "Severe weather", desc: "Cyclones, storms, flooding — any event that grounds delivery operations." },
            { icon: "🚦", title: "Traffic disruption", desc: "Major road closures or accidents that make delivery zones unreachable." },
          ].map((item) => (
            <div key={item.title} style={{
              background: "#fff", borderRadius: "16px", padding: "22px",
              border: "1px solid #e2e8f0"
            }}>
              <div style={{ fontSize: "28px", marginBottom: "10px" }}>{item.icon}</div>
              <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "6px" }}>{item.title}</div>
              <div style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "72px 48px" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.2em", color: "#5b4cf5", textTransform: "uppercase", marginBottom: "10px" }}>Features</div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: "32px", fontWeight: 700, margin: 0 }}>
            Built for gig workers, not corporates
          </h2>
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px", maxWidth: "1100px", margin: "0 auto"
        }}>
          {features.map((f) => (
            <div key={f.title} style={{
              padding: "24px", borderRadius: "16px",
              border: "1px solid #e2e8f0", background: "#fff"
            }}>
              <div style={{ fontSize: "28px", marginBottom: "12px" }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "8px" }}>{f.title}</div>
              <div style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "72px 48px", background: "#f8fafc" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.2em", color: "#5b4cf5", textTransform: "uppercase", marginBottom: "10px" }}>How it works</div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: "32px", fontWeight: 700, margin: 0 }}>
            Start earning protection in minutes
          </h2>
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px", maxWidth: "900px", margin: "0 auto"
        }}>
          {howItWorks.map((item) => (
            <div key={item.step} style={{ textAlign: "center", padding: "24px" }}>
              <div style={{
                width: "48px", height: "48px", borderRadius: "50%", background: "#5b4cf5",
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "18px",
                margin: "0 auto 16px"
              }}>{item.step}</div>
              <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "8px" }}>{item.title}</div>
              <div style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: "72px 48px" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.2em", color: "#5b4cf5", textTransform: "uppercase", marginBottom: "10px" }}>Pricing</div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: "32px", fontWeight: 700, margin: 0 }}>
            Less than a cup of chai per day
          </h2>
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px", maxWidth: "800px", margin: "0 auto"
        }}>
          {[
            { plan: "Low risk", price: "₹25", period: "/week", desc: "Part-time riders, good weather zones, high acceptance rate", color: "#16a34a" },
            { plan: "Medium risk", price: "₹35", period: "/week", desc: "Full-time riders, moderate disruption zones", color: "#5b4cf5", featured: true },
            { plan: "High risk", price: "₹50", period: "/week", desc: "Full-time, high disruption cities, lower acceptance rate", color: "#dc2626" },
          ].map((tier) => (
            <div key={tier.plan} style={{
              padding: "28px", borderRadius: "20px",
              border: tier.featured ? `2px solid ${tier.color}` : "1px solid #e2e8f0",
              background: tier.featured ? "#f5f3ff" : "#fff",
              position: "relative"
            }}>
              {tier.featured && (
                <div style={{
                  position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)",
                  background: "#5b4cf5", color: "#fff", fontSize: "11px", fontWeight: 700,
                  padding: "4px 12px", borderRadius: "999px"
                }}>Most common</div>
              )}
              <div style={{ fontSize: "13px", fontWeight: 600, color: tier.color, marginBottom: "8px" }}>{tier.plan}</div>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: "36px", fontWeight: 700 }}>
                {tier.price}<span style={{ fontSize: "14px", color: "#64748b", fontWeight: 400 }}>{tier.period}</span>
              </div>
              <div style={{ fontSize: "13px", color: "#64748b", marginTop: "10px", lineHeight: 1.6 }}>{tier.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        background: "linear-gradient(135deg, #0f0e1a, #1e1b4b)",
        color: "#fff", padding: "72px 48px", textAlign: "center"
      }}>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: "36px", fontWeight: 700, marginBottom: "16px" }}>
          Ready to protect your income?
        </h2>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "16px", marginBottom: "32px" }}>
          Join 4,820+ delivery riders already covered across Bengaluru, Hyderabad, Chennai & Pune.
        </p>
        <button onClick={() => navigate("/login")} style={{
          padding: "16px 40px", borderRadius: "12px", border: "none",
          background: "#5b4cf5", color: "#fff", fontWeight: 700, fontSize: "16px", cursor: "pointer"
        }}>Get started for free →</button>
      </section>

      {/* Footer */}
      <footer style={{
        padding: "24px 48px", borderTop: "1px solid #f1f5f9",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: "13px", color: "#94a3b8", flexWrap: "wrap", gap: "8px"
      }}>
        <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, color: "#0f172a" }}>
          Earn<span style={{ color: "#5b4cf5" }}>Sure</span>
        </div>
        <div>AI-powered parametric insurance for gig workers · Guidewire DEVTrails 2026</div>
      </footer>
    </div>
  );
}
