import { TRPCClientError } from "@trpc/client";

export const prePublishTimeoutMessage =
  "انتهت مهلة فحوصات ما قبل النشر. لم يبدأ النشر. يرجى المحاولة مرة أخرى.";

export const getPrePublishErrorMessage = (error: unknown) => {
  const response =
    error instanceof TRPCClientError && error.meta?.response instanceof Response
      ? error.meta.response
      : undefined;
  if (
    response !== undefined &&
    (response.status === 504 ||
      response.headers.get("x-vercel-error") === "FUNCTION_INVOCATION_TIMEOUT")
  ) {
    return prePublishTimeoutMessage;
  }
  return error instanceof Error
    ? error.message
    : "فشل التحقق من قاعدة بيانات المحتوى";
};
