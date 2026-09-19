import { type MetaFunction, json } from "@remix-run/server-runtime";
import { Link } from "@remix-run/react";
import { Button, Flex, Text, theme, cssVar } from "@webstudio-is/design-system";
import { dashboardPath, loginPath } from "~/shared/router-utils";

export const meta: MetaFunction = () => {
  return [
    { title: "باني | استوديو التصميم المرئي والذكاء الاصطناعي — ybny.net" },
    {
      name: "description",
      content:
        "منصة باني: استوديو مرئي ومحرر مواقع وتطبيقات بالذكاء الاصطناعي مبني ومُعرّب للمطورين والمصممين في العالم العربي.",
    },
  ];
};

export const loader = async () => {
  return json({});
};

export default function HomePortal() {
  const portalRoutes = [
    {
      title: "المحرر المرئي (Studio Canvas)",
      desc: "مساحة العمل التفاعلية لتصميم الصفحات بالسحب والإفلات والتحكم البصري بأنماط CSS.",
      icon: "🎨",
      path: dashboardPath(),
      badge: "الاستوديو الأساسي",
    },
    {
      title: "لوحة المشاريع (Dashboard)",
      desc: "إدارة مساحات العمل والمشاريع، وإنشاء مواقع وتطبيقات جديدة بنقرة واحدة.",
      icon: "📁",
      path: dashboardPath(),
      badge: "لوحة التحكم",
    },
    {
      title: "الصفحات والمسارات (Pages & Routing)",
      desc: "بناء وتعديل مسارات الموقع وتخصيص إعدادات الـ SEO وبيانات الصفحات.",
      icon: "📄",
      path: dashboardPath(),
      badge: "المسارات",
    },
    {
      title: "تصدير الكود النظيف (Export Code)",
      desc: "تصدير كود نظيف وإنتاجي متوافق مع React و Tailwind و Remix دون ارتباط بالخوادم.",
      icon: "⚡",
      path: dashboardPath(),
      badge: "إنتاجي",
    },
    {
      title: "استوديو الذكاء الاصطناعي (AI Studio)",
      desc: "تكامل مستقبلي مع وكلاء الذكاء الاصطناعي لتوليد وتطوير الواجهات برمجياً.",
      icon: "🤖",
      path: dashboardPath(),
      badge: "قريباً",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--background-primary, #090a0f)",
        color: "var(--foreground-primary, #f3f4f6)",
        fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        direction: "rtl",
      }}
    >
      {/* شريط التنقل العلوي */}
      <header
        style={{
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #10b981, #06b6d4)",
              color: "#03140e",
              fontWeight: 800,
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ب
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "16px", letterSpacing: "-0.2px" }}>
              باني <span style={{ fontSize: "11px", color: "#10b981", marginRight: "4px" }}>ybny.net</span>
            </div>
            <div style={{ fontSize: "11px", color: "#9ca3af" }}>استوديو التصميم المرئي</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link
            to={loginPath()}
            style={{
              color: "#d1d5db",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 500,
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            تسجيل الدخول
          </Link>
          <Link
            to={dashboardPath()}
            style={{
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "#02120a",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 700,
              padding: "7px 16px",
              borderRadius: "6px",
              boxShadow: "0 2px 10px rgba(16, 185, 129, 0.3)",
            }}
          >
            افتح الاستوديو 🚀
          </Link>
        </div>
      </header>

      {/* قسم البطولة والتعريف */}
      <main style={{ flex: 1, maxWidth: "1000px", margin: "0 auto", padding: "32px 16px 60px", width: "100%" }}>
        <section style={{ textAlign: "center", marginBottom: "40px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 14px",
              borderRadius: "999px",
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              fontSize: "12px",
              color: "#34d399",
              marginBottom: "16px",
              fontWeight: 500,
            }}
          >
            <span>✨</span>
            <span>المنصة العربية الأولى للتصميم المرئي ومحررات الويب الحديثة</span>
          </div>
          <h1
            style={{
              fontSize: "clamp(24px, 5vw, 42px)",
              fontWeight: 800,
              lineHeight: 1.25,
              marginBottom: "14px",
              color: "#ffffff",
            }}
          >
            استوديو باني المرئي <br />
            <span
              style={{
                background: "linear-gradient(135deg, #34d399 20%, #38bdf8 80%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              لبناء المواقع والتطبيقات البصرية
            </span>
          </h1>
          <p
            style={{
              fontSize: "clamp(13px, 2.5vw, 16px)",
              color: "#9ca3af",
              maxWidth: "600px",
              margin: "0 auto 24px",
              lineHeight: 1.6,
            }}
          >
            محرر ويب مفتوح المصدر ومُعرّب هندسياً يتيح لك تصميم واجهات كاملة بالسحب والإفلات،
            والتحكم الدقيق بأنظمة CSS وتصدير كود برمجي نظيف للمطورين.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
            <Link
              to={dashboardPath()}
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#03140e",
                padding: "10px 24px",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "14px",
              }}
            >
              🎨 دخول استوديو التصميم
            </Link>
            <Link
              to={loginPath()}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                color: "#f3f4f6",
                padding: "10px 20px",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "14px",
                border: "1px solid rgba(255, 255, 255, 0.12)",
              }}
            >
              🔐 تسجيل دخول المشرف
            </Link>
          </div>
        </section>

        {/* شبكة بوابات ومسارات الاستوديو */}
        <section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#fff" }}>بوابات ومسارات الاستوديو</h2>
            <span style={{ fontSize: "12px", color: "#6b7280" }}>تصفح وظائف المحرر المرئي</span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "14px",
            }}
          >
            {portalRoutes.map((route, i) => (
              <Link
                key={i}
                to={route.path}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "18px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(16, 185, 129, 0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                    }}
                  >
                    {route.icon}
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "2px 8px",
                      borderRadius: "999px",
                      backgroundColor: "rgba(255, 255, 255, 0.06)",
                      color: "#9ca3af",
                      fontWeight: 500,
                    }}
                  >
                    {route.badge}
                  </span>
                </div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#ffffff", marginBottom: "6px" }}>
                  {route.title}
                </div>
                <p style={{ fontSize: "12px", color: "#9ca3af", lineHeight: 1.5, margin: 0 }}>
                  {route.desc}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* التذييل */}
      <footer
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "18px 20px",
          textAlign: "center",
          fontSize: "12px",
          color: "#6b7280",
        }}
      >
        مشروع باني © 2026 — ybny.net | نحو استوديو عربي مستقل للمطورين بالذكاء الاصطناعي
      </footer>
    </div>
  );
}