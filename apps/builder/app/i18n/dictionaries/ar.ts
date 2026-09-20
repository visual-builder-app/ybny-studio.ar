import type { Dictionary } from "./index";

/**
 * Arabic dictionary — typed as `Dictionary` (derived from en.ts).
 * Any missing or extraneous key is a TypeScript compile error.
 */
export const ar: Dictionary = {
  locale: {
    switchLabel: "تغيير اللغة",
  },
  auth: {
    login: {
      welcome: "مرحبًا بك في استوديو يبني",
      continueWithGoogle: "تسجيل الدخول عبر Google",
      continueWithGithub: "تسجيل الدخول عبر GitHub",
    },
    secretLogin: {
      toggleButton: "الدخول بالسر",
      secretPlaceholder: "سر الدخول",
      emailPlaceholder: "البريد الإلكتروني (اختياري)",
      defaultPlanOption: "الخطة الافتراضية",
      submit: "دخول",
    },
  },
  common: {
    save: "حفظ",
    saved: "تم الحفظ",
    cancel: "إلغاء",
    delete: "حذف",
    edit: "تعديل",
    create: "إنشاء",
    back: "رجوع",
    loading: "جاري التحميل...",
    close: "إغلاق",
    publish: "نشر",
    share: "مشاركة",
    preview: "معاينة",
  },
  sidebar: {
    components: "المكوّنات",
    pages: "الصفحات",
    navigator: "شجرة العناصر",
    assets: "الوسائط",
    marketplace: "السوق",
    help: "تعلّم أو اطلب المساعدة",
  },
  components: {
    title: "المكوّنات",
    searchPlaceholder: "البحث عن المكوّنات",
    noResults: "لا يوجد مكوّن مطابق",
    categories: {
      general: "الهيكل والعناصر العامة",
      typography: "النصوص والخطوط",
      media: "الوسائط والصور",
      forms: "النماذج وحقول الإدخال",
      radix: "المكوّنات التفاعلية",
      data: "البيانات والمجموعات",
      animations: "الرسوم المتحركة",
      localization: "اللغات والترجمة",
      found: "نتائج البحث",
      other: "مكوّنات أخرى",
    },
  },
  marketplace: {
    title: "السوق",
    categories: {
      sectionTemplates: "الأقسام الجاهزة",
      pageTemplates: "الصفحات والثيمات",
      integrationTemplates: "التكاملات",
    },
    emptyState: {
      title: "لا توجد ثيمات أو قوالب معتمدة في هذا القسم حالياً",
      description:
        "ستظهر هنا قوالب يبني العربية فور تصميمها واعتمادها في النظام.",
    },
  },
};
