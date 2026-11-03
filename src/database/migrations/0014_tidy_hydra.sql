CREATE TABLE "monthly_job_executions" (
	"id" serial PRIMARY KEY NOT NULL,
	"target_month" varchar(7) NOT NULL,
	"status" varchar(20) DEFAULT 'running' NOT NULL,
	"events_count" integer DEFAULT 0 NOT NULL,
	"players_count" integer DEFAULT 0 NOT NULL,
	"created_count" integer DEFAULT 0 NOT NULL,
	"skipped_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"executed_by" integer,
	"executed_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "monthly_job_issues" (
	"id" serial PRIMARY KEY NOT NULL,
	"execution_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"event_id" integer NOT NULL,
	"type" varchar(20) NOT NULL,
	"reason" text,
	"resolved_at" timestamp,
	"resolved_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "refresh_tokens" ALTER COLUMN "family_id" SET DEFAULT '6c064044-7a3d-426f-a528-718fe214932d';--> statement-breakpoint
ALTER TABLE "monthly_job_executions" ADD CONSTRAINT "monthly_job_executions_executed_by_users_id_fk" FOREIGN KEY ("executed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_job_issues" ADD CONSTRAINT "monthly_job_issues_execution_id_monthly_job_executions_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."monthly_job_executions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_job_issues" ADD CONSTRAINT "monthly_job_issues_player_id_users_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_job_issues" ADD CONSTRAINT "monthly_job_issues_event_id_payment_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."payment_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_job_issues" ADD CONSTRAINT "monthly_job_issues_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "monthly_job_target_unique" ON "monthly_job_executions" USING btree ("target_month");--> statement-breakpoint
CREATE INDEX "monthly_job_status_idx" ON "monthly_job_executions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "monthly_issue_exec_idx" ON "monthly_job_issues" USING btree ("execution_id");--> statement-breakpoint
CREATE INDEX "monthly_issue_type_idx" ON "monthly_job_issues" USING btree ("type");--> statement-breakpoint
CREATE INDEX "monthly_issue_player_idx" ON "monthly_job_issues" USING btree ("player_id");