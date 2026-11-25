/**
 * MUNAFA — Made in Pakistan Marketplace
 * Complete English & Fluent Urdu (اردو) Translation Dictionary
 * Strictly separates English and Urdu UI copy with zero mixed language strings.
 */

export type Language = 'en' | 'ur';

export const TRANSLATIONS = {
  en: {
    // Brand & Header
    brandTitle: 'MUNAFA',
    brandSubtitle: 'MADE IN PAKISTAN',
    brandTagline: "Pakistan's Products, All in One Place.",
    langToggle: 'اردو',
    home: 'Home',
    about: 'About',
    help: 'Help',
    marketplace: 'Marketplace',
    sharedInbox: 'Shared Inbox',
    ordersInvoices: 'Orders & Invoices',
    sellerDesk: 'Seller Desk',
    adminControl: 'Admin',
    loginSignup: 'Login / Register',
    logIn: 'Login',
    register: 'Register',
    logOut: 'Log Out',
    activeUser: 'Current Active User',
    quickSwitcher: 'Switch Role',
    newRegistration: '+ New Registration',

    // Category Nav Tier
    buyersNav: 'Buyers',
    farmersNav: 'Farmers',
    factoriesNav: 'Factories',
    wholesalersNav: 'Wholesalers',
    miningNav: 'Mining',
    supportNav: 'Support',

    // Roles
    roleCustomer: 'Buyer (Shop / Household)',
    roleFarmerMining: 'Farmer / Mining Business',
    roleFactory: 'Factory / Industrial Unit',
    roleWholesaler: 'Wholesaler (Bulk Goods)',
    roleAdmin: 'Munafa Staff Admin HQ',

    // Disclaimer & Legal
    fbrRegistered: 'Wage is registered with FBR Pakistan (NTN No: 1666865-7)',
    footerWageNotice:
      'Munafa Platform fees are payable to Wage (registered with FBR Pakistan, NTN No: 1666865-7).',
    coreDisclaimerTitle: 'Munafa Core Legal Disclaimer',
    coreDisclaimerShort:
      'Munafa Platform fees are payable to Wage (registered with FBR Pakistan, NTN No: 1666865-7) and Munafa operates strictly as a connecting marketplace platform. Munafa is not responsible for any item loss, theft, missing goods, damage in transit, non-payment, or any tax not paid to the Government of Pakistan. All businesses are solely responsible for their own goods, their own delivery, their own insurance, and their own tax collection and remittance.',
    viewCoreDisclaimer: 'View Legal Disclaimer & FBR Notice',
    hideCoreDisclaimer: 'Hide Legal Disclaimer',

    // Registration & Zero-Fee Orders
    customerFeeTitle: 'Zero Order Fees (100% Free Ordering)',
    customerFeeSubtitle:
      'Orders on Munafa carry zero platform or service fees. Fees apply only once upon Seller registration via JazzCash or Bank Transfer.',
    bankTransfer: 'Bank Transfer',
    jazzCash: 'JazzCash',
    easyPaisa: 'EasyPaisa',
    cashDeposit: 'Bank Cash Deposit',
    accountTitleLabel: 'Account Title',
    bankNameLabel: 'Bank Name',
    accountNumberLabel: 'Account / IBAN Number',
    branchLabel: 'Branch',
    mobileNumberLabel: 'Mobile / Till Number',
    feeAmountLabel: 'Subscription Fee Amount',
    enterTxRef: 'Enter Transaction ID / Reference Number',
    txRefPlaceholder: 'e.g. TRX-9988102 or Bank Ref',
    uploadSlipReceipt: 'Upload Payment Receipt / Screenshot from Device',
    submitPaymentFee: 'Submit Registration Payment Reference',
    submittingFee: 'Submitting reference...',
    feeSubmittedWaiting: 'Payment Submitted! Pending Admin Check...',
    feeVerifiedSuccess: 'Account Activated by Admin!',
    oneMinuteNotice: 'Admin checks payment received via JazzCash or Bank Transfer and activates your account.',
    awaitingPaymentNotice: 'Pending Admin verification of registration subscription.',
    payFeeNow: 'View Payment Status',

    // Marketplace
    searchCommodityPlaceholder: 'Search products, factories and farms...',
    allCategories: 'All Categories',
    categoryFarmMining: 'Farmers & Mining',
    categoryFactory: 'Factories',
    categoryWholesale: 'Wholesalers',
    allCities: 'All Cities (Pakistan)',
    maxPriceFilter: 'Max Price (PKR)',
    resetFilters: 'Reset Filters',
    placeOrder: 'Order Now',
    chatWithSeller: 'Chat Seller',
    minOrderQty: 'Min Order',
    availableStock: 'Stock',
    unitPrice: 'Unit Price',
    gstTaxIncluded: 'Includes FBR GST',

    // Auth & Forms
    accessAccount: 'Access Account',
    enter8DigitAcc: 'Enter 8-digit Account Number',
    enter4DigitPin: '4-digit Secret PIN',
    forgotAccOrPin: 'Forgot Account Number / PIN?',
    createNewAccount: 'Create New Account',
    fullNameLabel: 'Full Name (Proprietor / Representative)',
    addressLabel: 'Business / Home Address (Delivery Location)',
    phoneLabel: 'WhatsApp Number (Order & Call Alerts)',
    emailLabel: 'Email Address (OTP Delivery)',
    cnicLabel: 'CNIC Number (13 Digits — Identity & Recovery)',
    ntnLabel: 'NTN Number (National Tax Number)',
    ntnRequiredNotice: 'Mandatory for Farmer/Mining, Factory, and Wholesaler accounts.',
    ntnOptionalNotice: 'Optional for buyer accounts.',
    uploadPhotoLabel: 'Capture Live Camera Photo or Upload from Device',
    photoUploadDeviceDesc: 'Capture via camera or select from your device gallery.',
    submitRequestOtp: 'Submit & Request Verification OTP',
    enterOtpHeader: 'Enter 6-Digit Email OTP',
    verifyAndGenerate: 'Verify Email & Generate Credentials',
    welcomeSuccessTitle: 'Welcome to Munafa! Credentials Generated',
    saveWarning: 'CRITICAL: Save your 8-digit Account Number and 4-digit PIN now. They have also been sent to your Inbox.',
    copyAccountNumber: 'Copy Account #',
    copyPin: 'Copy PIN',
    enterMunafaNow: 'Enter Munafa Marketplace',
    recoverByCnicTitle: 'Recover Account by CNIC',
    recoverByCnicDesc: 'Enter your 13-digit CNIC to retrieve your 8-digit Account Number and PIN.',
    retrieveCredentials: 'Retrieve Account Credentials',

    // Admin Bank Accounts Form
    adminBankFormTitle: 'Wage Official JazzCash & Bank Accounts',
    adminBankFormDesc:
      'Manage Wage official Bank Transfer and JazzCash accounts — all platform fee payments are payable to Wage bank account (Orders are 100% free).',
    saveBankDetailsBtn: 'Save JazzCash & Bank Details',
    aiAutoVerifyLabel: 'Payment & Account Verification Mode',
    verificationTimerLabel: 'Verification Delay (Seconds)',
    customerFeesLogTitle: 'Seller Registration Subscriptions & Payment Verification',
    verifyManuallyBtn: 'Activate Account',

    // Footer Links
    termsAndConditions: 'Terms & Conditions',
    privacyPolicy: 'Privacy Policy',
    contactUs: 'Contact Us',
    joinToday: 'Join MUNAFA Today',

    // General
    loading: 'Loading...',
    status: 'Status',
    actions: 'Actions',
    close: 'Close',
    save: 'Save',
    cancel: 'Cancel',
  },

  ur: {
    // Brand & Header
    brandTitle: 'منافع',
    brandSubtitle: 'میڈ اِن پاکستان',
    brandTagline: 'پاکستان کی مصنوعات، سب ایک ہی جگہ۔',
    langToggle: 'English',
    home: 'ہوم',
    about: 'تعارف',
    help: 'مدد',
    marketplace: 'مارکیٹ پلیس',
    sharedInbox: 'مشترکہ اِن باکس',
    ordersInvoices: 'آرڈرز و انوائسز',
    sellerDesk: 'سیلر ڈیسک',
    adminControl: 'ایڈمن',
    loginSignup: 'لاگ اِن / رجسٹریشن',
    logIn: 'لاگ اِن',
    register: 'رجسٹریشن',
    logOut: 'لاگ آؤٹ',
    activeUser: 'موجودہ فعال صارف',
    quickSwitcher: 'کردار تبدیل کریں',
    newRegistration: '+ نیا اکاؤنٹ بنائیں',

    // Category Nav Tier
    buyersNav: 'خریدار',
    farmersNav: 'کسان',
    factoriesNav: 'فیکٹریاں',
    wholesalersNav: 'ہول سیلرز',
    miningNav: 'کان کنی',
    supportNav: 'سپورٹ',

    // Roles
    roleCustomer: 'خریدار (دکان و گھر)',
    roleFarmerMining: 'کسان / کان کنی کا کاروبار',
    roleFactory: 'کارخانہ / فیکٹری',
    roleWholesaler: 'تھوک فروش (ہول سیلر)',
    roleAdmin: 'منافع ہیڈ کوارٹر عملہ',

    // Disclaimer & Legal
    fbrRegistered: 'ویج (Wage) ایف بی آر پاکستان کے ساتھ رجسٹرڈ ہے (NTN نمبر: 1666865-7)',
    footerWageNotice:
      'منافع پلیٹ فارم کی فیسیں Wage (رجسٹرڈ از ایف بی آر پاکستان، NTN نمبر: 1666865-7) کو قابلِ ادائیگی ہیں۔',
    coreDisclaimerTitle: 'منافع کی بنیادی قانونی وضاحت اور ڈس کلیمر',
    coreDisclaimerShort:
      'منافع پلیٹ فارم کی فیسیں Wage (رجسٹرڈ از ایف بی آر پاکستان، NTN نمبر: 1666865-7) کو قابلِ ادائیگی ہیں اور منافع ایک رابطہ و مارکیٹ پلیس پلیٹ فارم ہے۔ منافع کسی بھی مال کے نقصان، چوری، گمشدگی، راستے میں ٹوٹ پھوٹ، نادہندگی، یا حکومتِ پاکستان کو ادا نہ کیے گئے کسی بھی ٹیکس کا ذمہ دار نہیں ہے۔ تمام کاروباری حضرات اپنے سامان، ترسیل، انشورنس اور ٹیکس ادائیگی کے خود مکمل ذمہ دار ہیں۔',
    viewCoreDisclaimer: 'قانونی وضاحت اور ایف بی آر نوٹس دیکھیں',
    hideCoreDisclaimer: 'قانونی وضاحت بند کریں',

    // Registration & Zero-Fee Orders
    customerFeeTitle: 'آرڈر پر صفر فیس (100% مفت آرڈرنگ)',
    customerFeeSubtitle:
      'منافع پر آرڈر دینے کی کوئی اضافی فیس نہیں ہے۔ فیس صرف بیچنے والے کی رجسٹریشن کے وقت جاز کیش یا بینک ٹرانسفر کے ذریعے لاگو ہوتی ہے۔',
    bankTransfer: 'بینک ٹرانسفر',
    jazzCash: 'جاز کیش',
    easyPaisa: 'ایزی پیسہ',
    cashDeposit: 'بینک نقد جمع',
    accountTitleLabel: 'اکاؤنٹ ٹائٹل',
    bankNameLabel: 'بینک کا نام',
    accountNumberLabel: 'اکاؤنٹ نمبر / آئی بی اے این',
    branchLabel: 'برانچ و شہر',
    mobileNumberLabel: 'موبائل / ٹل نمبر',
    feeAmountLabel: 'سبسکرپشن فیس کی رقم',
    enterTxRef: 'ٹرانزیکشن آئی ڈی / ریفرنس نمبر درج کریں',
    txRefPlaceholder: 'مثلاً بینک ریفرنس یا ٹرانزیکشن نمبر',
    uploadSlipReceipt: 'ڈیوائس سے ادائیگی کی رسید اپ لوڈ کریں',
    submitPaymentFee: 'رجسٹریشن ادائیگی کا ریفرنس جمع کرائیں',
    submittingFee: 'جانچ جاری ہے...',
    feeSubmittedWaiting: 'ادائیگی موصول! ایڈمن کی تصدیق جاری ہے...',
    feeVerifiedSuccess: 'اکاؤنٹ ایڈمن کی جانب سے فعال کر دیا گیا!',
    oneMinuteNotice: 'ایڈمن جاز کیش یا بینک ٹرانسفر چیک کر کے بٹن سے اکاؤنٹ فعال کرے گا۔',
    awaitingPaymentNotice: 'ایڈمن کی ادائیگی تصدیق کا منتظر ہے۔',
    payFeeNow: 'ادائیگی کی صورتحال دیکھیں',

    // Marketplace
    searchCommodityPlaceholder: 'پاکستانی مصنوعات، کارخانے اور فارمز تلاش کریں...',
    allCategories: 'تمام اقسام',
    categoryFarmMining: 'کسان و کان کنی',
    categoryFactory: 'فیکٹریاں',
    categoryWholesale: 'ہول سیلرز',
    allCities: 'پاکستان کے تمام شہر',
    maxPriceFilter: 'زیادہ سے زیادہ قیمت (روپے)',
    resetFilters: 'فلٹرز ختم کریں',
    placeOrder: 'آرڈر کریں',
    chatWithSeller: 'سیلر سے چیٹ',
    minOrderQty: 'کم از کم آرڈر',
    availableStock: 'موجود سٹاک',
    unitPrice: 'فی یونٹ قیمت',
    gstTaxIncluded: 'ایف بی آر جی ایس ٹی شامل',

    // Auth & Forms
    accessAccount: 'اکاؤنٹ میں داخل ہوں',
    enter8DigitAcc: '8 ہندسوں کا اکاؤنٹ نمبر درج کریں',
    enter4DigitPin: '4 ہندسوں کا خفیہ پن',
    forgotAccOrPin: 'اکاؤنٹ نمبر یا پن بھول گئے؟',
    createNewAccount: 'نیا اکاؤنٹ بنائیں',
    fullNameLabel: 'مکمل نام (مالک یا مجاز نمائندہ)',
    addressLabel: 'کاروباری یا گھر کا مکمل پتہ (ترسیل کا مقام)',
    phoneLabel: 'واٹس ایپ نمبر (آرڈر اور کال اطلاعات)',
    emailLabel: 'ای میل ایڈریس (او ٹی پی تصدیق)',
    cnicLabel: 'شناختی کارڈ نمبر (13 ہندسے — شناخت و بازیابی)',
    ntnLabel: 'این ٹی این نمبر (نیشنل ٹیکس نمبر)',
    ntnRequiredNotice: 'کسان/کان کنی، فیکٹری اور ہول سیلر کے لیے لازمی ہے۔',
    ntnOptionalNotice: 'عام خریدار کے لیے اختیاری ہے۔',
    uploadPhotoLabel: 'کیمرے سے فوری تصویر لیں یا گیلری سے منتخب کریں',
    photoUploadDeviceDesc: 'موبائل یا لیپ ٹاپ کیمرے سے تصویر کھینچیں یا فائل منتخب کریں۔',
    submitRequestOtp: 'معلومات جمع کرائیں اور تصدیقی کوڈ حاصل کریں',
    enterOtpHeader: 'ای میل پر موصول شدہ 6 ہندسوں کا کوڈ درج کریں',
    verifyAndGenerate: 'ای میل تصدیق کریں اور اکاؤنٹ بنائیں',
    welcomeSuccessTitle: 'منافع میں خوش آمدید! آپ کا اکاؤنٹ بن چکا ہے',
    saveWarning: 'انتہائی ضروری: اپنا 8 ہندسی اکاؤنٹ نمبر اور 4 ہندسی پن محفوظ کر لیں۔ یہی آپ کے اِن باکس میں بھی بھیجے گئے ہیں۔',
    copyAccountNumber: 'اکاؤنٹ نمبر کاپی کریں',
    copyPin: 'پن کاپی کریں',
    enterMunafaNow: 'منافع مارکیٹ پلیس میں داخل ہوں',
    recoverByCnicTitle: 'شناختی کارڈ سے اکاؤنٹ بازیاب کریں',
    recoverByCnicDesc: 'اپنا 13 ہندسی شناختی کارڈ نمبر درج کر کے اکاؤنٹ نمبر اور پن معلوم کریں۔',
    retrieveCredentials: 'اکاؤنٹ کی تفصیلات حاصل کریں',

    // Admin Bank Accounts Form
    adminBankFormTitle: 'منافع آفیشل بینک اکاؤنٹس اور فیس مینجمنٹ',
    adminBankFormDesc:
      'منافع کے سرکاری بینک اکاؤنٹس، جاز کیش، ایزی پیسہ اور تصدیقی ٹائمر کا نظم سنبھالیں۔',
    saveBankDetailsBtn: 'بینک اور فیس کی ترتیبات محفوظ کریں',
    aiAutoVerifyLabel: '1 منٹ کی خودکار تصدیق فعال کریں',
    verificationTimerLabel: 'تصدیقی وقفہ (سیکنڈز)',
    customerFeesLogTitle: 'گاہکوں کی آرڈر فیس کا ریکارڈ (100 روپے فی آرڈر)',
    verifyManuallyBtn: 'دستی تصدیق کریں اور آرڈر روانہ کریں',

    // Footer Links
    termsAndConditions: 'شرائط و ضوابط',
    privacyPolicy: 'پرائیویسی پالیسی',
    contactUs: 'رابطہ کریں',
    joinToday: 'آج ہی منافع میں شامل ہوں',

    // General
    loading: 'لوڈ ہو رہا ہے...',
    status: 'حالت',
    actions: 'اقدامات',
    close: 'بند کریں',
    save: 'محفوظ کریں',
    cancel: 'منسوخ کریں',
  },
};
