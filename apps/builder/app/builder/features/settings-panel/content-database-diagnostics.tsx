import type { AssetQueryPreviewDiagnostics } from "@webstudio-is/content-engine";
import {
  PanelBanner,
  SectionTitle,
  SectionTitleButton,
  SectionTitleLabel,
  Text,
} from "@webstudio-is/design-system";
import { CopyIcon } from "@webstudio-is/icons";
import type { ReactNode } from "react";
import prettyBytes from "pretty-bytes";
import type { ResourcePerformance } from "~/shared/resource-diagnostics";
import { CodeEditor } from "~/shared/code-editor";
import { CopyToClipboard } from "~/shared/copy-to-clipboard";
import {
  CollapsibleSectionRoot,
  useOpenState,
} from "~/builder/shared/collapsible-section";
import {
  RequestDiagnosticsRow,
  RequestDiagnosticsContent,
  RequestDiagnosticDisclosure,
  RequestDiagnosticsTable,
} from "./request-inspector";
import {
  getRequestSourceDiagnosticDetails,
  getRequestSourceDiagnosticLocation,
} from "./request-error-diagnostics";

const runtimeContentNote =
  "المستندات المشار إليها التي تُجلب من التخزين في وقت التشغيل غير مشمولة.";

const assetBatchTimingNote =
  "عندما يحتوي طلب محرر واحد على عدة موارد وسائط، تغطي هذه المدة دفعتها المجمعة.";

const assetQueryPhaseRows = [
  [
    "authorization",
    "المصادقة",
    "الوقت المستغرق في مصادقة طلب المحرر الوارد والتحقق من الوصول إلى المشروع.",
  ],
  [
    "buildPlan",
    "خطة البناء",
    "الوقت المستغرق في تحميل بيانات البناء الحالية واستنتاج المحتوى المطلوب للمشروع.",
  ],
  [
    "repositoryAuthorization",
    "مصادقة المستودع",
    "الوقت المستغرق في التحقق من الوصول إلى المشروع عند حدود مستودع الوسائط.",
  ],
  [
    "indexPreparation",
    "تحضير الفهرس",
    "الوقت الشامل المستغرق في تحضير قاعدة بيانات الاستعلام في الذاكرة. يتضمن مراحل لقطة المصدر والبيانات الوصفية المرجعية ومدخلات المترجم وتجميع الناتج.",
  ],
  [
    "diagnosticsPreparation",
    "تشخيصات النشر",
    "الوقت الشامل المستغرق في تجميع قاعدة البيانات على مستوى النشر لأغراض التشخيص المفصل فقط. هذا العمل ليس جزءًا من تحميل الموارد العادي، ومراحله الداخلية مستثناة من الصفوف أدناه.",
  ],
  [
    "sourceSnapshot",
    "لقطة المصدر",
    "الوقت المستغرق في تحميل مدخلات الوسائط المرجعية وحساب مراجعة المصدر المستخدمة في ذاكرة التجميع المؤقتة.",
  ],
  [
    "canonicalMetadata",
    "البيانات الوصفية المرجعية",
    "الوقت المستغرق في مزامنة وتحميل البيانات الوصفية المهيكلة المطلوبة لخطة الاستعلام.",
  ],
  [
    "compilerEntries",
    "مدخلات المترجم",
    "الوقت المستغرق في قراءة وتحليل محتوى الوسائط المحدد إلى مدخلات المترجم.",
  ],
  [
    "compilerContentRead",
    "قراءات تخزين المترجم",
    "الوقت التراكمي المستغرق في قراءات التخزين المكتملة أثناء تحضير مدخلات المترجم. تُجمع مدد القراءة المتزامنة، لذا قد يتجاوز هذا القياس الفرعي زمن المرحلة الفعلي.",
  ],
  [
    "documentGraph",
    "مخطط المستندات",
    "الوقت المستغرق في قراءة المستندات المدعومة وتجميع مراجعها المتبادلة.",
  ],
  [
    "documentGraphContentRead",
    "قراءات تخزين مخطط المستندات",
    "الوقت التراكمي المستغرق في قراءات التخزين المكتملة أثناء بناء مخطط المستندات. تُستثنى البايتات المخزنة مؤقتًا محليًا للطلب، وتُجمع مدد القراءة المتزامنة.",
  ],
  [
    "assetReferences",
    "مراجع الوسائط",
    "الوقت المستغرق في اكتشاف مراجع الوسائط داخل محتوى المستندات المحددة.",
  ],
  [
    "sourceValidation",
    "التحقق من المصدر",
    "الوقت المستغرق في إعادة تحميل الجرد المرجعي للتأكد من أن المصدر لم يتغير أثناء التجميع.",
  ],
  [
    "artifactCompilation",
    "تجميع الناتج",
    "الوقت المستغرق في تجميع المدخلات المحضّرة إلى ناتج قاعدة بيانات المحتوى في الذاكرة.",
  ],
  [
    "runtimeAssets",
    "وسائط وقت التشغيل",
    "الوقت المستغرق في تحميل البيانات الوصفية للوسائط اللازمة لتنفيذ الاستعلام على قاعدة البيانات المحضّرة.",
  ],
  [
    "documentResolution",
    "حل المستندات",
    "الوقت المستغرق في تنفيذ الاستعلام وحل المستندات المشار إليها، بما في ذلك عمليات الجلب المطلوبة من التخزين.",
  ],
] as const;

const compilationWorkLabels = {
  hit: "أُعيد استخدامه",
  coalesced: "مُنضم",
  miss: "مُجمَّع",
  disabled: "إعادة الاستخدام معطلة",
} as const;

const DiagnosticsSection = ({
  label,
  data,
  isOpen,
  children,
}: {
  label: string;
  data: unknown;
  isOpen?: boolean;
  children: ReactNode;
}) => {
  const [open, setOpen] = useOpenState(label, isOpen);
  return (
    <CollapsibleSectionRoot
      isOpen={open}
      onOpenChange={setOpen}
      trigger={
        <SectionTitle
          suffix={
            <CopyToClipboard
              text={JSON.stringify(data, undefined, 2) ?? "null"}
              copyText={`نسخ ${label} بتنسيق JSON`}
            >
              <SectionTitleButton
                type="button"
                tabIndex={0}
                aria-label={`نسخ ${label} بتنسيق JSON`}
                prefix={<CopyIcon />}
                onPointerDown={(event) => event.stopPropagation()}
              />
            </CopyToClipboard>
          }
        >
          <SectionTitleLabel>{label}</SectionTitleLabel>
        </SectionTitle>
      }
    >
      {children}
    </CollapsibleSectionRoot>
  );
};

const ReadonlyJsonEditor = ({ value }: { value: unknown }) => (
  <CodeEditor
    lang="json"
    readOnly
    value={JSON.stringify(value, undefined, 2)}
    onChange={() => {}}
    onChangeComplete={() => {}}
  />
);

export const getContentDatabaseDiagnosticRows = (
  value: AssetQueryPreviewDiagnostics
) => [
  {
    label: "حجم الاستعلام",
    value: prettyBytes(value.query.usedBytes),
    valueColor:
      value.query.omissionReason === "size"
        ? ("destructive" as const)
        : undefined,
    description: `البصمة المؤقتة المسلسلة الخاصة بالاستعلام فقط بعد تطبيق حد قاعدة البيانات. لا تُضاف إلى حجم قاعدة البيانات المنشورة. ${runtimeContentNote}`,
  },
  {
    label: "حجم قاعدة البيانات",
    value: prettyBytes(value.database.usedBytes),
    valueColor:
      value.database.omissionReason === "size"
        ? ("destructive" as const)
        : undefined,
    description: `البصمة المدمجة المسلسلة لجميع استعلامات الوسائط القابلة للوصول المشمولة في حزمة النشر. ${runtimeContentNote}`,
  },
];

const PerformanceSizeRows = ({ value }: { value: ResourcePerformance }) => (
  <>
    {value.responseBytes !== undefined && (
      <RequestDiagnosticsRow
        label="حجم الاستجابة"
        value={prettyBytes(value.responseBytes)}
        description="الحجم المسلسل لنتيجة مورد الخادم قبل إرفاق البيانات الوصفية للأداء."
      />
    )}
    {value.assetQuery?.compilerContentBytes !== undefined && (
      <RequestDiagnosticsRow
        label="قراءة محتوى المترجم"
        value={prettyBytes(value.assetQuery.compilerContentBytes)}
        description="إجمالي البايتات المقروءة من التخزين أثناء تحضير مدخلات المترجم لدفعة الوسائط."
      />
    )}
    {value.assetQuery?.documentGraphContentBytes !== undefined && (
      <RequestDiagnosticsRow
        label="قراءة محتوى مخطط المستندات"
        value={prettyBytes(value.assetQuery.documentGraphContentBytes)}
        description="إجمالي البايتات المقروءة من التخزين أثناء بناء مخططات المستندات لدفعة الوسائط."
      />
    )}
  </>
);

const getPerformanceSizes = (value?: ResourcePerformance) => ({
  responseBytes: value?.responseBytes,
  compilerContentBytes: value?.assetQuery?.compilerContentBytes,
  documentGraphContentBytes: value?.assetQuery?.documentGraphContentBytes,
});

const hasDefinedValue = (value: Record<string, unknown>) =>
  Object.values(value).some((item) => item !== undefined);

const ResourcePerformanceSections = ({
  value,
  includeSizes = true,
  openFirst = true,
}: {
  value: ResourcePerformance;
  includeSizes?: boolean;
  openFirst?: boolean;
}) => {
  const sizes = getPerformanceSizes(value);
  const timing = {
    builderRoundTripMs: value.loaderDurationMs,
    serverDurationMs: value.serverDurationMs,
    phases: value.assetQuery?.phases,
  };
  const queryWork = {
    compilationWork: value.assetQuery?.compilationCache,
    compilerContentFetchCount: value.assetQuery?.compilerContentFetchCount,
    documentGraphContentFetchCount:
      value.assetQuery?.documentGraphContentFetchCount,
    resolvedDocumentCount: value.assetQuery?.resolvedDocumentCount,
    documentFetchCount: value.assetQuery?.documentFetchCount,
  };
  const hasSizes = includeSizes && hasDefinedValue(sizes);
  const hasTiming =
    timing.builderRoundTripMs !== undefined ||
    timing.serverDurationMs !== undefined ||
    hasDefinedValue(timing.phases ?? {});
  const hasQueryWork = hasDefinedValue(queryWork);
  return (
    <>
      {hasSizes && (
        <DiagnosticsSection label="الأحجام" data={sizes} isOpen={openFirst}>
          <RequestDiagnosticsTable>
            <PerformanceSizeRows value={value} />
          </RequestDiagnosticsTable>
        </DiagnosticsSection>
      )}
      {hasTiming && (
        <DiagnosticsSection
          label="التوقيت"
          data={timing}
          isOpen={openFirst && hasSizes === false}
        >
          <RequestDiagnosticsTable>
            {value.loaderDurationMs !== undefined && (
              <RequestDiagnosticsRow
                label="رحلة المحرر الكاملة"
                value={`${value.loaderDurationMs.toFixed(1)} ms`}
                description="مدة طلب دفعة موارد المحرر الكاملة الذي يحتوي هذا المورد."
              />
            )}
            {value.serverDurationMs !== undefined && (
              <RequestDiagnosticsRow
                label="مدة الخادم"
                value={`${value.serverDurationMs.toFixed(1)} ms`}
                description="الوقت المستغرق في معالجة هذا المورد على خادم المحرر، بما في ذلك المصادقة والتحميل وتنسيق النتيجة."
              />
            )}
            {assetQueryPhaseRows.map(([key, label, description]) => {
              const durationMs = value.assetQuery?.phases?.[key];
              if (durationMs === undefined) {
                return;
              }
              return (
                <RequestDiagnosticsRow
                  key={key}
                  label={label}
                  value={`${durationMs.toFixed(1)} ms`}
                  description={`${description} ${assetBatchTimingNote}`}
                />
              );
            })}
          </RequestDiagnosticsTable>
        </DiagnosticsSection>
      )}
      {hasQueryWork && (
        <DiagnosticsSection
          label="عمل دفعة الوسائط"
          data={queryWork}
          isOpen={openFirst && hasSizes === false && hasTiming === false}
        >
          <RequestDiagnosticsTable>
            {value.assetQuery?.compilationCache !== undefined && (
              <RequestDiagnosticsRow
                label="عمل التجميع"
                value={compilationWorkLabels[value.assetQuery.compilationCache]}
                description="ما إذا كانت دفعة الوسائط هذه قد أعادت استخدام ناتج جُمّع سابقًا في الطلب نفسه، أو انضمت إلى عمل جارٍ مطابق، أو جُمّعت عند الإخفاق، أو عملت مع تعطيل إعادة الاستخدام."
              />
            )}
            {value.assetQuery?.compilerContentFetchCount !== undefined && (
              <RequestDiagnosticsRow
                label="عمليات جلب محتوى المترجم"
                value={value.assetQuery.compilerContentFetchCount}
                description="عدد محتويات الوسائط المقروءة من التخزين أثناء تحضير مدخلات المترجم لدفعة الوسائط."
              />
            )}
            {value.assetQuery?.documentGraphContentFetchCount !== undefined && (
              <RequestDiagnosticsRow
                label="عمليات جلب محتوى مخطط المستندات"
                value={value.assetQuery.documentGraphContentFetchCount}
                description="عدد محتويات المستندات المقروءة من التخزين أثناء بناء مخططات المستندات لدفعة الوسائط."
              />
            )}
            {value.assetQuery?.resolvedDocumentCount !== undefined && (
              <RequestDiagnosticsRow
                label="المستندات المحلولة"
                value={value.assetQuery.resolvedDocumentCount}
                description="عدد مستندات نتائج الاستعلام التي مرت عبر حل مراجع المستندات عبر دفعة الوسائط."
              />
            )}
            {value.assetQuery?.documentFetchCount !== undefined && (
              <RequestDiagnosticsRow
                label="عمليات جلب المستندات"
                value={value.assetQuery.documentFetchCount}
                description="عدد المستندات المشار إليها المحمّلة أثناء حل دفعة الوسائط، بما في ذلك إعادة استخدام البايتات المحلية للطلب."
              />
            )}
          </RequestDiagnosticsTable>
        </DiagnosticsSection>
      )}
    </>
  );
};

export const ResourcePerformanceDiagnostics = ({
  value,
}: {
  value: ResourcePerformance;
}) => (
  <RequestDiagnosticsContent padded={false}>
    <ResourcePerformanceSections value={value} />
  </RequestDiagnosticsContent>
);

export const ContentDatabaseDiagnostics = ({
  value,
  performance,
}: {
  value: AssetQueryPreviewDiagnostics;
  performance?: ResourcePerformance;
}) => {
  const totalDocumentCount =
    value.database.includedDocumentCount + value.database.omittedDocumentCount;
  const candidateFilesLabel = `${totalDocumentCount} ${
    totalDocumentCount === 1 ? "ملف مرشح" : "ملفات مرشحة"
  }`;
  const omittedFilesLabel = `${value.database.omittedDocumentCount} ${
    value.database.omittedDocumentCount === 1 ? "ملف" : "ملفات"
  }`;
  const rows = getContentDatabaseDiagnosticRows(value);
  const queryIssueErrorCount =
    value.queryIssues?.filter(({ severity }) => severity === "error").length ??
    0;
  const queryIssueWarningCount =
    value.queryIssues === undefined
      ? (value.queryWarnings?.length ?? 0)
      : value.queryIssues.filter(({ severity }) => severity === "warning")
          .length;
  const errorCount =
    (value.issues?.filter(({ severity }) => severity === "error").length ?? 0) +
    queryIssueErrorCount;
  const warningCount =
    (value.issues?.filter(({ severity }) => severity === "warning").length ??
      0) + queryIssueWarningCount;
  const databaseAndSizes = {
    ...getPerformanceSizes(performance),
    scope: value.scope,
    query: value.query,
    database: value.database,
  };
  return (
    <RequestDiagnosticsContent padded={false}>
      {(value.issues !== undefined && value.issues.length > 0) ||
      (value.queryIssues !== undefined && value.queryIssues.length > 0) ||
      (value.queryWarnings !== undefined && value.queryWarnings.length > 0) ? (
        <DiagnosticsSection
          label="الأخطاء والتحذيرات"
          data={{
            queryIssues: value.queryIssues,
            queryWarnings: value.queryWarnings,
            issues: value.issues,
          }}
          isOpen
        >
          <PanelBanner variant={errorCount > 0 ? "error" : "warning"}>
            <Text>
              {errorCount} {errorCount === 1 ? "خطأ" : "أخطاء"} و{" "}
              {warningCount} {warningCount === 1 ? "تحذير" : "تحذيرات"}
              {value.issuesTruncated
                ? `؛ يتم عرض أول ${value.issues?.length ?? 0} منها.`
                : "."}
            </Text>
          </PanelBanner>
          <RequestDiagnosticsTable>
            {value.queryIssues !== undefined
              ? value.queryIssues.map((issue, index) => (
                  <RequestDiagnosticDisclosure
                    key={`${issue.path.join(".")}:${issue.code}:${index}`}
                    severity={issue.severity}
                    title={issue.message}
                    location={`الاستعلام${
                      issue.path.length === 0
                        ? ""
                        : ` · ${issue.path.join(".")}`
                    }`}
                    reason={issue.message}
                    details={[{ label: "الرمز", value: issue.code }]}
                  />
                ))
              : value.queryWarnings?.map((warning, index) => (
                  <RequestDiagnosticDisclosure
                    key={`query-warning:${index}`}
                    severity="warning"
                    title={warning}
                    location="إعداد الاستعلام"
                    reason={warning}
                    details={[{ label: "السياق", value: "الاستعلام الحالي" }]}
                  />
                ))}
            {value.issues?.map((issue, index) => (
              <RequestDiagnosticDisclosure
                key={`${issue.scope}:${issue.assetId}:${issue.code}:${index}`}
                severity={issue.severity}
                title={issue.message}
                location={getRequestSourceDiagnosticLocation(issue)}
                reason={issue.reason ?? issue.message}
                details={getRequestSourceDiagnosticDetails(issue)}
              />
            ))}
          </RequestDiagnosticsTable>
        </DiagnosticsSection>
      ) : undefined}
      <DiagnosticsSection
        label="قاعدة البيانات والأحجام"
        data={databaseAndSizes}
        isOpen
      >
        <PanelBanner variant={value.database.truncated ? "warning" : "success"}>
          <Text>
            {value.database.truncated
              ? `يتسع ${value.database.includedDocumentCount} من ${candidateFilesLabel} في قاعدة بيانات المحتوى المنشورة المدمجة. قد تُستبعد ${omittedFilesLabel} من نتائج الاستعلام المنشورة.`
              : totalDocumentCount === 1
                ? "الملف المرشح يتسع في قاعدة بيانات المحتوى المنشورة المدمجة."
                : `جميع ${candidateFilesLabel} تتسع في قاعدة بيانات المحتوى المنشورة المدمجة.`}
          </Text>
        </PanelBanner>
        <RequestDiagnosticsTable>
          {performance !== undefined && (
            <PerformanceSizeRows value={performance} />
          )}
          <RequestDiagnosticsRow
            label="النطاق"
            value="معاينة الاستعلام"
            description="تصف قياسات قاعدة البيانات هذه معاينة استعلام الوسائط الحالية وسياق قاعدة البيانات المنشورة."
          />
          <RequestDiagnosticsRow
            label="حالة قاعدة البيانات المنشورة"
            value={value.database.truncated ? "مقتطعة" : "مكتملة"}
            description="ما إذا كان كل مستند مرشح يتسع ضمن حد قاعدة بيانات المحتوى المنشورة."
          />
          {rows.map((row) => (
            <RequestDiagnosticsRow key={row.label} {...row} />
          ))}
          <RequestDiagnosticsRow
            label="حد قاعدة البيانات"
            value={prettyBytes(value.database.maxBytes)}
            description="أقصى حجم مسلسل مسموح به لقاعدة بيانات المحتوى المنشورة المدمجة."
          />
          <RequestDiagnosticsRow
            label="الملفات المنشورة المشمولة"
            value={value.database.includedDocumentCount}
            description="عدد الملفات المرشحة المشمولة في قاعدة بيانات المحتوى المنشورة ضمن حد الحجم."
          />
          <RequestDiagnosticsRow
            label="الملفات المنشورة المستبعدة"
            value={value.database.omittedDocumentCount}
            description="عدد الملفات المرشحة المستبعدة من قاعدة بيانات المحتوى المنشورة بسبب حد الحجم."
          />
        </RequestDiagnosticsTable>
      </DiagnosticsSection>
      {performance !== undefined && (
        <ResourcePerformanceSections
          value={performance}
          includeSizes={false}
          openFirst={false}
        />
      )}
      {value.artifacts !== undefined && (
        <>
          <DiagnosticsSection
            label={
              value.query.truncated
                ? "قاعدة بيانات الاستعلام المشمولة"
                : "قاعدة بيانات الاستعلام"
            }
            data={value.artifacts.query}
            isOpen={false}
          >
            <ReadonlyJsonEditor value={value.artifacts.query} />
          </DiagnosticsSection>
          <DiagnosticsSection
            label={
              value.database.truncated
                ? "قاعدة البيانات المنشورة المشمولة"
                : "قاعدة البيانات المنشورة"
            }
            data={value.artifacts.database}
            isOpen={false}
          >
            <ReadonlyJsonEditor value={value.artifacts.database} />
          </DiagnosticsSection>
        </>
      )}
      {value.unresolved !== undefined && (
        <DiagnosticsSection
          label="نتيجة استعلام غير محلولة"
          data={value.unresolved}
          isOpen={false}
        >
          <ReadonlyJsonEditor value={value.unresolved} />
        </DiagnosticsSection>
      )}
    </RequestDiagnosticsContent>
  );
};
