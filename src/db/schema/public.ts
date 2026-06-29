import * as d from "drizzle-orm/pg-core";
import { userInNeonAuth } from "./neonAuth";

const timestamps = {
  updatedAt: d.timestamp(),
  createdAt: d.timestamp().defaultNow().notNull(),
  deletedAt: d.timestamp(),
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
  nameEn: d.text().notNull(),
  nameCn: d.text().notNull(),
  ...timestamps,
});

export const canonicalEquipments = d.snakeCase.table("canonical_equipments", {
  id: d.uuid().defaultRandom().primaryKey(),
  slug: d.text().notNull().unique(),
  nameEn: d.text().notNull(),
  nameCn: d.text().notNull(),
  logType: logTypeEnum().notNull(),
  resistanceType: resistanceTypeEnum(),
  ...timestamps,
});

export const venueEquipments = d.snakeCase.table("venue_equipments", {
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
});

export const workouts = d.snakeCase.table("workouts", {
  id: d.uuid().defaultRandom().primaryKey(),
  userId: d
    .uuid()
    .notNull()
    .references(() => userInNeonAuth.id),
  venueId: d
    .uuid()
    .notNull()
    .references(() => venues.id),
  startedAt: d.timestamp().notNull(),
  endedAt: d.timestamp(),
  ...timestamps,
});

export const workoutEquipments = d.snakeCase.table("workout_equipments", {
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
});

export const workoutSets = d.snakeCase.table("workout_sets", {
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
});
