CREATE TABLE IF NOT EXISTS financial_reminders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    text TEXT NOT NULL,
    date DATE,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE financial_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own financial reminders" ON financial_reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own financial reminders" ON financial_reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own financial reminders" ON financial_reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own financial reminders" ON financial_reminders FOR DELETE USING (auth.uid() = user_id);
