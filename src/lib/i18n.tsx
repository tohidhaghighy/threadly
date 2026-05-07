import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";

type Dict = Record<string, string>;

const fa: Dict = {
  // header / nav
  "nav.home": "خانه",
  "nav.threads": "گفتگوها",
  "nav.trending": "داغ‌ترین‌ها",
  "nav.newThread": "موضوع جدید",
  "nav.admin": "مدیریت",
  "nav.users": "کاربران",
  "nav.settings": "تنظیمات",
  "nav.categories": "دسته‌بندی‌ها",
  "nav.navigation": "پیمایش",
  "header.searchPlaceholder": "جستجو در گفتگوها، تگ‌ها و کاربران...",
  "header.toggleTheme": "تغییر تم",
  "header.guestUser": "کاربر مهمان",
  "header.member": "عضو",
  "header.profile": "پروفایل",
  "header.settings": "تنظیمات",
  "header.signOut": "خروج",
  "footer.freeAccess": "دسترسی آزاد",
  "footer.freeAccessDesc": "تمام امکانات برای همه کاربران فعال است",

  // common
  "common.all": "همه",
  "common.filter": "فیلتر",
  "common.advanced": "پیشرفته",
  "common.cancel": "انصراف",
  "common.submitForReview": "ارسال برای بررسی",
  "common.back": "بازگشت",

  // home
  "home.badge": "انجمن رسمی Threadly",
  "home.title": "هر آنچه برای ساختن کیس رویایی نیاز دارید",
  "home.subtitle": "از مونتاژ کیس تا عیب‌یابی. به جامعه‌ای از بیلدرها بپیوندید و سوال بپرسید.",
  "home.ask": "شروع گفتگو",
  "home.browse": "مرور موضوعات",
  "home.categories": "دسته‌بندی‌ها",
  "home.categoriesDesc": "موضوع مورد علاقه‌ات را انتخاب کن",
  "home.viewAll": "همه",
  "home.trending": "گفتگوهای داغ",
  "home.trendingDesc": "پربازدیدترین‌های این هفته",
  "home.threadsUnit": "گفتگو",
  "home.membersUnit": "عضو",
  "home.responseUnit": "پاسخ‌گویی",

  // threads list
  "threads.title": "همه گفتگوها",
  "threads.subtitle": "{threads} موضوع فعال در {categories} دسته",
  "threads.emptyTitle": "هنوز موضوعی نیست",
  "threads.emptyDesc": "اولین نفری باشید که گفتگو را شروع می‌کند.",
  "threads.emptyCta": "ایجاد موضوع",
  "threads.filters.newest": "جدیدترین",
  "threads.filters.mostLiked": "محبوب‌ترین",
  "threads.filters.unanswered": "بدون پاسخ",
  "threads.filters.solved": "حل‌شده",

  // new thread
  "new.title": "ایجاد موضوع جدید",
  "new.subtitle": "سؤال یا تجربه خود را با جامعه به اشتراک بگذارید",
  "new.requiresApproval": "نیازمند تأیید مدیر",
  "new.field.title": "عنوان موضوع",
  "new.field.titlePlaceholder": "مثال: کیس بعد از نصب کارت RTX 4080 روشن نمی‌شود",
  "new.field.titleHint": "عنوانی واضح انتخاب کنید (حداقل ۱۰ کاراکتر)",
  "new.metaTitle": "ایجاد موضوع — Threadly",
  "new.metaDescription":
    "ایجاد سؤال جدید در Threadly. موضوعات جدید پس از تأیید مدیر منتشر می‌شوند.",
  "new.field.category": "دسته‌بندی",
  "new.field.categoryPlaceholder": "یک دسته انتخاب کنید",
  "new.field.tags": "برچسب‌ها",
  "new.field.tagsPlaceholder": "با کاما جدا کنید: GPU, Cooling, FPS",
  "new.field.details": "محتوا",
  "new.field.detailsPlaceholder": "جزئیات کامل را بنویسید. مشخصات سیستم، ارورها، چیزی که امتحان کرده‌اید...",
  "new.preview": "پیش‌نمایش",
  "new.images": "تصاویر",
  "new.imagesCta": "برای انتخاب تصویر کلیک کنید",
  "new.imagesHint": "هر فرمت تصویری (PNG, JPG, GIF, WEBP, SVG, ...) — فقط UI",
  "new.imagesOnlyError": "فقط فایل‌های تصویری قابل انتخاب هستند.",
  "new.remove": "حذف",
  "new.submittedBadge": "در انتظار تأیید",
  "new.submittedTitle": "موضوع شما ارسال شد",
  "new.submittedDesc": "پس از بررسی توسط مدیران، منتشر خواهد شد (معمولاً کمتر از ۲۴ ساعت).",
  "new.submittedAgain": "ایجاد موضوع جدید",
  "new.toastSubmitted": "موضوع برای بررسی ارسال شد",
  "new.toastLoginRequired": "لطفاً برای ایجاد موضوع وارد شوید.",
  "new.errorTitleMin": "عنوان باید حداقل ۱۰ کاراکتر باشد.",
  "new.errorContentMin": "جزئیات باید حداقل ۱۰ کاراکتر باشد.",
  "new.errorInvalidData": "اطلاعات وارد شده معتبر نیست.",
  "new.errorSessionExpired": "جلسه شما منقضی شده است. دوباره وارد شوید.",
  "new.errorSubmitFailed": "خطا در ارسال موضوع",

  // admin
  "admin.title": "پنل مدیریت",
  "admin.subtitle": "بررسی و تأیید موضوعات ارسالی",
  "admin.pendingReview": "در انتظار بررسی",
  "admin.approved": "تأیید شده",
  "admin.rejected": "رد شده",
  "admin.search": "جستجوی موضوع...",
  "admin.table.title": "عنوان",
  "admin.table.author": "نویسنده",
  "admin.table.category": "دسته",
  "admin.table.date": "تاریخ",
  "admin.table.status": "وضعیت",
  "admin.table.actions": "عملیات",
  "admin.noResults": "موردی یافت نشد",
  "admin.toastApproved": "موضوع تأیید شد",
  "admin.toastRejected": "موضوع رد شد",
  "admin.reviewDialogTitle": "بررسی موضوع",
  "admin.reviewOperationsBtn": "عملیات",
  "admin.reviewBodyLabel": "متن کامل",
  "admin.reviewApprovePublish": "تأیید و انتشار",
  "admin.reviewRejectThread": "رد موضوع",
  "admin.reviewClose": "بستن",
  "admin.reviewViewPublic": "مشاهده در سایت",
  "admin.reviewAttachments": "پیوست‌ها",
  "admin.reviewLoadError": "بارگذاری جزئیات موضوع ناموفق بود.",
  "admin.reviewAttachmentOther": "پیوست",

  // admin — categories
  "adminCategories.title": "دسته‌بندی‌ها",
  "adminCategories.subtitle": "افزودن، تغییر نام یا غیرفعال کردن دسته‌ها",
  "adminCategories.new": "دسته جدید",
  "adminCategories.rename": "تغییر نام",
  "adminCategories.activeShort": "فعال در سایت",
  "adminCategories.threadCount": "{count} گفتگو",
  "adminCategories.badgeActive": "فعال",
  "adminCategories.badgeInactive": "غیرفعال",
  "adminCategories.empty": "هنوز دسته‌ای وجود ندارد.",
  "adminCategories.createTitle": "دسته جدید",
  "adminCategories.editTitle": "تغییر نام دسته",
  "adminCategories.fieldTitle": "عنوان",
  "adminCategories.fieldTitlePh": "مثلاً کارت گرافیک",
  "adminCategories.fieldDesc": "توضیح (اختیاری)",
  "adminCategories.fieldDescPh": "خلاصه برای کاربران",
  "adminCategories.fieldOrder": "ترتیب نمایش",
  "adminCategories.activeInForm": "فعال باشد",
  "adminCategories.activeHint": "در لیست عمومی و فرم‌ها نمایش داده شود",
  "adminCategories.createBtn": "ایجاد",
  "adminCategories.saveBtn": "ذخیره",
  "adminCategories.cancel": "انصراف",
  "adminCategories.close": "بستن",
  "adminCategories.toastCreated": "دسته ایجاد شد",
  "adminCategories.toastUpdated": "ذخیره شد",
  "adminCategories.errorCreate": "ایجاد دسته ناموفق بود",
  "adminCategories.errorUpdate": "به‌روزرسانی ناموفق بود",
  "adminCategories.errorToggle": "تغییر وضعیت ناموفق بود",
  "adminCategories.accessTitle": "دسترسی مدیر لازم است",
  "adminCategories.accessDesc": "برای مدیریت دسته‌بندی‌ها باید با حساب مدیر وارد شوید.",

  // auth
  "auth.signIn": "ورود",
  "auth.signUp": "ثبت‌نام",
  "auth.signInSubtitle": "ورود به حساب کاربری",
  "auth.signUpSubtitle": "ساخت حساب جدید",
  "auth.enterEmailPassword": "ایمیل و رمز عبور خود را وارد کنید.",
  "auth.signupHint": "برای پرسیدن سؤال و ارسال پاسخ ثبت‌نام کنید.",
  "auth.email": "ایمیل",
  "auth.password": "رمز عبور",
  "auth.confirmPassword": "تکرار رمز عبور",
  "auth.name": "نام",
  "auth.createAccount": "ساخت حساب",
  "auth.haveAccount": "حساب دارید؟ ورود",
  "auth.noAccount": "ساخت حساب جدید",
  "auth.backHome": "بازگشت به خانه",
  "auth.toastSignedIn": "با موفقیت وارد شدید.",
  "auth.toastAccountCreated": "حساب ساخته شد.",
  "auth.errorInvalidEmail": "ایمیل معتبر وارد کنید.",
  "auth.errorPasswordMin": "رمز عبور باید حداقل ۶ کاراکتر باشد.",
  "auth.errorNameMin": "نام باید حداقل ۲ کاراکتر باشد.",
  "auth.errorConfirmPasswordMin": "تکرار رمز عبور باید حداقل ۶ کاراکتر باشد.",
  "auth.errorPasswordsDontMatch": "رمزهای عبور یکسان نیستند.",
  "auth.errorInvalidCredentials": "ایمیل یا رمز عبور اشتباه است.",
  "auth.errorEmailExists": "این ایمیل قبلاً ثبت شده است.",

  // change password
  "password.title": "تغییر رمز عبور",
  "password.subtitle": "رمز فعلی را وارد کنید و رمز جدید بسازید.",
  "password.current": "رمز عبور فعلی",
  "password.new": "رمز عبور جدید",
  "password.confirm": "تکرار رمز عبور جدید",
  "password.update": "به‌روزرسانی رمز",
  "password.toastUpdated": "رمز عبور با موفقیت تغییر کرد.",
  "password.signInRequiredTitle": "نیاز به ورود",
  "password.signInRequiredDesc": "برای تغییر رمز عبور باید وارد حساب خود شوید.",
  "password.goSignIn": "ورود",
  "password.cancel": "انصراف",

  // thread detail / replies
  "thread.backToThreads": "بازگشت به گفتگوها",
  "thread.views": "بازدید",
  "thread.replies": "پاسخ",
  "thread.noRepliesTitle": "هنوز پاسخی ثبت نشده",
  "thread.noRepliesDesc": "اولین نفری باشید که پاسخ می‌دهد.",
  "thread.yourReply": "پاسخ شما",
  "thread.replyPlaceholder": "پاسخ خود را بنویسید...",
  "thread.postReply": "ارسال پاسخ",
  "thread.toastReplyPosted": "پاسخ ارسال شد",
  "thread.notFoundOrPending": "این گفتگو یافت نشد یا هنوز تأیید نشده است.",
  "thread.interactionLoginRequired": "برای لایک و واکنش باید وارد شوید.",
  "thread.addReaction": "افزودن واکنش",
  "thread.replyInteractionError": "عملیات انجام نشد. دوباره تلاش کنید.",

  // admin access
  "admin.accessRequired": "دسترسی مدیریت لازم است. با `admin@threadly.com` (رمز: `threadly`) وارد شوید.",

  // header
  "header.signIn": "ورود",
};

function format(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

/** For route `head` and other non-React contexts (current locale: fa). */
export function tStatic(key: string, vars?: Record<string, string | number>) {
  return format(fa[key] ?? key, vars);
}

type I18nValue = {
  lang: "fa";
  dir: "rtl";
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const lang = "fa" as const;
  const dir = "rtl" as const;
  const dict = fa;
  const value = useMemo<I18nValue>(
    () => ({
      lang,
      dir,
      t: (key, vars) => format(dict[key] ?? key, vars),
    }),
    [dict],
  );

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within <I18nProvider>");
  return ctx;
}

