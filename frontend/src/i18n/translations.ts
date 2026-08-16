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
  navMap: string
  notifications: string
  quietInsights: string
  myVideos: string
  uploadVideo: string
  aiDescription: string
  aiAssistedReview: string
  voiceInput: string
  listenDescription: string
  opportunityEngine: string
  expandRadius: string
  adjustPricing: string
  extendAvailability: string
  deleteVideo: string
  confirmDelete: string
  publicVisibility: string
  privateVisibility: string
  useMyLocation: string
  radiusKm: string
  silverhandsProvider: string
  silverhandsOpportunity: string
  realNearbyBusiness: string
  currentLocation: string
  markAllRead: string
  noNotifications: string
  noVideos: string
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
    aiShowcaseSub: "5 purpose-built AI agents delivering grounded, fair livelihood recommendations.",
    navMap: "Live Discovery Map",
    notifications: "Insights & Nudges",
    quietInsights: "Quiet Insight Feed",
    myVideos: "My Showcase Videos",
    uploadVideo: "Upload Video Demo",
    aiDescription: "AI Description Assist",
    aiAssistedReview: "AI-assisted — please review before publishing",
    voiceInput: "Voice Input (Speak)",
    listenDescription: "Listen (Voice TTS)",
    opportunityEngine: "Opportunity Improvement Engine",
    expandRadius: "Expand Service Radius",
    adjustPricing: "Optimize Hourly Rate",
    extendAvailability: "Extend Availability",
    deleteVideo: "Delete Video",
    confirmDelete: "Are you sure you want to permanently delete this video?",
    publicVisibility: "Public (Visible to All)",
    privateVisibility: "Private (Draft Only)",
    useMyLocation: "Use My Live Location",
    radiusKm: "Discovery Radius",
    silverhandsProvider: "SilverHands Provider",
    silverhandsOpportunity: "SilverHands Opportunity",
    realNearbyBusiness: "Real Nearby Business",
    currentLocation: "Your Live Location",
    markAllRead: "Mark All as Read",
    noNotifications: "No new notifications right now. Your quiet insights will appear here.",
    noVideos: "No videos uploaded yet. Add a short 30-second craft or cooking introduction!"
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
    aiShowcaseSub: "5 பிரத்யேக AI முகவர்கள் துல்லியமான மற்றும் நியாயமான வழிகாட்டலை வழங்குகின்றன.",
    navMap: "நேரலை வரைபடம்",
    notifications: "அறிவிப்புகள் & வழிகாட்டல்",
    quietInsights: "அமைதியான நுண்ணறிவு ஊட்டம்",
    myVideos: "எனது வீடியோக்கள்",
    uploadVideo: "வீடியோ பதிவேற்று",
    aiDescription: "AI விளக்கம் உதவி",
    aiAssistedReview: "AI-உதவி மூலம் உருவாக்கப்பட்டது — சரிபார்த்து பதிவிடவும்",
    voiceInput: "குரல் வழி உள்ளீடு",
    listenDescription: "கேட்கவும் (TTS குரல்)",
    opportunityEngine: "வாய்ப்பு மேம்பாட்டு எஞ்சின்",
    expandRadius: "சேவை எல்லையை விரிவுபடுத்து",
    adjustPricing: "கட்டணத்தை மேம்படுத்து",
    extendAvailability: "நேரத்தை நீட்டிக்கவும்",
    deleteVideo: "வீடியோவை நீக்கு",
    confirmDelete: "இந்த வீடியோவை நிரந்தரமாக நீக்க விரும்புகிறீர்களா?",
    publicVisibility: "பொது (அனைவருக்கும் தெரியும்)",
    privateVisibility: "தனிப்பட்டது (வரைவு மட்டும்)",
    useMyLocation: "எனது தற்போதைய இருப்பிடம்",
    radiusKm: "தேடல் ஆரம்",
    silverhandsProvider: "SilverHands சேவை வழங்குநர்",
    silverhandsOpportunity: "SilverHands நேரலை வாய்ப்பு",
    realNearbyBusiness: "அருகிலுள்ள உண்மையான வணிகம்",
    currentLocation: "உங்கள் இருப்பிடம்",
    markAllRead: "அனைத்தையும் படித்ததாக குறி",
    noNotifications: "தற்போது புதிய அறிவிப்புகள் இல்லை.",
    noVideos: "இன்னும் வீடியோக்கள் பதிவேற்றப்படவில்லை. உங்கள் 30-வினாடி கைவினை வீடியோவைச் சேர்க்கவும்!"
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
    statusCompleted: "पूर्ण",
    heroCtaFind: "अवसर खोजें",
    heroCtaOffer: "अपना कौशल जोड़ें",
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
    aiShowcaseSub: "5 समर्पित AI एजेंट सटीक और उचित आजीविका सुझाव प्रदान करते हैं।",
    navMap: "लाइव खोज नक्शा",
    notifications: "सूचनाएँ और मार्गदर्शन",
    quietInsights: "शांत अंतर्दृष्टि फ़ीड",
    myVideos: "मेरे वीडियो",
    uploadVideo: "वीडियो अपलोड करें",
    aiDescription: "AI विवरण सहायक",
    aiAssistedReview: "AI-सहायता प्राप्त — कृपया प्रकाशित करने से पहले जांचें",
    voiceInput: "ध्वनि इनपुट (बोलें)",
    listenDescription: "सुनें (TTS आवाज़)",
    opportunityEngine: "अवसर सुधार इंजन",
    expandRadius: "सेवा का दायरा बढ़ाएं",
    adjustPricing: "प्रति घंटा दर अनुकूलित करें",
    extendAvailability: "उपलब्धता बढ़ाएं",
    deleteVideo: "वीडियो हटाएं",
    confirmDelete: "क्या आप वाकई इस वीडियो को हटाना चाहते हैं?",
    publicVisibility: "सार्वजनिक (सभी को दिखाई देगा)",
    privateVisibility: "निजी (केवल ड्राफ्ट)",
    useMyLocation: "मेरा वर्तमान स्थान",
    radiusKm: "खोज दायरा",
    silverhandsProvider: "SilverHands सेवा प्रदाता",
    silverhandsOpportunity: "SilverHands लाइव अवसर",
    realNearbyBusiness: "आस-पास का वास्तविक व्यवसाय",
    currentLocation: "आपका स्थान",
    markAllRead: "सभी को पढ़ा हुआ चिह्नित करें",
    noNotifications: "फ़िलहाल कोई नई सूचना नहीं है।",
    noVideos: "अभी तक कोई वीडियो नहीं जोड़ा गया है। अपना 30-सेकंड का क्राफ्ट या कुकिंग वीडियो जोड़ें!"
  }
}

