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

const resistanceTypeEnum = d.pgEnum("resistanceType", ["weight", "level"]);

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
      .references(() => venues.id),
    equipmentId: d
      .uuid()
      .notNull()
      .references(() => canonicalEquipments.id),
    nameEn: d.text().notNull(),
    nameCn: d.text().notNull(),
    ...timestamps,
  },
  (table) => [
    d
      .unique("venue_equipments_unique_equipment_name")
      .on(table.venueId, table.equipmentId, table.nameEn, table.nameCn),
  ],
);

export const workouts = d.snakeCase.table(
  "workouts",
  {
    id: d.uuid().defaultRandom().primaryKey(),
    userId: d
      .uuid()
      .notNull()
      .references(() => userInNeonAuth.id),
    venueId: d
      .uuid()
      .notNull()
      .references(() => venues.id),
    startedAt: d.timestamp({ withTimezone: true }).notNull(),
    endedAt: d.timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    d.check(
      "workouts_started_at_before_ended_at",
      sql`${table.endedAt} IS NULL OR ${table.endedAt} >= ${table.startedAt}`,
    ),
  ],
);

export const workoutEquipments = d.snakeCase.table(
  "workout_equipments",
  {
    id: d.uuid().defaultRandom().primaryKey(),
    workoutId: d
      .uuid()
      .notNull()
      .references(() => workouts.id),
    venueEquipmentId: d
      .uuid()
      .notNull()
      .references(() => venueEquipments.id),
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
  ],
);

export const workoutSets = d.snakeCase.table(
  "workout_sets",
  {
    id: d.uuid().defaultRandom().primaryKey(),
    workoutEquipmentId: d
      .uuid()
      .notNull()
      .references(() => workoutEquipments.id),
    setOrder: d.integer().notNull(),

    resistance: d.numeric({ precision: 6, scale: 2 }),
    reps: d.integer(),

    durationSeconds: d.integer(),
    distanceMeters: d.integer(),
    ...timestamps,
  },
  (table) => [
    d
      .unique("workout_sets_unique_set_order_per_workout")
      .on(table.workoutEquipmentId, table.setOrder),
    d.check("workout_sets_set_order_non_negative", sql`${table.setOrder} >= 0`),
    d.check(
      "workout_sets_resistance_null_or_positive",
      sql`${table.setOrder} IS NULL OR ${table.setOrder} > 0`,
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
  ],
);
