CREATE TABLE "leave_balances" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" varchar(50) NOT NULL,
	"year" integer NOT NULL,
	"total_days" integer DEFAULT 45 NOT NULL,
	"annual_days" integer DEFAULT 21 NOT NULL,
	"special_days" integer DEFAULT 24 NOT NULL,
	"used_days" integer DEFAULT 0 NOT NULL,
	"remaining_days" integer DEFAULT 45 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leave_requests" DROP CONSTRAINT "leave_requests_leave_type_id_leave_types_id_fk";
--> statement-breakpoint
ALTER TABLE "holidays" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "holidays" ADD COLUMN "year" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "employee_year_idx" ON "leave_balances" USING btree ("employee_id","year");--> statement-breakpoint
ALTER TABLE "leave_requests" DROP COLUMN "leave_type_id";--> statement-breakpoint
ALTER TABLE "public"."leave_requests" ALTER COLUMN "leave_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."leave_type";--> statement-breakpoint
CREATE TYPE "public"."leave_type" AS ENUM('annual', 'special');--> statement-breakpoint
ALTER TABLE "public"."leave_requests" ALTER COLUMN "leave_type" SET DATA TYPE "public"."leave_type" USING "leave_type"::"public"."leave_type";