# **App Name**: ReceiptRocket

## Core Features:

- Organization Signup & Profile: Allow businesses to sign up, set up profiles, upload logos via Cloudinary, and manage company details (name, email, phone, address).
- Receipt Creation Form: Provide a form to create receipts, capture customer details (name, email, phone), item lists (name, quantity, price), and optional discounts/taxes.
- Unique Receipt Generation: Automatically generate a unique and sequential receipt number for each transaction.
- Professional Receipt Layout: Generate a professional-looking receipt layout dynamically using company branding elements (logo, colors). The AI tool should review current and prior styles, templates, email copy, and SMS wording to maintain a consistent look and tone, then suggest refinements for clarity and impact.
- Email Delivery: Send receipts as PDF attachments to customers via a scalable email service (SendGrid, Resend) with editable subjects, bodies, “From name”, and “Reply-To”.
- SMS Automation: Send automatic thank-you SMS messages using placeholders ({{customer_name}}, {{amount}}, {{receipt_number}}, {{business_name}}) via a bulk SMS API.
- Admin Dashboard: Provide a super admin dashboard to view global overviews (total organizations, receipts, emails, SMS), manage organizations, view receipts, email logs, SMS logs, and system error logs.

## Style Guidelines:

- Primary color: Deep Blue (#2962FF) to convey trust and professionalism.
- Background color: Light gray (#F5F7FA) for a clean and modern look.
- Accent color: Teal (#26A69A) for highlights and calls to action.
- Body and headline font: 'Inter' sans-serif for a modern, machined, objective, neutral look, which renders well on a variety of screens.
- Use simple, modern icons from a consistent set (e.g. Material Design Icons).
- Design a clean, responsive layout with a clear information hierarchy and intuitive navigation. Follow a desktop-first approach that degrades gracefully on smaller screens.
- Incorporate subtle animations (e.g. transitions, micro-interactions) to enhance user experience and provide visual feedback. Keep animations fast and purposeful.