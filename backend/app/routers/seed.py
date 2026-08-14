from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain import User, ProviderProfile, Skill, Service, ServiceRequest

router = APIRouter(prefix="/api/seed", tags=["Seed Data"])

SEED_PROVIDERS = [
    {
        "name": "Lakshmi Ammal",
        "email": "lakshmi.ammal@example.com",
        "location": "Mylapore, Chennai, Tamil Nadu",
        "latitude": 13.0339,
        "longitude": 80.2687,
        "title": "Traditional Tamil Culinary & Sweet Specialist",
        "bio": "Specialized in preparing authentic home-style Tamil sweets, murukku, adhirasam, seedai, and traditional festival tiffin for over 20 years with pure ghee and homemade recipes.",
        "experience_years": 22,
        "availability": "Flexible (Morning & Evening)",
        "rating": 4.9,
        "total_reviews": 48,
        "skills": [
            {"name": "Traditional Tamil Sweets", "category": "Food & Catering", "proficiency": "Master"},
            {"name": "Authentic Snacks (Murukku & Seedai)", "category": "Food & Catering", "proficiency": "Master"},
            {"name": "Filter Coffee & Tiffin Catering", "category": "Food & Catering", "proficiency": "Expert"}
        ],
        "services": [
            {"name": "Homemade Murukku & Adhirasam", "description": "Crispy traditional snacks made fresh per order.", "category": "Food & Catering", "price_range": "₹300 - ₹800"},
            {"name": "Wedding & Festival Sweet Trays", "description": "Custom packaged sweet & snack boxes for functions.", "category": "Food & Catering", "price_range": "₹1,500 - ₹5,000"}
        ]
    },
    {
        "name": "Saraswathi Ramachandran",
        "email": "saraswathi.r@example.com",
        "location": "T. Nagar, Chennai, Tamil Nadu",
        "latitude": 13.0418,
        "longitude": 80.2341,
        "title": "Master Tailoring & Designer Embroidery Specialist",
        "bio": "Passionate master seamstress with 18 years experience crafting perfect-fitting saree blouses, Aari embroidery work, fall-picot finish, and ladies garment alterations.",
        "experience_years": 18,
        "availability": "Available Daily",
        "rating": 4.8,
        "total_reviews": 36,
        "skills": [
            {"name": "Custom Saree Blouse Stitching", "category": "Tailoring & Handicrafts", "proficiency": "Master"},
            {"name": "Hand Embroidery & Aari Work", "category": "Tailoring & Handicrafts", "proficiency": "Expert"},
            {"name": "Garment Alteration & Fitting", "category": "Tailoring & Handicrafts", "proficiency": "Master"}
        ],
        "services": [
            {"name": "Designer Saree Blouse Stitching", "description": "Tailored blouse stitching with lining and precise fitting.", "category": "Tailoring & Handicrafts", "price_range": "₹450 - ₹1,200"},
            {"name": "Saree Fall, Picot & Alteration", "description": "Quick turn-around fall attachment and edges finishing.", "category": "Tailoring & Handicrafts", "price_range": "₹150 - ₹300"}
        ]
    },
    {
        "name": "Prof. V. Ramanathan",
        "email": "v.ramanathan@example.com",
        "location": "Adyar, Chennai, Tamil Nadu",
        "latitude": 13.0012,
        "longitude": 80.2565,
        "title": "Senior High School Mathematics Educator",
        "bio": "Retired mathematics professor with 32 years of classroom experience. Specializing in simplifying Class 9-12 algebra, calculus, and geometry for CBSE and Tamil Nadu Board exams.",
        "experience_years": 32,
        "availability": "Evenings & Weekends",
        "rating": 5.0,
        "total_reviews": 64,
        "skills": [
            {"name": "Class 9-12 Mathematics", "category": "Education & Tutoring", "proficiency": "Master"},
            {"name": "CBSE & State Board Exam Prep", "category": "Education & Tutoring", "proficiency": "Master"},
            {"name": "Conceptual Calculus & Algebra", "category": "Education & Tutoring", "proficiency": "Expert"}
        ],
        "services": [
            {"name": "1-on-1 Math Board Exam Coaching", "description": "Personalized math coaching with problem-solving shortcuts.", "category": "Education & Tutoring", "price_range": "₹600 / hour"},
            {"name": "Small Batch Problem Solving Sessions", "description": "Interactive group practice and test paper evaluations.", "category": "Education & Tutoring", "price_range": "₹400 / hour"}
        ]
    },
    {
        "name": "Rukmini Devi Teacher",
        "email": "rukmini.teacher@example.com",
        "location": "Mandaveli, Chennai, Tamil Nadu",
        "latitude": 13.0280,
        "longitude": 80.2610,
        "title": "Classical Bharatanatyam & Carnatic Vocal Guru",
        "bio": "Accomplished classical dancer and music tutor offering patient guidance in Bharatanatyam adavus, mudras, and beginner Carnatic vocal lessons for children and adults.",
        "experience_years": 25,
        "availability": "Morning & Evening Batches",
        "rating": 4.9,
        "total_reviews": 42,
        "skills": [
            {"name": "Bharatanatyam Instruction", "category": "Arts & Culture", "proficiency": "Master"},
            {"name": "Carnatic Vocal Basics & Geethams", "category": "Arts & Culture", "proficiency": "Expert"},
            {"name": "Stage Performance Preparation", "category": "Arts & Culture", "proficiency": "Expert"}
        ],
        "services": [
            {"name": "Beginner Bharatanatyam Class", "description": "Traditional Kalakshetra style posture and rhythm training.", "category": "Arts & Culture", "price_range": "₹1,500 / month"},
            {"name": "Carnatic Vocal Fundamentals", "description": "Sarali varisai, alankarams, and devotional songs.", "category": "Arts & Culture", "price_range": "₹1,200 / month"}
        ]
    },
    {
        "name": "Sundaram Uncle",
        "email": "sundaram.gardens@example.com",
        "location": "Anna Nagar, Chennai, Tamil Nadu",
        "latitude": 13.0850,
        "longitude": 80.2101,
        "title": "Organic Terrace Gardening Specialist",
        "bio": "Avid organic gardener helping urban families set up thriving rooftop vegetable gardens, composting systems, and flowering plants suited to Chennai climate.",
        "experience_years": 16,
        "availability": "Morning Hours",
        "rating": 4.7,
        "total_reviews": 29,
        "skills": [
            {"name": "Terrace Garden Design & Setup", "category": "Gardening & Home Care", "proficiency": "Master"},
            {"name": "Organic Pest Control & Soil Prep", "category": "Gardening & Home Care", "proficiency": "Expert"},
            {"name": "Vegetable & Herbal Gardening", "category": "Gardening & Home Care", "proficiency": "Expert"}
        ],
        "services": [
            {"name": "Rooftop Organic Garden Setup", "description": "Complete setup with grow bags, pot mix, and seeds.", "category": "Gardening & Home Care", "price_range": "₹2,000 - ₹6,000"},
            {"name": "Monthly Garden Health & Maintenance", "description": "Pruning, organic fertilizing, and pest management.", "category": "Gardening & Home Care", "price_range": "₹800 / visit"}
        ]
    },
    {
        "name": "Meenakshi Devi",
        "email": "meenakshi.crafts@example.com",
        "location": "Triplicane, Chennai, Tamil Nadu",
        "latitude": 13.0588,
        "longitude": 80.2757,
        "title": "Eco Handicraft & Traditional Kolam Art Specialist",
        "bio": "Handcrafting eco-friendly jute shopping bags, return gift pouches, and creating traditional rice-flour Kolam art for grand housewarmings and cultural occasions.",
        "experience_years": 14,
        "availability": "Flexible",
        "rating": 4.6,
        "total_reviews": 21,
        "skills": [
            {"name": "Eco-friendly Jute Bag Crafting", "category": "Tailoring & Handicrafts", "proficiency": "Master"},
            {"name": "Traditional Rice Flour Kolam Art", "category": "Arts & Culture", "proficiency": "Master"},
            {"name": "Custom Function Return Gifts", "category": "Tailoring & Handicrafts", "proficiency": "Expert"}
        ],
        "services": [
            {"name": "Handcrafted Jute Gift Bags", "description": "Durable printed jute bags for weddings and functions.", "category": "Tailoring & Handicrafts", "price_range": "₹50 - ₹200 / piece"},
            {"name": "Event Traditional Kolam Design", "description": "Intricate welcome kolam drawn at house venue.", "category": "Arts & Culture", "price_range": "₹800 - ₹2,500"}
        ]
    },
    {
        "name": "Shanthi Teacher",
        "email": "shanthi.edu@example.com",
        "location": "Velachery, Chennai, Tamil Nadu",
        "latitude": 12.9815,
        "longitude": 80.2180,
        "title": "Spoken English & Tamil Literacy Mentor",
        "bio": "Patient language coach helping primary school children build confidence in spoken English, reading comprehension, and native Tamil literacy skills.",
        "experience_years": 20,
        "availability": "Afternoons & Evenings",
        "rating": 4.8,
        "total_reviews": 31,
        "skills": [
            {"name": "Spoken English Training", "category": "Education & Tutoring", "proficiency": "Master"},
            {"name": "Tamil Reading & Writing", "category": "Education & Tutoring", "proficiency": "Master"},
            {"name": "Child Reading Confidence", "category": "Education & Tutoring", "proficiency": "Expert"}
        ],
        "services": [
            {"name": "Children's Spoken English & Reading", "description": "Fun interactive storytelling and vocabulary building.", "category": "Education & Tutoring", "price_range": "₹1,000 / month"},
            {"name": "Tamil Script & Grammar Basics", "description": "Structured Tamil reading and hand-writing lessons.", "category": "Education & Tutoring", "price_range": "₹1,000 / month"}
        ]
    },
    {
        "name": "Grandma Kamala",
        "email": "grandma.kamala@example.com",
        "location": "Alwarpet, Chennai, Tamil Nadu",
        "latitude": 13.0382,
        "longitude": 80.2497,
        "title": "Nurturing After-School Childcare & Storyteller",
        "bio": "Loving grandmother providing a safe, warm after-school home environment for young children with traditional Panchatantra storytelling, healthy evening snacks, and homework supervision.",
        "experience_years": 28,
        "availability": "Monday to Friday (2 PM - 7 PM)",
        "rating": 4.9,
        "total_reviews": 55,
        "skills": [
            {"name": "After-School Child Care", "category": "Childcare & Eldercare", "proficiency": "Master"},
            {"name": "Panchatantra & Cultural Storytelling", "category": "Childcare & Eldercare", "proficiency": "Master"},
            {"name": "Nutritious Evening Snack Prep", "category": "Childcare & Eldercare", "proficiency": "Expert"}
        ],
        "services": [
            {"name": "After-School Safe Care & Supervision", "description": "Peace of mind for working parents with loving care.", "category": "Childcare & Eldercare", "price_range": "₹3,500 / month"},
            {"name": "Storytelling & Moral Values Sessions", "description": "Engaging evening stories, riddles, and craft hour.", "category": "Childcare & Eldercare", "price_range": "₹1,500 / month"}
        ]
    }
]

SEED_CUSTOMER_REQUESTS = [
    {
        "customer_name": "Ananya Krishnan",
        "customer_email": "ananya.k@example.com",
        "title": "Need authentic traditional Tamil sweets for wedding function",
        "description": "Looking for an experienced home chef to prepare traditional Tamil sweets like Murukku, Adhirasam, and Laddoo for a wedding function near Mylapore.",
        "category": "Food & Catering",
        "location": "Mylapore, Chennai, Tamil Nadu",
        "latitude": 13.0350,
        "longitude": 80.2670
    },
    {
        "customer_name": "Rajesh Kumar",
        "customer_email": "rajesh.k@example.com",
        "title": "Class 10 CBSE Math Tutor required near Adyar",
        "description": "Searching for a senior patient math teacher for my son who needs assistance preparing for Class 10 CBSE board exams in mathematics.",
        "category": "Education & Tutoring",
        "location": "Adyar, Chennai, Tamil Nadu",
        "latitude": 13.0020,
        "longitude": 80.2580
    }
]

@router.post("")
def run_seed_data(db: Session = Depends(get_db)):
    added_providers = 0
    added_requests = 0

    for prov_data in SEED_PROVIDERS:
        user = db.query(User).filter(User.email == prov_data["email"]).first()
        if not user:
            user = User(
                name=prov_data["name"],
                email=prov_data["email"],
                role="provider",
                location=prov_data["location"],
                latitude=prov_data["latitude"],
                longitude=prov_data["longitude"]
            )
            db.add(user)
            db.flush()

        profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == user.id).first()
        if not profile:
            profile = ProviderProfile(
                user_id=user.id,
                title=prov_data["title"],
                bio=prov_data["bio"],
                experience_years=prov_data["experience_years"],
                availability=prov_data["availability"],
                rating=prov_data["rating"],
                total_reviews=prov_data["total_reviews"]
            )
            db.add(profile)
            db.flush()
            added_providers += 1

            for sk in prov_data["skills"]:
                skill = Skill(
                    provider_id=profile.id,
                    name=sk["name"],
                    category=sk["category"],
                    proficiency=sk["proficiency"]
                )
                db.add(skill)

            for srv in prov_data["services"]:
                service = Service(
                    provider_id=profile.id,
                    name=srv["name"],
                    description=srv["description"],
                    category=srv["category"],
                    price_range=srv["price_range"]
                )
                db.add(service)

    for req_data in SEED_CUSTOMER_REQUESTS:
        cust = db.query(User).filter(User.email == req_data["customer_email"]).first()
        if not cust:
            cust = User(
                name=req_data["customer_name"],
                email=req_data["customer_email"],
                role="customer",
                location=req_data["location"],
                latitude=req_data["latitude"],
                longitude=req_data["longitude"]
            )
            db.add(cust)
            db.flush()

        existing_req = db.query(ServiceRequest).filter(ServiceRequest.title == req_data["title"]).first()
        if not existing_req:
            sr = ServiceRequest(
                customer_id=cust.id,
                title=req_data["title"],
                description=req_data["description"],
                category=req_data["category"],
                location=req_data["location"],
                latitude=req_data["latitude"],
                longitude=req_data["longitude"],
                status="open"
            )
            db.add(sr)
            added_requests += 1

    db.commit()

    return {
        "status": "success",
        "message": f"Seeded {added_providers} new providers and {added_requests} customer requests.",
        "total_providers": db.query(ProviderProfile).count()
    }
