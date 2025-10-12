-- Job Searcher Database Schema
-- This creates tables to store job submissions instead of JSON files

-- Submissions table: stores user job search requests
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email VARCHAR(255) NOT NULL,
    companies TEXT[] NOT NULL,
    roles TEXT[] NOT NULL,
    seniority VARCHAR(50),
    cities TEXT[],
    visa BOOLEAN DEFAULT false,
    frequency VARCHAR(50) DEFAULT 'once',
    template_path TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job results table: stores found jobs for each submission
CREATE TABLE IF NOT EXISTS job_results (
    id SERIAL PRIMARY KEY,
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    company VARCHAR(255) NOT NULL,
    careers_url TEXT,
    job_title VARCHAR(500) NOT NULL,
    job_location VARCHAR(255),
    job_description TEXT,
    job_url TEXT,
    customized_cv TEXT,
    cv_changes TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_submissions_email ON submissions(email);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_results_submission_id ON job_results(submission_id);
