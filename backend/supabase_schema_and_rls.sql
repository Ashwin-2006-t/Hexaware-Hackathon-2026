-- =========================================================================
-- SILVERHANDS — SUPABASE DATABASE SCHEMA & ROW-LEVEL SECURITY (RLS) POLICIES
-- Production database script for Supabase PostgreSQL
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    auth_user_id VARCHAR UNIQUE,
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    phone VARCHAR,
    role VARCHAR NOT NULL DEFAULT 'SENIOR', -- 'SENIOR' or 'CUSTOMER'
    location VARCHAR,
    latitude FLOAT,
    longitude FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. PROVIDER PROFILES TABLE
CREATE TABLE IF NOT EXISTS provider_profiles (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR,
    bio TEXT,
    experience_years INTEGER DEFAULT 0,
    languages VARCHAR DEFAULT 'Tamil, English',
    target_age_group VARCHAR,
    availability VARCHAR DEFAULT 'Available',
    status VARCHAR DEFAULT 'PUBLISHED', -- 'DRAFT', 'PUBLISHED', 'UNPUBLISHED'
    readiness_score INTEGER DEFAULT 80,
    rating FLOAT DEFAULT 0.0,
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_provider_profiles_user_id ON provider_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_status ON provider_profiles(status);

-- 3. SKILLS TABLE
CREATE TABLE IF NOT EXISTS skills (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    provider_id VARCHAR NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    category VARCHAR,
    proficiency VARCHAR DEFAULT 'Expert'
);

CREATE INDEX IF NOT EXISTS idx_skills_provider_id ON skills(provider_id);

-- 4. SERVICES TABLE
CREATE TABLE IF NOT EXISTS services (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    provider_id VARCHAR NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    description TEXT,
    category VARCHAR,
    price_range VARCHAR
);

CREATE INDEX IF NOT EXISTS idx_services_provider_id ON services(provider_id);

-- 5. SERVICE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS service_requests (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    customer_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id VARCHAR REFERENCES provider_profiles(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    description TEXT NOT NULL,
    message TEXT,
    category VARCHAR,
    location VARCHAR,
    latitude FLOAT,
    longitude FLOAT,
    preferred_date VARCHAR,
    status VARCHAR DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'COMPLETED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_service_requests_customer_id ON service_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_provider_id ON service_requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);

-- 6. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    request_id VARCHAR NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    customer_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id VARCHAR NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_reviews_provider_id ON reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON reviews(customer_id);

-- 7. SAVED PROVIDERS TABLE
CREATE TABLE IF NOT EXISTS saved_providers (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    customer_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id VARCHAR NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(customer_id, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_providers_customer_id ON saved_providers(customer_id);

-- =========================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES FOR SUPABASE
-- =========================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_providers ENABLE ROW LEVEL SECURITY;

-- 1. USERS POLICIES
CREATE POLICY "Users can view their own user profile"
    ON users FOR SELECT
    USING (auth.uid()::text = auth_user_id OR auth.uid()::text = id);

CREATE POLICY "Users can update their own user profile"
    ON users FOR UPDATE
    USING (auth.uid()::text = auth_user_id OR auth.uid()::text = id);

-- 2. PROVIDER PROFILES POLICIES
CREATE POLICY "Marketplace public can view published provider profiles"
    ON provider_profiles FOR SELECT
    USING (status = 'PUBLISHED' OR status IS NULL OR auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Seniors can create and update their own provider profile"
    ON provider_profiles FOR ALL
    USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id));

-- 3. SERVICE REQUESTS POLICIES
CREATE POLICY "Customers can view their own submitted requests"
    ON service_requests FOR SELECT
    USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = customer_id));

CREATE POLICY "Seniors can view requests assigned to their provider profile"
    ON service_requests FOR SELECT
    USING (
        provider_id IN (
            SELECT p.id FROM provider_profiles p JOIN users u ON p.user_id = u.id WHERE u.auth_user_id = auth.uid()::text OR u.id = auth.uid()::text
        )
    );

CREATE POLICY "Customers can create service requests"
    ON service_requests FOR INSERT
    WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = customer_id));

CREATE POLICY "Authorized status updates for requests"
    ON service_requests FOR UPDATE
    USING (
        auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = customer_id)
        OR provider_id IN (
            SELECT p.id FROM provider_profiles p JOIN users u ON p.user_id = u.id WHERE u.auth_user_id = auth.uid()::text OR u.id = auth.uid()::text
        )
    );

-- 4. SAVED PROVIDERS POLICIES
CREATE POLICY "Customers can manage their saved providers"
    ON saved_providers FOR ALL
    USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = customer_id));

-- 5. REVIEWS POLICIES
CREATE POLICY "Reviews are publicly readable"
    ON reviews FOR SELECT USING (true);

CREATE POLICY "Customers can submit reviews for completed requests"
    ON reviews FOR INSERT
    WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = customer_id));
