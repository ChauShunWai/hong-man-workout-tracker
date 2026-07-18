CREATE TYPE "log_type" AS ENUM('duration', 'duration_distance', 'duration_reps', 'reps');--> statement-breakpoint
CREATE TYPE "resistance_type" AS ENUM('weight', 'level');--> statement-breakpoint
CREATE TABLE "canonical_equipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"slug" text NOT NULL UNIQUE,
	"name_en" text NOT NULL UNIQUE,
	"name_cn" text NOT NULL UNIQUE,
	"log_type" "log_type" NOT NULL,
	"resistance_type" "resistance_type",
	"updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "canonical_equipments_slug_not_empty" CHECK (length(trim("slug")) > 0),
	CONSTRAINT "canonical_equipments_english_name_not_empty" CHECK (length(trim("name_en")) > 0),
	CONSTRAINT "canonical_equipments_chinese_name_not_empty" CHECK (length(trim("name_cn")) > 0)
);
--> statement-breakpoint
CREATE TABLE "equipment_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"venue_equipment_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "equipment_profiles_user_equipment_name_unique" UNIQUE("user_id","venue_equipment_id","name"),
	CONSTRAINT "equipment_profiles_id_venue_equipment_unique" UNIQUE("id","venue_equipment_id"),
	CONSTRAINT "equipment_profiles_name_not_empty" CHECK (length(trim("name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "user_venue_equipment_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"venue_equipment_id" uuid NOT NULL,
	"notes" text NOT NULL,
	"updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "user_venue_equipment_notes_one_user_one_note_for_one_equipment" UNIQUE("user_id","venue_equipment_id"),
	CONSTRAINT "user_venue_equipment_notes_not_empty" CHECK (length(trim("notes")) > 0)
);
--> statement-breakpoint
CREATE TABLE "venue_equipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"venue_id" uuid NOT NULL,
	"canonical_equipment_id" uuid NOT NULL,
	"name_en" text NOT NULL,
	"name_cn" text NOT NULL,
	"updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "venue_equipments_unique_english_equipment_name" UNIQUE("venue_id","name_en"),
	CONSTRAINT "venue_equipments_unique_chinese_equipment_name" UNIQUE("venue_id","name_cn"),
	CONSTRAINT "venue_equipments_english_name_not_empty" CHECK (length(trim("name_en")) > 0),
	CONSTRAINT "venue_equipments_chinese_name_not_empty" CHECK (length(trim("name_cn")) > 0)
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name_en" text NOT NULL UNIQUE,
	"name_cn" text NOT NULL UNIQUE,
	"updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "venues_english_name_not_empty" CHECK (length(trim("name_en")) > 0),
	CONSTRAINT "venues_chinese_name_not_empty" CHECK (length(trim("name_cn")) > 0)
);
--> statement-breakpoint
CREATE TABLE "workout_equipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"workout_id" uuid NOT NULL,
	"venue_equipment_id" uuid NOT NULL,
	"equipment_profile_id" uuid,
	"equipment_order" integer NOT NULL,
	"updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "workout_equipments_unique_equipment_order_per_workout" UNIQUE("workout_id","equipment_order"),
	CONSTRAINT "workout_equipments_equipment_order_non_negative" CHECK ("equipment_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "workout_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"workout_equipment_id" uuid NOT NULL,
	"set_order" integer NOT NULL,
	"resistance_type" "resistance_type",
	"resistance" numeric(6,2),
	"log_type" "log_type" NOT NULL,
	"reps" integer,
	"duration_seconds" integer,
	"distance_meters" integer,
	"updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "workout_sets_unique_set_order_per_workout_equipment" UNIQUE("workout_equipment_id","set_order"),
	CONSTRAINT "workout_sets_set_order_non_negative" CHECK ("set_order" >= 0),
	CONSTRAINT "workout_sets_resistance_null_or_positive" CHECK ("resistance" IS NULL OR "resistance" > 0),
	CONSTRAINT "workout_sets_reps_null_or_positive" CHECK ("reps" IS NULL OR "reps" > 0),
	CONSTRAINT "workout_sets_duration_seconds_null_or_positive" CHECK ("duration_seconds" IS NULL OR "duration_seconds" > 0),
	CONSTRAINT "workout_sets_distance_meters_null_or_positive" CHECK ("distance_meters" IS NULL OR "distance_meters" > 0),
	CONSTRAINT "workout_sets_log_type_duration_shape" CHECK (
        "log_type" <> 'duration'
        OR (
          "reps" IS NULL
          AND "duration_seconds" IS NOT NULL
          AND "distance_meters" IS NULL
        )
      ),
	CONSTRAINT "workout_sets_log_type_duration_distance_shape" CHECK (
        "log_type" <> 'duration_distance'
        OR (
          "reps" IS NULL
          AND "duration_seconds" IS NOT NULL
          AND "distance_meters" IS NOT NULL
        )
      ),
	CONSTRAINT "workout_sets_log_type_duration_reps_shape" CHECK (
        "log_type" <> 'duration_reps'
        OR (
          "reps" IS NOT NULL
          AND "duration_seconds" IS NOT NULL
          AND "distance_meters" IS NULL
        )
      ),
	CONSTRAINT "workout_sets_log_type_reps_shape" CHECK (
        "log_type" <> 'reps'
        OR (
          "reps" IS NOT NULL
          AND "duration_seconds" IS NULL
          AND "distance_meters" IS NULL
        )
      ),
	CONSTRAINT "workout_sets_resistance_type_null_resistance_null" CHECK ("resistance_type" IS NOT NULL OR "resistance" IS NULL),
	CONSTRAINT "workout_sets_resistance_type_non_null_resistance_non_null" CHECK ("resistance_type" IS NULL OR "resistance" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "workouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"venue_id" uuid NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"notes" text,
	"updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "workouts_started_at_before_ended_at" CHECK ("ended_at" IS NULL OR "ended_at" >= "started_at"),
	CONSTRAINT "workouts_notes_null_or_not_empty" CHECK ("notes" IS NULL OR length(trim("notes")) > 0)
);
--> statement-breakpoint
ALTER TABLE "neon_auth"."account" RENAME CONSTRAINT "account_userId_fkey" TO "account_userId_user_id_fkey";--> statement-breakpoint
ALTER TABLE "neon_auth"."invitation" RENAME CONSTRAINT "invitation_organizationId_fkey" TO "invitation_organizationId_organization_id_fkey";--> statement-breakpoint
ALTER TABLE "neon_auth"."invitation" RENAME CONSTRAINT "invitation_inviterId_fkey" TO "invitation_inviterId_user_id_fkey";--> statement-breakpoint
ALTER TABLE "neon_auth"."member" RENAME CONSTRAINT "member_organizationId_fkey" TO "member_organizationId_organization_id_fkey";--> statement-breakpoint
ALTER TABLE "neon_auth"."member" RENAME CONSTRAINT "member_userId_fkey" TO "member_userId_user_id_fkey";--> statement-breakpoint
ALTER TABLE "neon_auth"."session" RENAME CONSTRAINT "session_userId_fkey" TO "session_userId_user_id_fkey";--> statement-breakpoint
ALTER TABLE "equipment_profiles" ADD CONSTRAINT "equipment_profiles_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "neon_auth"."user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "equipment_profiles" ADD CONSTRAINT "equipment_profiles_venue_equipment_id_venue_equipments_id_fkey" FOREIGN KEY ("venue_equipment_id") REFERENCES "venue_equipments"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "user_venue_equipment_notes" ADD CONSTRAINT "user_venue_equipment_notes_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "neon_auth"."user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_venue_equipment_notes" ADD CONSTRAINT "user_venue_equipment_notes_vKg9GQ82pQJF_fkey" FOREIGN KEY ("venue_equipment_id") REFERENCES "venue_equipments"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "venue_equipments" ADD CONSTRAINT "venue_equipments_venue_id_venues_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "venue_equipments" ADD CONSTRAINT "venue_equipments_mCFgXQnW2u62_fkey" FOREIGN KEY ("canonical_equipment_id") REFERENCES "canonical_equipments"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "workout_equipments" ADD CONSTRAINT "workout_equipments_workout_id_workouts_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "workouts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "workout_equipments" ADD CONSTRAINT "workout_equipments_venue_equipment_id_venue_equipments_id_fkey" FOREIGN KEY ("venue_equipment_id") REFERENCES "venue_equipments"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "workout_equipments" ADD CONSTRAINT "workout_equipments_profile_matches_venue_equipment_foreign_key" FOREIGN KEY ("equipment_profile_id","venue_equipment_id") REFERENCES "equipment_profiles"("id","venue_equipment_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_workout_equipment_id_workout_equipments_id_fkey" FOREIGN KEY ("workout_equipment_id") REFERENCES "workout_equipments"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "neon_auth"."user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_venue_id_venues_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE RESTRICT;