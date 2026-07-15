import { sql } from "drizzle-orm";
import * as d from "drizzle-orm/pg-core";
import { userInNeonAuth } from "./neonAuth";

const timestamps = {
  updatedAt: d.timestamp({ withTimezone: true }),
  createdAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
  deletedAt: d.timestamp({ withTimezone: true }),
};

const logTypeEnum = d.pgEnum("log_type", [
  "duration",
  "duration_distance",
  "duration_reps",
  "reps",
]);

const resistanceTypeEnum = d.pgEnum("resistance_type", ["weight", "level"]);

export const venues = d.snakeCase.table("venues", {
  id: d.uuid().defaultRandom().primaryKey(),
  nameEn: d.text().notNull().unique(),
  nameCn: d.text().notNull().unique(),
  ...timestamps,
});

export const canonicalEquipments = d.snakeCase.table("canonical_equipments", {
  id: d.uuid().defaultRandom().primaryKey(),
  slug: d.text().notNull().unique(),
  nameEn: d.text().notNull().unique(),
  nameCn: d.text().notNull().unique(),
  logType: logTypeEnum().notNull(),
  resistanceType: resistanceTypeEnum(),
  ...timestamps,
});

export const venueEquipments = d.snakeCase.table(
  "venue_equipments",
  {
    id: d.uuid().defaultRandom().primaryKey(),
    venueId: d
      .uuid()
      .notNull()
      .references(() => venues.id, { onDelete: "restrict" }),
    canonicalEquipmentId: d
      .uuid()
      .notNull()
      .references(() => canonicalEquipments.id, { onDelete: "restrict" }),
    nameEn: d.text().notNull(),
    nameCn: d.text().notNull(),
    ...timestamps,
  },
  (table) => [
    d
      .unique("venue_equipments_unique_english_equipment_name")
      .on(table.venueId, table.nameEn),
    d
      .unique("venue_equipments_unique_chinese_equipment_name")
      .on(table.venueId, table.nameCn),
  ],
);

export const userVenueEquipmentNotes = d.snakeCase.table(
  "user_venue_equipment_notes",
  {
    id: d.uuid().defaultRandom().primaryKey(),
    userId: d
      .uuid()
      .notNull()
      .references(() => userInNeonAuth.id, { onDelete: "cascade" }),
    venueEquipmentId: d
      .uuid()
      .notNull()
      .references(() => venueEquipments.id, { onDelete: "restrict" }),
    notes: d.text().notNull(),
    ...timestamps,
  },

  (table) => [
    d
      .unique("user_venue_equipment_notes_one_user_one_note_for_one_equipment")
      .on(table.userId, table.venueEquipmentId),
    d.check(
      "user_venue_equipment_notes_not_empty",
      sql`length(trim(${table.notes})) > 0`,
    ),
  ],
);

export const workouts = d.snakeCase.table(
  "workouts",
  {
    id: d.uuid().defaultRandom().primaryKey(),
    userId: d
      .uuid()
      .notNull()
      .references(() => userInNeonAuth.id, { onDelete: "cascade" }),
    venueId: d
      .uuid()
      .notNull()
      .references(() => venues.id, { onDelete: "restrict" }),
    startedAt: d.timestamp({ withTimezone: true }).notNull(),
    endedAt: d.timestamp({ withTimezone: true }),
    notes: d.text(),
    ...timestamps,
  },
  (table) => [
    d.check(
      "workouts_started_at_before_ended_at",
      sql`${table.endedAt} IS NULL OR ${table.endedAt} >= ${table.startedAt}`,
    ),

    d.check(
      "workouts_notes_null_or_not_empty",
      sql`${table.notes} IS NULL OR length(trim(${table.notes})) > 0`,
    ),
  ],
);

export const equipmentProfiles = d.snakeCase.table(
  "equipment_profiles",
  {
    id: d.uuid().defaultRandom().primaryKey(),
    userId: d
      .uuid()
      .notNull()
      .references(() => userInNeonAuth.id, { onDelete: "cascade" }),
    venueEquipmentId: d
      .uuid()
      .notNull()
      .references(() => venueEquipments.id, { onDelete: "restrict" }),
    name: d.varchar({ length: 50 }).notNull(),
    ...timestamps,
  },
  (table) => [
    d
      .unique("equipment_profiles_user_equipment_name_unique")
      .on(table.userId, table.venueEquipmentId, table.name),
    d
      .unique("equipment_profiles_id_venue_equipment_unique")
      .on(table.id, table.venueEquipmentId),
  ],
);

export const workoutEquipments = d.snakeCase.table(
  "workout_equipments",
  {
    id: d.uuid().defaultRandom().primaryKey(),
    workoutId: d
      .uuid()
      .notNull()
      .references(() => workouts.id, { onDelete: "cascade" }),
    venueEquipmentId: d
      .uuid()
      .notNull()
      .references(() => venueEquipments.id, { onDelete: "restrict" }),
    equipmentProfileId: d.uuid(),
    equipmentOrder: d.integer().notNull(),
    ...timestamps,
  },
  (table) => [
    d
      .unique("workout_equipments_unique_equipment_order_per_workout")
      .on(table.workoutId, table.equipmentOrder),
    d.check(
      "workout_equipments_equipment_order_non_negative",
      sql`${table.equipmentOrder} >= 0`,
    ),
    d
      .foreignKey({
        columns: [table.equipmentProfileId, table.venueEquipmentId],
        foreignColumns: [
          equipmentProfiles.id,
          equipmentProfiles.venueEquipmentId,
        ],
        name: "workout_equipments_profile_matches_venue_equipment_foreign_key",
      })
      .onDelete("restrict"),
  ],
);

export const workoutSets = d.snakeCase.table(
  "workout_sets",
  {
    id: d.uuid().defaultRandom().primaryKey(),
    workoutEquipmentId: d
      .uuid()
      .notNull()
      .references(() => workoutEquipments.id, { onDelete: "cascade" }),
    setOrder: d.integer().notNull(),

    resistanceType: resistanceTypeEnum(),
    resistance: d.numeric({ precision: 6, scale: 2 }),

    logType: logTypeEnum().notNull(),
    reps: d.integer(),
    durationSeconds: d.integer(),
    distanceMeters: d.integer(),

    ...timestamps,
  },
  (table) => [
    d
      .unique("workout_sets_unique_set_order_per_workout_equipment")
      .on(table.workoutEquipmentId, table.setOrder),

    d.check("workout_sets_set_order_non_negative", sql`${table.setOrder} >= 0`),

    d.check(
      "workout_sets_resistance_null_or_positive",
      sql`${table.resistance} IS NULL OR ${table.resistance} > 0`,
    ),

    d.check(
      "workout_sets_reps_null_or_positive",
      sql`${table.reps} IS NULL OR ${table.reps} > 0`,
    ),

    d.check(
      "workout_sets_duration_seconds_null_or_positive",
      sql`${table.durationSeconds} IS NULL OR ${table.durationSeconds} > 0`,
    ),

    d.check(
      "workout_sets_distance_meters_null_or_positive",
      sql`${table.distanceMeters} IS NULL OR ${table.distanceMeters} > 0`,
    ),

    d.check(
      "workout_sets_log_type_duration_shape",
      sql`
        ${table.logType} <> 'duration'
        OR (
          ${table.reps} IS NULL
          AND ${table.durationSeconds} IS NOT NULL
          AND ${table.distanceMeters} IS NULL
        )
      `,
    ),

    d.check(
      "workout_sets_log_type_duration_distance_shape",
      sql`
        ${table.logType} <> 'duration_distance'
        OR (
          ${table.reps} IS NULL
          AND ${table.durationSeconds} IS NOT NULL
          AND ${table.distanceMeters} IS NOT NULL
        )
      `,
    ),

    d.check(
      "workout_sets_log_type_duration_reps_shape",
      sql`
        ${table.logType} <> 'duration_reps'
        OR (
          ${table.reps} IS NOT NULL
          AND ${table.durationSeconds} IS NOT NULL
          AND ${table.distanceMeters} IS NULL
        )
      `,
    ),

    d.check(
      "workout_sets_log_type_reps_shape",
      sql`
        ${table.logType} <> 'reps'
        OR (
          ${table.reps} IS NOT NULL
          AND ${table.durationSeconds} IS NULL
          AND ${table.distanceMeters} IS NULL
        )
      `,
    ),

    d.check(
      "workout_sets_resistance_type_null_resistance_null",
      sql`${table.resistanceType} IS NOT NULL OR ${table.resistance} IS NULL`,
    ),

    d.check(
      "workout_sets_resistance_type_non_null_resistance_non_null",
      sql`${table.resistanceType} IS NULL OR ${table.resistance} IS NOT NULL`,
    ),
  ],
);
