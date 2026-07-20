CREATE OR REPLACE FUNCTION validate_workout_set_shape()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
AS
$$
DECLARE
  canonical_equipment_log_type log_type;
  canonical_equipment_resistance_type resistance_type;
BEGIN
  SELECT
    ce.log_type,
    ce.resistance_type
  INTO
    canonical_equipment_log_type,
    canonical_equipment_resistance_type
  FROM
    canonical_equipments ce
  INNER JOIN
    venue_equipments ve
  ON
    ce.id = ve.canonical_equipment_id
  INNER JOIN
    workout_equipments we
  ON
    ve.id = we.venue_equipment_id
  WHERE
    we.id = NEW.workout_equipment_id;

  IF canonical_equipment_log_type IS NULL THEN
    RAISE EXCEPTION
      'Failed to find canonical equipment with workout_equipment_id: %',
      NEW.workout_equipment_id;
  END IF;

  IF canonical_equipment_resistance_type IS NULL THEN
    IF NEW.resistance IS NOT NULL THEN
      RAISE EXCEPTION
        'Expect resistance to be null but resistance: %',
        NEW.resistance;
    END IF;
  ELSE
    IF NEW.resistance IS NULL THEN
      RAISE EXCEPTION 'Expect resistance to not be null but got null';
    END IF;
  END IF;

  IF canonical_equipment_log_type = 'duration' THEN
    IF (
      NEW.reps IS NOT NULL OR
      NEW.duration_seconds IS NULL OR
      NEW.distance_meters IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Invalid workout_set shape for log_type duration';
    END IF;
  END IF;

  IF canonical_equipment_log_type = 'duration_distance' THEN
    IF (
      NEW.reps IS NOT NULL OR
      NEW.duration_seconds IS NULL OR
      NEW.distance_meters IS NULL
    ) THEN
      RAISE EXCEPTION 'Invalid workout_set shape for log_type duration_distance';
    END IF;
  END IF;

  IF canonical_equipment_log_type = 'duration_reps' THEN
    IF (
      NEW.reps IS NULL OR
      NEW.duration_seconds IS NULL OR
      NEW.distance_meters IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Invalid workout_set shape for log_type duration_reps';
    END IF;
  END IF;

  IF canonical_equipment_log_type = 'reps' THEN
    IF (
      NEW.reps IS NULL OR
      NEW.duration_seconds IS NOT NULL OR
      NEW.distance_meters IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Invalid workout_set shape for log_type reps';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER validate_workout_set_shape_trigger
BEFORE INSERT OR UPDATE OF
  workout_equipment_id,
  resistance,
  reps,
  duration_seconds,
  distance_meters
ON workout_sets
FOR EACH ROW
EXECUTE FUNCTION validate_workout_set_shape();