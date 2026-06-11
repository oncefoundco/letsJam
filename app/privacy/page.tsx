import Link from "next/link";
import { Logo } from "@/app/_components/Logo";
import {
  LegalDoc,
  LegalSection,
  LegalList,
  LegalParagraph,
  LegalSubList,
} from "@/app/_components/LegalDoc";

export const metadata = {
  title: "Privacy Policy — Jam · letsJam",
  description:
    "How Oncefound LLC collects, uses, and protects your personal data across letsJam and our other services.",
};

// Static legal page. Content mirrors the canonical Oncefound LLC privacy
// policy (previously hosted on Notion); hosted here so the Google OAuth
// consent screen's privacy-policy URL lives on the authorized letsjam.so
// domain.
export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-6 md:px-12 lg:px-16">
        <Link href="/" className="inline-flex" aria-label="Jam home">
          <Logo />
        </Link>
      </header>
      <LegalDoc title="Privacy Policy" lastUpdated="15 January 2025">
        <LegalParagraph>
          Oncefound LLC (&ldquo;we,&rdquo; &ldquo;our,&rdquo; &ldquo;us&rdquo;)
          respects your privacy and is committed to protecting your personal
          data. This Privacy Policy explains how we collect, use, disclose, and
          protect the information you provide to us while using our services,
          website, or platforms (collectively, the &ldquo;Services&rdquo;) —
          including letsJam.
        </LegalParagraph>

        <LegalSection heading="1. Information We Collect">
          <LegalParagraph>
            We may collect the following types of information:
          </LegalParagraph>
          <LegalSubList
            items={[
              {
                label: "1.1 Personal Information",
                points: [
                  "Name, email address, phone number, and company details provided when you contact us or engage our Services.",
                  "Payment and billing information for transactions.",
                ],
              },
              {
                label: "1.2 Usage Data",
                points: [
                  "Information about how you use our website, including IP address, browser type, and activity on the site.",
                ],
              },
              {
                label: "1.3 Cookies and Tracking Technologies",
                points: [
                  "We may use cookies, beacons, and similar technologies to enhance your experience and analyze site performance.",
                ],
              },
            ]}
          />
        </LegalSection>

        <LegalSection heading="2. How We Use Your Information">
          <LegalParagraph>We use the information we collect to:</LegalParagraph>
          <LegalList
            items={[
              "Provide, improve, and deliver our Services.",
              "Communicate with you about projects, updates, and promotions.",
              "Process payments and fulfill transactions.",
              "Ensure security and prevent fraud.",
              "Comply with legal and regulatory obligations.",
            ]}
          />
        </LegalSection>

        <LegalSection heading="3. How We Share Your Information">
          <LegalParagraph>
            We do not sell or rent your personal information. However, we may
            share your data with:
          </LegalParagraph>
          <LegalList
            items={[
              <>
                <strong>Service Providers</strong>: Trusted third parties who
                assist in delivering our Services (e.g., hosting providers,
                payment processors).
              </>,
              <>
                <strong>Legal Authorities</strong>: When required to comply
                with laws, regulations, or legal proceedings.
              </>,
              <>
                <strong>Business Transfers</strong>: In the event of a merger,
                acquisition, or sale of assets.
              </>,
            ]}
          />
        </LegalSection>

        <LegalSection heading="4. Your Rights">
          <LegalParagraph>
            Depending on your jurisdiction, you may have the following rights
            regarding your personal data:
          </LegalParagraph>
          <LegalList
            items={[
              <>
                <strong>Access</strong>: Request access to the data we hold
                about you.
              </>,
              <>
                <strong>Correction</strong>: Request corrections to inaccurate
                or incomplete data.
              </>,
              <>
                <strong>Deletion</strong>: Request deletion of your data,
                subject to legal obligations.
              </>,
              <>
                <strong>Opt-Out</strong>: Opt-out of receiving marketing emails
                or certain data processing activities.
              </>,
            ]}
          />
          <LegalParagraph>
            To exercise these rights, contact us at{" "}
            <a
              href="mailto:hello@oncefound.co"
              className="font-medium underline underline-offset-2"
            >
              hello@oncefound.co
            </a>
            .
          </LegalParagraph>
        </LegalSection>

        <LegalSection heading="5. Data Retention">
          <LegalParagraph>
            We retain your personal data only as long as necessary to fulfill
            the purposes outlined in this policy, unless a longer retention
            period is required by law.
          </LegalParagraph>
        </LegalSection>

        <LegalSection heading="6. Data Security">
          <LegalParagraph>
            We use industry-standard measures to protect your information,
            including encryption and secure servers. However, no method of data
            transmission or storage is 100% secure.
          </LegalParagraph>
        </LegalSection>

        <LegalSection heading="7. International Data Transfers">
          <LegalParagraph>
            If you are located outside the United States, your data may be
            transferred to and processed in the United States or other
            countries where we operate. We ensure such transfers comply with
            applicable data protection laws.
          </LegalParagraph>
        </LegalSection>

        <LegalSection heading="8. Children's Privacy">
          <LegalParagraph>
            Our Services are not directed at children under 18. We do not
            knowingly collect personal information from children.
          </LegalParagraph>
        </LegalSection>

        <LegalSection heading="9. Third-Party Links">
          <LegalParagraph>
            Our Services may include links to third-party websites. Oncefound
            LLC is not responsible for the privacy practices or content of
            these external sites.
          </LegalParagraph>
        </LegalSection>

        <LegalSection heading="10. Changes to This Privacy Policy">
          <LegalParagraph>
            We may update this Privacy Policy from time to time. Changes will
            be effective immediately upon posting the updated policy on our
            website. Significant changes will be communicated via email or
            other means.
          </LegalParagraph>
        </LegalSection>

        <LegalSection heading="11. Contact Us">
          <LegalParagraph>
            For questions or concerns about this Privacy Policy or our data
            practices, please contact us at:
          </LegalParagraph>
          <LegalParagraph>
            <strong>Oncefound LLC</strong>
            <br />
            30 N Gould St, STE R, Sheridan, WY 82801, USA
            <br />
            <a
              href="mailto:admin@oncefound.co"
              className="font-medium underline underline-offset-2"
            >
              admin@oncefound.co
            </a>
          </LegalParagraph>
          <LegalParagraph>
            By using our Services, you acknowledge and agree to the terms of
            this Privacy Policy.
          </LegalParagraph>
        </LegalSection>
      </LegalDoc>
    </div>
  );
}
