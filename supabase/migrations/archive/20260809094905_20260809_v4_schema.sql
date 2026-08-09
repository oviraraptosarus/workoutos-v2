-- Add goal_id to tasks table, referencing execution_goals
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES execution_goals(id) ON DELETE SET NULL;
