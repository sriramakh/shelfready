import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service",
  description: "Terms of Service for ShelfReady — AI-powered e-commerce content platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface">
      <nav className="border-b border-border bg-white sticky top-0 z-50 backdrop-blur-xl bg-surface/80">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[13px] font-medium text-text-muted hover:text-secondary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.png" alt="ShelfReady" className="h-6 w-6 rounded-md" />
            <span className="font-semibold text-[14px]">ShelfReady</span>
          </Link>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-16">
        <p
          className="text-[11px] uppercase tracking-[0.22em] text-text-muted mb-4"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Legal
        </p>
        <h1
          className="text-[clamp(36px,5vw,56px)] leading-[1] tracking-[-0.02em] text-secondary mb-3"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          Terms of Service
        </h1>
        <p
          className="text-text-muted/80 text-[12px] uppercase tracking-[0.16em] mb-10"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Last updated · March 29, 2026
        </p>

        <div className="prose-custom space-y-8 text-[15px] text-text-muted leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-secondary mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using ShelfReady (&quot;Service&quot;), operated by ShelfReady (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not access or use the Service.
            </p>
            <p className="mt-3">
              We reserve the right to update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-secondary mb-3">2. Description of Service</h2>
            <p>
              ShelfReady is an AI-powered content platform for e-commerce sellers. The Service generates product listings, AI product photography, ad creatives, social media content, and competitive market intelligence for platforms including Amazon, Etsy, and Shopify.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-secondary mb-3">3. Account Registration</h2>
            <p>To use the Service, you must create an account and provide accurate, complete information. You are responsible for:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li>Maintaining the confidentiality of your account credentials.</li>
              <li>All activities that occur under your account.</li>
              <li>Notifying us immediately of any unauthorized use of your account.</li>
            </ul>
            <p className="mt-3">
              You must be at least 18 years of age to create an account. We reserve the right to suspend or terminate accounts that violate these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-secondary mb-3">4. Subscription Plans and Billing</h2>
            <p>ShelfReady offers the following subscription tiers:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li><strong>Free:</strong> 5 listings/month, 5 AI images (lifetime), 5 social posts/month, 5 ad copies/month.</li>
              <li><strong>Starter ($29/month):</strong> 50 listings, 100 images, 10 photoshoots, 50 social, 50 ads, 20 research reports/month.</li>
              <li><strong>Pro ($79/month):</strong> 300 listings, 300 images, 30 photoshoots, 300 social, 300 ads, 100 research/month, CSV/JSON export.</li>
              <li><strong>Business ($149/month):</strong> Unlimited listings/social/ads/research, 1,000 images, 100 photoshoots, API access, dedicated support.</li>
            </ul>
            <p className="mt-3">
              Annual billing is available at a discounted rate. All prices are in USD. We reserve the right to modify pricing with 30 days&apos; notice to existing subscribers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-secondary mb-3">5. Payment and Refunds</h2>
            <p>
              Payments are processed through our third-party payment provider. By subscribing to a paid plan, you authorize recurring charges at the applicable billing interval.
            </p>
            <p className="mt-3">
              You may cancel your subscription at any time. Upon cancellation, you will retain access to your paid plan until the end of the current billing period. We do not offer prorated refunds for partial billing periods.
            </p>
            <p className="mt-3">
              If you believe a charge was made in error, contact us at <a href="mailto:support@shelfready.app" className="text-[#2563eb] hover:underline">support@shelfready.app</a> within 14 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-secondary mb-3">6. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li>Use the Service for any unlawful purpose or to violate any applicable laws.</li>
              <li>Generate content that is defamatory, obscene, fraudulent, or infringes on third-party rights.</li>
              <li>Attempt to reverse-engineer, decompile, or extract source code from the Service.</li>
              <li>Circumvent usage limits, rate limits, or access controls.</li>
              <li>Resell, sublicense, or redistribute the Service without our written consent.</li>
              <li>Use automated tools to scrape, crawl, or overload the Service beyond normal usage.</li>
              <li>Upload malicious files, viruses, or harmful code.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-secondary mb-3">7. AI-Generated Content</h2>
            <p>
              Content generated by the Service (&quot;AI Output&quot;) is produced using artificial intelligence models. You acknowledge that:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li>AI Output may not be unique and similar output may be generated for other users.</li>
              <li>You are solely responsible for reviewing, editing, and verifying AI Output before use.</li>
              <li>We do not guarantee the accuracy, completeness, or suitability of any AI Output for your specific use case.</li>
              <li>AI Output should not be relied upon as legal, medical, financial, or professional advice.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-secondary mb-3">8. Intellectual Property</h2>
            <p>
              <strong>Your Content:</strong> You retain ownership of all content you upload to the Service, including product images, descriptions, and other materials (&quot;Your Content&quot;). By uploading Your Content, you grant us a limited, non-exclusive license to process it for the purpose of providing the Service.
            </p>
            <p className="mt-3">
              <strong>AI Output:</strong> Subject to your compliance with these Terms and applicable law, you own the AI Output generated from Your Content through the Service. You are free to use AI Output for commercial purposes.
            </p>
            <p className="mt-3">
              <strong>Our Service:</strong> The Service, including its design, code, branding, templates, and documentation, is owned by ShelfReady and protected by intellectual property laws. Nothing in these Terms grants you rights to our trademarks, logos, or proprietary technology.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-secondary mb-3">9. Third-Party Services</h2>
            <p>
              The Service integrates with third-party platforms (Amazon, Etsy, Shopify, etc.) and AI providers. We are not responsible for the availability, accuracy, or policies of third-party services. Your use of third-party platforms is governed by their respective terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-secondary mb-3">10. Service Availability</h2>
            <p>
              We strive to maintain high availability but do not guarantee uninterrupted access. The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control. We are not liable for any losses arising from service interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-secondary mb-3">11. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, ShelfReady and its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising from your use of the Service.
            </p>
            <p className="mt-3">
              Our total aggregate liability for any claims arising from or related to the Service shall not exceed the amount you paid to us in the twelve (12) months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-secondary mb-3">12. Disclaimer of Warranties</h2>
            <p>
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, whether express, implied, or statutory, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-secondary mb-3">13. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless ShelfReady from any claims, damages, losses, or expenses (including reasonable attorney&apos;s fees) arising from your use of the Service, violation of these Terms, or infringement of any third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-secondary mb-3">14. Termination</h2>
            <p>
              We may suspend or terminate your access to the Service at any time, with or without cause, upon notice. Upon termination, your right to use the Service ceases immediately. Sections relating to intellectual property, limitation of liability, indemnification, and governing law survive termination.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-secondary mb-3">15. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of India, without regard to conflict of law principles. Any disputes shall be resolved through binding arbitration or in the courts of competent jurisdiction in India.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-secondary mb-3">16. Contact</h2>
            <p>
              For questions about these Terms, contact us at:
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
