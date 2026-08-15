export type Language = 'en' | 'ta' | 'hi'

export interface TranslationDict {
  tagline: string
  subTagline: string
  platformNotice: string
  navHome: string
  navOpportunities: string
  navMarketplace: string
  navBookings: string
  navSmartMatch: string
  navSkillBuilder: string
  navMentorBot: string
  navDashboard: string
  navProfile: string
  textScale: string
  highContrast: string
  standardMode: string
  signIn: string
  signOut: string
  register: string
  searchPlaceholder: string
  searchBtn: string
  filters: string
  hideFilters: string
  allCategories: string
  cookingTiffin: string
  tutoringMentoring: string
  craftsTailoring: string
  gardeningAgri: string
  homeMaintenance: string
  hourlyRate: string
  requestService: string
  verifiedSenior: string
  completedJobs: string
  matchScore: string
  expressInterest: string
  interestSent: string
  aiThinking: string
  aiUnavailable: string
  verifyNotice: string
  voiceMic: string
  voiceListening: string
  totalEarned: string
  avgRating: string
  completedServices: string
  activeOpportunities: string
  profileStrength: string
  complete: string
  acceptBooking: string
  markCompleted: string
  leaveReview: string
  statusPending: string
  statusConfirmed: string
  statusCompleted: string
  heroCtaFind: string
  heroCtaOffer: string
  howItWorks: string
  step1Title: string
  step1Desc: string
  step2Title: string
  step2Desc: string
  step3Title: string
  step3Desc: string
  step4Title: string
  step4Desc: string
  aiShowcaseTitle: string
  aiShowcaseSub: string
}

export const translations: Record<Language, TranslationDict> = {
  en: {
    tagline: "Turning Lifelong Skills Into New Opportunities.",
    subTagline: "AI livelihood platform for Indian senior citizens & homemakers",
    platformNotice: "100% Identity-Verified Senior Citizens & Homemakers • Fair ₹ INR Rates",
    navHome: "Home",
    navOpportunities: "Opportunities",
    navMarketplace: "Marketplace",
    navBookings: "Bookings",
    navSmartMatch: "Smart Match",
    navSkillBuilder: "Skill Builder",
    navMentorBot: "AI Assistant",
    navDashboard: "Dashboard",
    navProfile: "Profile",
    textScale: "Text:",
    highContrast: "High Contrast",
    standardMode: "Standard Mode",
    signIn: "Sign In",
    signOut: "Sign Out",
    register: "Create Account",
    searchPlaceholder: "Search services (e.g. tiffin, tuition, tailoring)...",
    searchBtn: "Search",
    filters: "Filters",
    hideFilters: "Hide",
    allCategories: "All Services",
    cookingTiffin: "Cooking & Tiffin",
    tutoringMentoring: "School Tuition & Mentoring",
    craftsTailoring: "Saree Tailoring & Crafts",
    gardeningAgri: "Balcony Kitchen Gardening",
    homeMaintenance: "Home Repair & Help",
    hourlyRate: "Hourly Rate",
    requestService: "Request Service",
    verifiedSenior: "Verified Senior Craftsman",
    completedJobs: "Completed Jobs",
    matchScore: "Match Score",
    expressInterest: "Express Interest",
    interestSent: "Interest Sent ✓",
    aiThinking: "SilverHands AI is thinking…",
    aiUnavailable: "AI assistance is temporarily unavailable. Please try again.",
    verifyNotice: "AI-assisted — please review before publishing",
    voiceMic: "Voice Input",
    voiceListening: "Listening... (Speak now)",
    totalEarned: "Total Earned",
    avgRating: "Avg Rating",
    completedServices: "Completed",
    activeOpportunities: "Opportunities",
    profileStrength: "Profile Strength & Trust Score",
    complete: "Complete",
    acceptBooking: "Accept",
    markCompleted: "Mark Completed",
    leaveReview: "Leave Review",
    statusPending: "Pending",
    statusConfirmed: "Confirmed",
    statusCompleted: "Completed",
    heroCtaFind: "Find Opportunities",
    heroCtaOffer: "Offer Your Skills",
    howItWorks: "How It Works",
    step1Title: "Discover Skills",
    step1Desc: "Speak or type in plain language to identify marketable skills.",
    step2Title: "Build Profile",
    step2Desc: "AI structures your bio, experience, and fair ₹ INR hourly rates.",
    step3Title: "Find Opportunity",
    step3Desc: "Smart 5-factor matching connects you to verified neighborhood clients.",
    step4Title: "Earn & Grow",
    step4Desc: "Complete bookings safely, earn 5-star reviews, and build trust.",
    aiShowcaseTitle: "Enterprise-Grade AI Architecture",
    aiShowcaseSub: "5 purpose-built AI agents delivering grounded, fair livelihood recommendations."
  },
  ta: {
    tagline: "வாழ்நாள் அனுபவங்களை புதிய வாய்ப்புகளாக மாற்றுங்கள்.",
    subTagline: "இந்திய மூத்த குடிமக்கள் மற்றும் குடும்பத் தலைவிகளுக்கான AI தளம்",
    platformNotice: "100% சரிபார்க்கப்பட்ட இந்திய கைவினைஞர்கள் மற்றும் மூத்தோர் • நியாயமான ₹ INR கட்டணம்",
    navHome: "முகப்பு",
    navOpportunities: "வாய்ப்புகள்",
    navMarketplace: "சந்தை",
    navBookings: "முன்பதிவுகள்",
    navSmartMatch: "பொருத்தம்",
    navSkillBuilder: "திறன் AI",
    navMentorBot: "AI வழிகாட்டி",
    navDashboard: "டாஷ்போர்டு",
    navProfile: "சுயவிவரம்",
    textScale: "எழுத்து:",
    highContrast: "உயர் மாறுபாடு",
    standardMode: "இயல்பு",
    signIn: "உள்நுழைக",
    signOut: "வெளியேறு",
    register: "பதிவு செய்க",
    searchPlaceholder: "சேவைகளைத் தேடுங்கள் (எ.கா. சமையல், பாடம், தையல்)...",
    searchBtn: "தேடுக",
    filters: "வடிகட்டிகள்",
    hideFilters: "மறை",
    allCategories: "அனைத்தும்",
    cookingTiffin: "சமையல் & டிபன்",
    tutoringMentoring: "பள்ளி டியூஷன் & பாடம்",
    craftsTailoring: "சேலை தையல் & கைவினை",
    gardeningAgri: "மாடித்தோட்டம்",
    homeMaintenance: "வீட்டு பராமரிப்பு",
    hourlyRate: "மணி கட்டணம்",
    requestService: "முன்பதிவு",
    verifiedSenior: "சரிபார்க்கப்பட்ட மூத்தோர்",
    completedJobs: "முடிக்கப்பட்டவை",
    matchScore: "பொருத்தம்",
    expressInterest: "விருப்பம் தெரிவி",
    interestSent: "விண்ணப்பிக்கப்பட்டது ✓",
    aiThinking: "SilverHands AI யோசிக்கிறது…",
    aiUnavailable: "AI உதவி தற்காலிகமாக கிடைக்கவில்லை. மீண்டும் முயற்சிக்கவும்.",
    verifyNotice: "AI-உதவி மூலம் உருவாக்கப்பட்டது — சரிபார்த்து பதிவிடவும்",
    voiceMic: "குரல் வழி பதிவு",
    voiceListening: "கேட்கிறது... (பேசுங்கள்)",
    totalEarned: "மொத்த வருமானம்",
    avgRating: "மதிப்பீடு",
    completedServices: "முடிக்கப்பட்டவை",
    activeOpportunities: "வாய்ப்புகள்",
    profileStrength: "சுயவிவர நம்பிக்கை வலிமை",
    complete: "நிறைவு",
    acceptBooking: "ஏற்றுக்கொள்",
    markCompleted: "முடிக்கப்பட்டது",
    leaveReview: "மதிப்பாய்வு",
    statusPending: "நிலுவையில்",
    statusConfirmed: "உறுதியானது",
    statusCompleted: "முடிக்கப்பட்டது",
    heroCtaFind: "வாய்ப்புகளைக் காண்க",
    heroCtaOffer: "திறன்களை வழங்குக",
    howItWorks: "இது எவ்வாறு செயல்படுகிறது",
    step1Title: "திறனைக் கண்டறிதல்",
    step1Desc: "குரல் அல்லது உரை மூலம் உங்கள் அனுபவத்தை எளிதாக பதிவு செய்யுங்கள்.",
    step2Title: "சுயவிவரம் உருவாக்குதல்",
    step2Desc: "AI உங்கள் விவரக்குறிப்பு மற்றும் நியாயமான ₹ INR கட்டணத்தை உருவாக்குகிறது.",
    step3Title: "வாய்ப்பைப் பெறுதல்",
    step3Desc: "5-காரணி ஸ்மார்ட் பொருத்தம் அருகிலுள்ள வாடிக்கையாளர்களுடன் இணைக்கிறது.",
    step4Title: "வருவாய் ஈட்டி வளர்க",
    step4Desc: "பணிகளை வெற்றிகரமாக முடித்து, 5-star மதிப்பாய்வுகளுடன் முன்னேறுங்கள்.",
    aiShowcaseTitle: "நவீன AI கட்டமைப்பு",
    aiShowcaseSub: "5 பிரத்யேக AI முகவர்கள் துல்லியமான மற்றும் நியாயமான வழிகாட்டலை வழங்குகின்றன."
  },
  hi: {
    tagline: "आजीवन कौशल को नए अवसरों में बदलें।",
    subTagline: "भारतीय वरिष्ठ नागरिकों और गृहणियों के लिए AI आजीविका मंच",
    platformNotice: "100% सत्यापित भारतीय शिल्पकार एवं वरिष्ठ नागरिक • पारदर्शी ₹ INR दरें",
    navHome: "होम",
    navOpportunities: "अवसर",
    navMarketplace: "बाज़ार",
    navBookings: "बुकिंग",
    navSmartMatch: "मैच",
    navSkillBuilder: "कौशल AI",
    navMentorBot: "AI मेंटर",
    navDashboard: "डैशबोर्ड",
    navProfile: "प्रोफ़ाइल",
    textScale: "अक्षर:",
    highContrast: "कंट्रास्ट",
    standardMode: "सामान्य",
    signIn: "साइन इन",
    signOut: "साइन आउट",
    register: "खाता बनाएं",
    searchPlaceholder: "सेवाएं खोजें (उदा. टिफिन, ट्यूशन, सिलाई)...",
    searchBtn: "खोजें",
    filters: "फ़िल्टर",
    hideFilters: "छिपाएँ",
    allCategories: "सभी",
    cookingTiffin: "रसोई और टिफिन",
    tutoringMentoring: "स्कूल ट्यूशन और मेंटरिंग",
    craftsTailoring: "साड़ी सिलाई और हस्तकला",
    gardeningAgri: "बालकनी गार्डनिंग",
    homeMaintenance: "गृह मरम्मत",
    hourlyRate: "प्रति घंटा दर",
    requestService: "सेवा अनुरोध",
    verifiedSenior: "सत्यापित वरिष्ठ शिल्पकार",
    completedJobs: "पूरे काम",
    matchScore: "मैच स्कोर",
    expressInterest: "रुचि व्यक्त करें",
    interestSent: "आवेदन भेजा गया ✓",
    aiThinking: "SilverHands AI सोच रहा है…",
    aiUnavailable: "AI सहायता अस्थायी रूप से अनुपलब्ध है। कृपया पुनः प्रयास करें।",
    verifyNotice: "AI-सहायता प्राप्त — कृपया प्रकाशित करने से पहले जांचें",
    voiceMic: "ध्वनि इनपुट",
    voiceListening: "सुन रहा है... (अब बोलें)",
    totalEarned: "कुल कमाई",
    avgRating: "औसत रेटिंग",
    completedServices: "पूरे किए",
    activeOpportunities: "अवसर",
    profileStrength: "प्रोफ़ाइल ताकत और विश्वास स्कोर",
    complete: "पूर्ण",
    acceptBooking: "स्वीकार करें",
    markCompleted: "काम पूरा हुआ",
    leaveReview: "समीक्षा लिखें",
    statusPending: "लंबित",
    statusConfirmed: "पुष्टि की गई",
    statusCompleted: "पूर्ण",
    heroCtaFind: "अवसर खोजें",
    heroCtaOffer: "कौशल जोड़ें",
    howItWorks: "यह कैसे काम करता है",
    step1Title: "कौशल खोजें",
    step1Desc: "आवाज या टाइप करके अपनी जीवन भर की कला को दर्ज करें।",
    step2Title: "प्रोफ़ाइल बनाएं",
    step2Desc: "AI आपकी प्रोफ़ाइल और उचित ₹ INR प्रति घंटा दर निर्धारित करता है।",
    step3Title: "अवसर प्राप्त करें",
    step3Desc: "5-कारक स्मार्ट मैचिंग आपको स्थानीय ग्राहकों से जोड़ती है।",
    step4Title: "कमाएं और बढ़ें",
    step4Desc: "सुरक्षित रूप से बुकिंग पूरी करें, 5-स्टार रेटिंग पाएं और विश्वास बनाएं।",
    aiShowcaseTitle: "उन्नत AI संरचना",
    aiShowcaseSub: "5 समर्पित AI एजेंट सटीक और उचित आजीविका सुझाव प्रदान करते हैं।"
  }
}
