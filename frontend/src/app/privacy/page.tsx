import Link from "next/link";
import { Package, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for ShelfReady — how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-neutral-100 bg-white sticky top-0 z-50 backdrop-blur-xl bg-white/80">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[13px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-[#2563eb] flex items-center justify-center">
              <Package className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold text-[14px]">ShelfReady</span>
          </Link>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-neutral-400 text-sm mb-10">Last updated: March 29, 2026</p>

        <div className="prose-custom space-y-8 text-[15px] text-neutral-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-neutral-900 mb-3">1. Introduction</h2>
            <p>
              ShelfReady (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, and share information when you use our AI-powered e-commerce content platform at shelfready.app (&quot;Service&quot;).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 mb-3">2. Information We Collect</h2>

            <h3 className="text-lg font-semibold text-neutral-800 mt-4 mb-2">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Account Information:</strong> Name, email address, and password when you create an account.</li>
              <li><strong>Payment Information:</strong> Billing details processed securely through our third-party payment provider. We do not store your full credit card number.</li>
              <li><strong>Product Content:</strong> Product images, descriptions, and other materials you upload to generate AI content.</li>
              <li><strong>Communications:</strong> Messages you send to us via email or support channels.</li>
            </ul>

            <h3 className="text-lg font-semibold text-neutral-800 mt-4 mb-2">2.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Usage Data:</strong> Pages visited, features used, generation requests, timestamps, and interaction patterns.</li>
              <li><strong>Device Information:</strong> Browser type, operating system, device type, screen resolution, and IP address.</li>
              <li><strong>Cookies:</strong> Essential cookies for authentication and session management. See Section 8 for details.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 mb-3">3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li><strong>Provide the Service:</strong> Process your product content through AI models to generate listings, images, ad creatives, social posts, and market research.</li>
              <li><strong>Manage Your Account:</strong> Authenticate your identity, manage subscriptions, and process payments.</li>
              <li><strong>Improve the Service:</strong> Analyze usage patterns to improve features, fix bugs, and optimize performance.</li>
              <li><strong>Communicate:</strong> Send transactional emails (account verification, password resets, billing receipts) and, with your consent, product updates.</li>
              <li><strong>Ensure Security:</strong> Detect and prevent fraud, abuse, and unauthorized access.</li>
              <li><strong>Comply with Law:</strong> Meet legal obligations and respond to lawful requests.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 mb-3">4. How We Handle Your Product Content</h2>
            <p>
              When you upload product images or descriptions, they are processed by third-party AI providers to generate content. We want you to understand:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li>Your uploaded content is transmitted to AI providers solely for the purpose of generating your requested output.</li>
              <li>We do not use your product content to train our own AI models.</li>
              <li>Generated outputs are stored in your account for your access and re-download.</li>
              <li>You may delete your content and generated outputs at any time from your account settings.</li>
              <li>Third-party AI providers process data according to their own privacy policies and data processing agreements.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 mb-3">5. Data Sharing and Third Parties</h2>
            <p>We share your data only in the following circumstances:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li><strong>AI Providers:</strong> Product content is sent to AI model providers to generate outputs. These providers process data under strict data processing agreements.</li>
              <li><strong>Payment Processors:</strong> Billing information is handled by our payment provider to process subscriptions and transactions.</li>
              <li><strong>Hosting &amp; Infrastructure:</strong> Data is stored on cloud infrastructure providers with industry-standard security.</li>
              <li><strong>Analytics:</strong> We may use anonymized, aggregated data to understand usage trends. This data cannot identify individual users.</li>
              <li><strong>Legal Requirements:</strong> We may disclose data if required by law, regulation, legal process, or government request.</li>
            </ul>
            <p className="mt-3">
              We do <strong>not</strong> sell your personal data to third parties. We do <strong>not</strong> share your data with advertisers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 mb-3">6. Data Security</h2>
            <p>We implement appropriate technical and organizational measures to protect your data, including:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li>Encryption of data in transit (TLS/HTTPS) and at rest.</li>
              <li>Secure authentication with hashed passwords and optional OAuth (Google).</li>
              <li>Row-level security on our database to ensure users can only access their own data.</li>
              <li>Regular security reviews and updates.</li>
            </ul>
            <p className="mt-3">
              While we take reasonable measures to protect your data, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 mb-3">7. Data Retention</h2>
            <p>
              We retain your account data and generated content for as long as your account is active. If you delete your account:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li>Your personal information will be deleted within 30 days.</li>
              <li>Generated content and uploaded files will be permanently removed.</li>
              <li>Billing records may be retained for up to 7 years as required by tax and financial regulations.</li>
              <li>Anonymized usage data may be retained for analytics purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 mb-3">8. Cookies</h2>
            <p>We use the following types of cookies:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li><strong>Essential Cookies:</strong> Required for authentication, session management, and security. These cannot be disabled.</li>
              <li><strong>Functional Cookies:</strong> Remember your preferences (theme, language) to enhance your experience.</li>
            </ul>
            <p className="mt-3">
              We do not use advertising or tracking cookies. We do not participate in cross-site tracking.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 mb-3">9. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the following rights:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Correction:</strong> Request correction of inaccurate personal data.</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data and account.</li>
              <li><strong>Data Portability:</strong> Request your data in a structured, machine-readable format.</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent for optional data processing at any time.</li>
              <li><strong>Object:</strong> Object to processing of your personal data for specific purposes.</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at <a href="mailto:support@shelfready.app" className="text-[#2563eb] hover:underline">support@shelfready.app</a>. We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 mb-3">10. International Data Transfers</h2>
            <p>
              Your data may be processed in countries other than your country of residence, including the United States and other jurisdictions where our infrastructure and AI providers operate. We ensure appropriate safeguards are in place for international transfers in accordance with applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 mb-3">11. Children&apos;s Privacy</h2>
            <p>
              The Service is not intended for use by anyone under the age of 18. We do not knowingly collect personal data from children. If you believe we have collected data from a child, contact us and we will promptly delete it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 mb-3">12. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page and updating the &quot;Last updated&quot; date. Your continued use of the Service after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 mb-3">13. Contact Us</h2>
            <p>
              If you have questions or concerns about this Privacy Policy or our data practices, contact us at:
            </p>
            <p className="mt-2">
              <strong>Email:</strong> <a href="mailto:support@shelfready.app" className="text-[#2563eb] hover:underline">support@shelfready.app</a><br />
              <strong>Website:</strong> <a href="https://shelfready.app" className="text-[#2563eb] hover:underline">https://shelfready.app</a>
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
