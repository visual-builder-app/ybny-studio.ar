export const SEAT_SUSPENDED_TOAST_ID = "seat-suspended";

export const getSeatSuspendedMessage = (workspaceName: string) =>
  `تم إيقاف وصولك للتحرير إلى "${workspaceName}" لأن خطة المالك لا تتضمن مقاعد كافية. يرجى التواصل مع مالك مساحة العمل لترقية خطته أو إضافة المزيد من المقاعد.`;
