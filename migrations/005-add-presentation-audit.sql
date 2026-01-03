-- Add audit columns to presentations table for proper audit trail
-- This enables soft delete and audit functionality

ALTER TABLE presentations 
ADD COLUMN deleted_at TIMESTAMP NULL,
ADD COLUMN deleted_by UUID NULL REFERENCES users(id),
ADD COLUMN created_by_audit UUID NULL REFERENCES users(id),
ADD COLUMN updated_by_audit UUID NULL REFERENCES users(id);

-- Create indexes for audit functionality
CREATE INDEX idx_presentations_deleted_at ON presentations(deleted_at);
CREATE INDEX idx_presentations_deleted_by ON presentations(deleted_by);

-- Update existing records to set audit fields
UPDATE presentations 
SET created_by_audit = created_by, 
    updated_by_audit = created_by 
WHERE created_by_audit IS NULL;

-- Add trigger to automatically update updated_by_audit (optional, can be handled in application)
-- This would require creating a trigger function, but for now we'll handle it in the application layer
