-- Add database constraints for input validation

-- Add constraints to medical_records table
ALTER TABLE medical_records
ADD CONSTRAINT medical_records_title_length CHECK (length(title) <= 200),
ADD CONSTRAINT medical_records_description_length CHECK (description IS NULL OR length(description) <= 2000),
ADD CONSTRAINT medical_records_file_size_limit CHECK (file_size IS NULL OR file_size <= 20971520);

-- Add constraints to consultation_messages table
ALTER TABLE consultation_messages
ADD CONSTRAINT consultation_messages_message_length CHECK (message IS NULL OR length(message) <= 5000);

-- Add schedule validation trigger for doctor_availability
CREATE OR REPLACE FUNCTION validate_schedule_times()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate start_time is before end_time
  IF NEW.start_time IS NOT NULL AND NEW.end_time IS NOT NULL AND NEW.start_time >= NEW.end_time THEN
    RAISE EXCEPTION 'Start time must be before end time';
  END IF;
  
  -- Validate break_start is before break_end
  IF NEW.break_start IS NOT NULL AND NEW.break_end IS NOT NULL AND NEW.break_start >= NEW.break_end THEN
    RAISE EXCEPTION 'Break start must be before break end';
  END IF;
  
  -- Validate slot duration is one of allowed values
  IF NEW.slot_duration_minutes IS NOT NULL AND NEW.slot_duration_minutes NOT IN (15, 30, 45, 60) THEN
    RAISE EXCEPTION 'Invalid slot duration. Must be 15, 30, 45, or 60 minutes';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_doctor_schedule
BEFORE INSERT OR UPDATE ON doctor_availability
FOR EACH ROW
EXECUTE FUNCTION validate_schedule_times();

-- Add constraints to doctor_reviews for rating validation
ALTER TABLE doctor_reviews
ADD CONSTRAINT doctor_reviews_rating_range CHECK (rating >= 1 AND rating <= 5);

-- Add constraints to prescriptions table
ALTER TABLE prescriptions
ADD CONSTRAINT prescriptions_medication_name_length CHECK (length(medication_name) <= 200),
ADD CONSTRAINT prescriptions_dosage_length CHECK (length(dosage) <= 100),
ADD CONSTRAINT prescriptions_frequency_length CHECK (length(frequency) <= 100),
ADD CONSTRAINT prescriptions_duration_length CHECK (duration IS NULL OR length(duration) <= 100),
ADD CONSTRAINT prescriptions_instructions_length CHECK (instructions IS NULL OR length(instructions) <= 2000);