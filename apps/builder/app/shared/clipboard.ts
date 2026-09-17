import { builderApi } from "./builder-api";

const clipboardReadErrorMessage =
  "Webstudio لا يستطيع قراءة الحافظة. اسمح بالوصول إلى الحافظة في متصفحك ثم حاول مجددًا.";

export const readClipboardText = async () => {
  try {
    return await navigator.clipboard.readText();
  } catch {
    builderApi.toast.error(clipboardReadErrorMessage);
  }
};
