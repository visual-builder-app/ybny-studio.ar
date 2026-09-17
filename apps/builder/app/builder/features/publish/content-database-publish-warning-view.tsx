import type { ContentDatabasePublishDiagnostics } from "~/services/content-database.server";

export const ContentDatabasePublishWarning = ({
  diagnostics,
}: {
  diagnostics: ContentDatabasePublishDiagnostics;
}) => {
  const { stats } = diagnostics;
  const totalDocumentCount =
    stats.includedDocumentCount + stats.omittedDocumentCount;
  const omittedFileLabel = stats.omittedDocumentCount === 1 ? "ملف" : "ملفات";
  const dynamicResourceNames = diagnostics.affectedResources.flatMap(
    ({ name, kind }) => (kind === "dynamic" ? [name] : [])
  );
  const staticResourceNames = diagnostics.affectedResources.flatMap(
    ({ name, kind }) => (kind === "static" ? [name] : [])
  );
  return (
    <>
      ستتضمن قاعدة بيانات المحتوى المنشورة المدمجة{" "}
      {stats.includedDocumentCount} من أصل {totalDocumentCount} ملف (
      {Math.ceil(stats.usedBytes / 1024)} من {Math.ceil(stats.maxBytes / 1024)}{" "}
      KiB). سيتم تجاهل {stats.omittedDocumentCount} {omittedFileLabel}{" "}
      {stats.omissionReason === "size"
        ? "لأن قاعدة البيانات الكاملة تتجاوز حد الحجم"
        : "لأنه تعذر تضمين المحتوى المطلوب"}
      .
      {dynamicResourceNames.length > 0 && (
        <>
          {" "}
          لا يمكن فحص موارد الوسائط ذات قيم المسارات أو المتغيرات
          بدقة وقد تُرجع نتائج غير مكتملة:{" "}
          {dynamicResourceNames.join(", ")}.
        </>
      )}
      {staticResourceNames.length > 0 && (
        <>
          {" "}
          موارد الوسائط التي قد تتأثر:{" "}
          {staticResourceNames.join(", ")}.
        </>
      )}
    </>
  );
};
