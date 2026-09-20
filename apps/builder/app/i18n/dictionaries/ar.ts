import type { Dictionary } from "./index";

/**
 * Arabic dictionary — typed as `Dictionary` (derived from en.ts).
 * Any missing or extraneous key is a TypeScript compile error.
 */
export const ar: Dictionary = {
  stylePanel: {
    layout: {
      sectionTitle: "التخطيط",
      displayLabel: "العرض (Display)",
      linkGapValues: "ربط قيم التباعد",
      unlinkGapValues: "إلغاء ربط قيم التباعد",
      align: {
        start: "البداية",
        center: "الوسط",
        end: "النهاية",
        stretch: "تمديد",
        baseline: "خط الأساس",
        spaceBetween: "مسافات بينية",
        spaceAround: "مسافات محيطة",
      },
      axis: { row: "صف", column: "عمود" },
      direction: { rowReverse: "صف عكسي", columnReverse: "عمود عكسي" },
      wrap: { nowrap: "بدون التفاف", wrap: "التفاف" },
      gridAutoFlow: { rowDense: "صف كثيف", columnDense: "عمود كثيف" },
      gridGeneratorTitle: "مولّد الشبكة",
      fillGrid: "ملء الشبكة",
      gridLayoutAria: "تخطيط الشبكة: {columns} أعمدة و {rows} صفوف",
      gridPresets: {
        fluidSidebar: "شريط جانبي مرن",
        pageStack: "تكديس الصفحة",
        holyGrail: "الكأس المقدسة",
        responsiveCards: "بطاقات متجاوبة",
        featureSection: "قسم الميزات",
        footerColumns: "أعمدة التذييل",
      },
    },
    order: {
      label: "الترتيب",
      values: {
        default: "بدون تغيير",
        first: "جعله أولًا",
        last: "جعله آخرًا",
        custom: "تخصيص الترتيب",
      },
    },
    size: {
      title: "الحجم",
      aspectRatio: "نسبة الأبعاد",
      overflow: "الفيضان",
      objectFit: "ملاءمة الكائن",
      objectPosition: "موضع الكائن",
    },
    alignSelf: {
      label: "محاذاة",
      justifyLabel: "ضبط",
      axisInline: "المحور المستعرض",
      axisBlock: "المحور الكتلي",
      values: {
        auto: "تُحدَّد محاذاة العنصر بواسطة خاصية {parentProperty} في العنصر الأب.",
        start: "تتم محاذاة العنصر عند بداية {axis}.",
        center: "يتم توسيط العنصر على طول {axis}.",
        end: "تتم محاذاة العنصر عند نهاية {axis}.",
        stretch: "يتمدد العنصر ليملأ {axis} بالكامل.",
        baseline: "تتم محاذاة العنصر إلى خط الأساس على طول {axis}.",
      },
      justifyValues: {
        auto: "يُحدَّد ضبط العنصر بواسطة خاصية justify-items في العنصر الأب.",
        start: "تتم محاذاة العنصر عند بداية المحور السطري.",
        center: "يتم توسيط العنصر على طول المحور السطري.",
        end: "تتم محاذاة العنصر عند نهاية المحور السطري.",
        stretch: "يتمدد العنصر ليملأ المحور السطري بالكامل.",
        baseline: "تتم محاذاة العنصر إلى خط الأساس في العنصر الأب.",
      },
    },
    flexChild: {
      title: "عنصر مرن",
      selectParentTooltip: "تحديد الحاوية المرنة",
      sizingLabel: "التحجيم",
      sizingDescription:
        "يحدّد قدرة العنصر المرن على النمو أو الانكماش أو ضبط حجمه الأولي داخل الحاوية المرنة.",
      groupLabel: "Flex",
      sizing: {
        none: "بدون نمو أو انكماش",
        grow: "سيتمدد العنصر لشغل المساحة المتاحة داخل الحاوية المرنة عند الحاجة، لكنه لن ينكمش إذا كانت المساحة محدودة.",
        shrink:
          "لن ينمو العنصر لشغل المساحة المتاحة داخل الحاوية المرنة، لكنه سينكمش إذا كانت المساحة محدودة",
        custom:
          "خيارات تحجيم إضافية، اضبط flex-basis و flex-grow و flex-shrink بشكل فردي",
      },
      growLabel: "النمو",
      shrinkLabel: "الانكماش",
      basisLabel: "الأساس",
    },
    gridChild: {
      title: "عنصر الشبكة",
      selectParentTooltip: "تحديد حاوية الشبكة",
      positionLabel: "الموضع",
      positionDescription: "كيفية وضع عنصر الشبكة داخل الشبكة",
      modes: { auto: "تلقائي", area: "منطقة", manual: "يدوي" },
      modeDescriptions: {
        auto: "اترك الشبكة تضع هذا العنصر تلقائيًا.",
        area: "ضع العنصر في منطقة شبكة مسماة.",
        manual: "حدّد موضع العنصر يدويًا باستخدام خطوط الشبكة.",
      },
      columnSpan: "امتداد الأعمدة",
      rowSpan: "امتداد الصفوف",
      noAreas: "لا توجد مناطق مسماة. أضف مناطق في قالب الشبكة الأب.",
      selectArea: "اختر منطقة",
    },
    backgrounds: {
      typeLabel: "النوع",
      typeGroupLabel: "نوع الخلفية",
      otherProperties: "خصائص إضافية",
      blendMode: "وضع المزج",
      repeat: "التكرار",
      attachment: "التثبيت",
      clip: "القص",
      origin: "المنشأ",
      repeatTitle: "تكرار الخلفية",
      repeatAria: {
        "no-repeat": "عدم تكرار الخلفية",
        repeat: "تكرار الخلفية",
        "repeat-y": "تكرار الخلفية عموديًا",
        "repeat-x": "تكرار الخلفية أفقيًا",
      },
      repeatValues: {
        "no-repeat":
          "تشير هذه القيمة إلى أن صورة الخلفية لن تُكرر وستظهر مرة واحدة فقط.",
        repeat:
          "تشير هذه القيمة إلى أن صورة الخلفية ستُكرر أفقيًا وعموديًا لتملأ منطقة الخلفية بالكامل.",
        "repeat-y": "تشير هذه القيمة إلى أن صورة الخلفية ستُكرر عموديًا فقط.",
        "repeat-x": "تشير هذه القيمة إلى أن صورة الخلفية ستُكرر أفقيًا فقط.",
      },
      attachmentTitle: "تثبيت الخلفية",
      attachmentValues: { scroll: "تمرير", fixed: "ثابت" },
      types: {
        image: {
          label: "صورة",
          description:
            "استخدم وسيط صورة أو رابطًا بعيدًا أو data URI كخلفية للطبقة.",
        },
        solid: {
          label: "لون ثابت",
          description:
            "استخدم طبقة بلون واحد مع الاحتفاظ بالتحكم في ترتيب التراص.",
        },
        linearGradient: {
          label: "تدرج خطي",
          description: "امزج عدة ألوان على طول خط لإنشاء انتقالات سلسة.",
        },
        radialGradient: {
          label: "تدرج شعاعي",
          description: "امزج عدة ألوان بنمط دائري لإنشاء انتقالات سلسة.",
        },
        conicGradient: {
          label: "تدرج مخروطي",
          description:
            "لفّ الألوان حول نقطة مركزية للمخططات والأقراص وتأثيرات الإضاءة الموجهة.",
        },
      },
    },
  },
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
