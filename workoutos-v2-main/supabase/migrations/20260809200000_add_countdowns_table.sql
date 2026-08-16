CREATE TABLE IF NOT EXISTS countdowns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE countdowns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own countdowns"
    ON countdowns FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own countdowns"
    ON countdowns FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own countdowns"
    ON countdowns FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own countdowns"
    ON countdowns FOR DELETE
    USING (auth.uid() = user_id);
