// The email to contact@ when a booking arrives, sent through the studio's own
// mailbox (Mailhostbox) over SMTP: no new service, no DNS change.

import { requestEmail } from "@/lib/domain/requests/notice";
import { getSiteUrl } from "@/lib/utils/site-url";
import { type BookingRequest } from "@/services/database/schema";

import nodemailer from "nodemailer";

const DEFAULT_TO = "contact@jnaninyoga.com";

export async function sendRequestEmail(request: BookingRequest): Promise<void> {
	const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
	if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) throw new Error("SMTP not configured");

	const port = Number(SMTP_PORT) || 465;
	const transport = nodemailer.createTransport({
		host: SMTP_HOST,
		port,
		secure: port === 465,
		auth: { user: SMTP_USER, pass: SMTP_PASS },
		connectionTimeout: 10_000,
		greetingTimeout: 10_000,
	});

	const { subject, text, html } = requestEmail(request, getSiteUrl());
	await transport.sendMail({
		from: { name: "Site jnaninyoga", address: SMTP_USER },
		to: process.env.REQUESTS_EMAIL_TO || DEFAULT_TO,
		subject,
		text,
		html,
		headers: request.ref ? { "X-Entity-Ref-ID": request.ref } : undefined,
	});
}
