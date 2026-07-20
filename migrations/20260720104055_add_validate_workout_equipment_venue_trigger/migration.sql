CREATE OR REPLACE FUNCTION validate_workout_equipment_venue()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
AS
$$
DECLARE
  row_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM venue_equipments ve
    INNER JOIN workouts w
    ON ve.venue_id = w.venue_id
    WHERE w.id = NEW.workout_id AND
      ve.id = NEW.venue_equipment_id
  ) INTO row_exists;

  IF NOT row_exists THEN
    RAISE EXCEPTION
      'Workout venue different from equipment venue. workout_id: %, venue_equipment_id: %',
      NEW.workout_id,
      NEW.venue_equipment_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER validate_workout_equipment_venue_trigger
BEFORE INSERT OR UPDATE OF workout_id, venue_equipment_id
ON workout_equipments
FOR EACH ROW
EXECUTE FUNCTION validate_workout_equipment_venue();
