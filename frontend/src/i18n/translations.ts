export type Language = 'en' | 'ta' | 'hi'

export interface TranslationDict {
  tagline: string
  subTagline: string
  platformNotice: string
  navFindWork: string
  navOfferService: string
  navOpportunities: string
  navBookings: string
  navProfile: string
  navAskAI: string
  navMarketplace: string
  navSmartMatch: string
  navSkillBuilder: string
  navMentorBot: string
  navDashboard: string
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
  mapView: string
  hideMap: string
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
  voiceUnsupported: string
  playAudio: string
  stopAudio: string
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
}

export const translations: Record<Language, TranslationDict> = {
  en: {
    tagline: "Turning Lifelong Skills Into New Opportunities.",
    subTagline: "AI livelihood platform for Indian senior citizens & homemakers",
    platformNotice: "100% Identity-Verified Senior Citizens & Homemakers • Fair ₹ INR Rates",
    navFindWork: "Find Work & Services",
    navOfferService: "Offer a Service",
    navOpportunities: "My Opportunities",
    navBookings: "My Bookings",
    navProfile: "My Profile",
    navAskAI: "Ask AI Mentor",
    navMarketplace: "Services Marketplace",
    navSmartMatch: "Smart Match & Explainer",
    navSkillBuilder: "AI Skill & Profile Builder",
    navMentorBot: "Senior Mentor & Business AI",
    navDashboard: "Dashboard & Opportunities",
    textScale: "Text:",
    highContrast: "High Contrast",
    standardMode: "Standard Mode",
    signIn: "Sign In / Register",
    signOut: "Sign Out",
    register: "Create Free Account",
    searchPlaceholder: "Search services (e.g. South Indian tiffin, math tuition, saree tailoring, Chennai, Mumbai)...",
    searchBtn: "Search Market",
    filters: "Filters",
    hideFilters: "Hide Filters",
    mapView: "Map View",
    hideMap: "Hide Map",
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
    verifyNotice: "AI-assisted — please verify before publishing",
    voiceMic: "Voice Input (Mic)",
    voiceListening: "Listening... (Speak now)",
    voiceUnsupported: "Voice input is not supported in this browser. You can type your request.",
    playAudio: "Listen Audio (TTS)",
    stopAudio: "Stop Audio",
    totalEarned: "Total Earned",
    avgRating: "Avg Rating",
    completedServices: "Completed",
    activeOpportunities: "Opportunities",
    profileStrength: "Profile Strength & Trust Score",
    complete: "Complete",
    acceptBooking: "Accept Booking",
    markCompleted: "Mark Completed",
    leaveReview: "Leave Review",
    statusPending: "Pending",
    statusConfirmed: "Confirmed",
    statusCompleted: "Completed"
  },
  ta: {
    tagline: "வாழ்நாள் அனுபவங்களை புதிய வாய்ப்புகளாக மாற்றுங்கள்.",
    subTagline: "இந்திய மூத்த குடிமக்கள் மற்றும் குடும்பத் தலைவிகளுக்கான AI தளம்",
    platformNotice: "100% சரிபார்க்கப்பட்ட இந்திய கைவினைஞர்கள் மற்றும் மூத்தோர் • நியாயமான ₹ INR கட்டணம்",
    navFindWork: "பணிகளைத் தேடுங்கள்",
    navOfferService: "சேவை வழங்குக",
    navOpportunities: "எனது வாய்ப்புகள்",
    navBookings: "எனது முன்பதிவுகள்",
    navProfile: "எனது சுயவிவரம்",
    navAskAI: "AI வழிகாட்டியிடம் கேளுங்கள்",
    navMarketplace: "சேவைகள் சந்தை",
    navSmartMatch: "ஸ்மார்ட் பொருத்தம்",
    navSkillBuilder: "AI திறன் உருவாக்குநர்",
    navMentorBot: "மூத்தோர் வழிகாட்டி உரையாடல்",
    navDashboard: "எனது டாஷ்போர்டு & வாய்ப்புகள்",
    textScale: "எழுத்து:",
    highContrast: "உயர் மாறுபாடு",
    standardMode: "இயல்பு பயன்முறை",
    signIn: "உள்நுழைக / பதிவு செய்க",
    signOut: "வெளியேறு",
    register: "இலவச கணக்கு தொடங்கு",
    searchPlaceholder: "சேவைகளைத் தேடுங்கள் (எ.கா. சமையல் டிபன், கணித பாடம், சேலை தையல், சென்னை, கோவை)...",
    searchBtn: "தேடுக",
    filters: "வடிகட்டிகள்",
    hideFilters: "மறைக்குக",
    mapView: "வரைபடப் பார்வை",
    hideMap: "வரைபடம் மறை",
    allCategories: "அனைத்து சேவைகள்",
    cookingTiffin: "சமையல் & டிபன்",
    tutoringMentoring: "பள்ளி டியூஷன் & பாடம்",
    craftsTailoring: "சேலை தையல் & கைவினை",
    gardeningAgri: "மாடித்தோட்டம் & செடி வளர்ப்பு",
    homeMaintenance: "வீட்டு பராமரிப்பு & உதவி",
    hourlyRate: "மணி நேர கட்டணம்",
    requestService: "முன்பதிவு செய்க",
    verifiedSenior: "சரிபார்க்கப்பட்ட மூத்த கைவினைஞர்",
    completedJobs: "முடிக்கப்பட்ட பணிகள்",
    matchScore: "பொருத்த மதிப்பெண்",
    expressInterest: "விருப்பம் தெரிவி",
    interestSent: "விண்ணப்பிக்கப்பட்டது ✓",
    aiThinking: "SilverHands AI யோசிக்கிறது…",
    aiUnavailable: "AI உதவி தற்காலிகமாக கிடைக்கவில்லை. மீண்டும் முயற்சிக்கவும்.",
    verifyNotice: "AI-உதவி மூலம் உருவாக்கப்பட்டது — சரிபார்த்து பதிவிடவும்",
    voiceMic: "குரல் வழி பதிவு (Mic)",
    voiceListening: "கேட்கிறது... (பேசுங்கள்)",
    voiceUnsupported: "இந்த உலாவியில் குரல் உள்ளீடு ஆதரிக்கப்படவில்லை. தட்டச்சு செய்யலாம்.",
    playAudio: "ஆடியோ கேட்க (TTS)",
    stopAudio: "ஆடியோ நிறுத்து",
    totalEarned: "மொத்த வருமானம்",
    avgRating: "சராசரி மதிப்பீடு",
    completedServices: "முடிக்கப்பட்டவை",
    activeOpportunities: "வாய்ப்புகள்",
    profileStrength: "சுயவிவர நம்பிக்கை வலிமை",
    complete: "நிறைவு",
    acceptBooking: "முன்பதிவை ஏற்றுக்கொள்",
    markCompleted: "முடிக்கப்பட்டது என குறி",
    leaveReview: "மதிப்பாய்வு எழுது",
    statusPending: "நிலுவையில்",
    statusConfirmed: "உறுதியானது",
    statusCompleted: "முடிக்கப்பட்டது"
  },
  hi: {
    tagline: "आजीवन कौशल को नए अवसरों में बदलें।",
    subTagline: "भारतीय वरिष्ठ नागरिकों और गृहणियों के लिए AI आजीविका मंच",
    platformNotice: "100% सत्यापित भारतीय शिल्पकार एवं वरिष्ठ नागरिक • पारदर्शी ₹ INR दरें",
    navFindWork: "काम और सेवाएँ खोजें",
    navOfferService: "अपनी सेवा जोड़ें",
    navOpportunities: "मेरे अवसर",
    navBookings: "मेरी बुकिंग",
    navProfile: "मेरी प्रोफाइल",
    navAskAI: "AI मेंटर से पूछें",
    navMarketplace: "सेवा बाज़ार (मार्केटप्लेस)",
    navSmartMatch: "स्मार्ट मैच और व्याख्या",
    navSkillBuilder: "AI कौशल एवं प्रोफ़ाइल निर्माता",
    navMentorBot: "वरिष्ठ मेंटर और व्यापार AI",
    navDashboard: "डैशबोर्ड और अवसर",
    textScale: "अक्षर आकार:",
    highContrast: "उच्च कंट्रास्ट",
    standardMode: "सामान्य मोड",
    signIn: "साइन इन / पंजीकरण",
    signOut: "साइन आउट",
    register: "निःशुल्क खाता बनाएं",
    searchPlaceholder: "सेवाएं खोजें (उदा. टिफिन, गणित ट्यूशन, साड़ी सिलाई, मुंबई, दिल्ली, बेंगलुरु)...",
    searchBtn: "खोजें",
    filters: "फ़िल्टर",
    hideFilters: "फ़िल्टर छिपाएँ",
    mapView: "नक्शा देखें",
    hideMap: "नक्शा छिपाएँ",
    allCategories: "सभी सेवाएँ",
    cookingTiffin: "रसोई और टिफिन",
    tutoringMentoring: "स्कूल ट्यूशन और मेंटरिंग",
    craftsTailoring: "साड़ी सिलाई और हस्तकला",
    gardeningAgri: "बालकनी और टेरेस गार्डनिंग",
    homeMaintenance: "गृह मरम्मत और सहायता",
    hourlyRate: "प्रति घंटा दर",
    requestService: "सेवा का अनुरोध करें",
    verifiedSenior: "सत्यापित वरिष्ठ शिल्पकार",
    completedJobs: "पूरे किए गए काम",
    matchScore: "मैच स्कोर",
    expressInterest: "रुचि व्यक्त करें",
    interestSent: "आवेदन भेजा गया ✓",
    aiThinking: "SilverHands AI सोच रहा है…",
    aiUnavailable: "AI सहायता अस्थायी रूप से अनुपलब्ध है। कृपया पुनः प्रयास करें।",
    verifyNotice: "AI-सहायता प्राप्त — कृपया प्रकाशित करने से पहले जांचें",
    voiceMic: "ध्वनि इनपुट (माइक)",
    voiceListening: "सुन रहा है... (अब बोलें)",
    voiceUnsupported: "इस ब्राउज़र में ध्वनि इनपुट समर्थित नहीं है। आप टाइप कर सकते हैं।",
    playAudio: "ऑडियो सुनें (TTS)",
    stopAudio: "ऑडियो रोकें",
    totalEarned: "कुल कमाई",
    avgRating: "औसत रेटिंग",
    completedServices: "पूरे किए",
    activeOpportunities: "सक्रिय अवसर",
    profileStrength: "प्रोफ़ाइल ताकत और विश्वास स्कोर",
    complete: "पूर्ण",
    acceptBooking: "बुकिंग स्वीकार करें",
    markCompleted: "काम पूरा हुआ",
    leaveReview: "समीक्षा लिखें",
    statusPending: "लंबित",
    statusConfirmed: "पुष्टि की गई",
    statusCompleted: "पूर्ण"
  }
}
