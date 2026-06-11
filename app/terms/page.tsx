import Link from "next/link";
import { Logo } from "@/app/_components/Logo";
import {
  LegalDoc,
  LegalSection,
  LegalList,
  LegalParagraph,
} from "@/app/_components/LegalDoc";

export const metadata = {
  title: "Terms & Conditions — Jam · letsJam",
  description:
    "The rules and regulations for using Oncefound LLC's services, including letsJam.",
};

// Static legal page. Content mirrors the canonical Oncefound LLC terms &
// conditions (previously hosted on Notion); hosted here so the Google OAuth
// consent screen's terms-of-service URL lives on the authorized letsjam.so
// domain.
export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-6 md:px-12 lg:px-16">
        <Link href="/" className="inline-flex" aria-label="Jam home">
          <Logo />
        </Link>
      </header>
      <LegalDoc title="Terms & Conditions" lastUpdated="15 January 2025">
        <LegalParagraph>
          Welcome to Oncefound LLC. These Terms and Conditions
          (&ldquo;Terms&rdquo;) outline the rules and regulations for using our
          services, website, and associated platforms (collectively, the
          &ldquo;Services&rdquo;) — including letsJam. By accessing or using
          our Services, you agree to these Terms. If you do not agree, please
          discontinue use immediately.
        </LegalParagraph>

        <LegalSection heading="1. Company Information">
          <LegalParagraph>
            <strong>Business Name:</strong> Oncefound LLC
            <br />
            <strong>Business Type:</strong> Global Product Studio
            <br />
            <strong>Contact Email:</strong>{" "}
            <a
              href="mailto:admin@oncefound.co"
              className="font-medium underline underline-offset-2"
            >
              admin@oncefound.co
            </a>
          </LegalParagraph>
        </LegalSection>

        <LegalSection heading="2. Services Provided">
          <LegalParagraph>
            Oncefound LLC specializes in product design, software development,
            brand strategy, and digital product optimization and growth.
            Specific services are outlined in individual client agreements.
          </LegalParagraph>
        </LegalSection>

        <LegalSection heading="3. Acceptance of Terms">
          <LegalParagraph>
            By using our Services, you confirm that you:
          </LegalParagraph>
          <LegalList
            items={[
              "Are at least 18 years old.",
              "Agree to comply with all applicable laws and regulations.",
              "Have read, understood, and agree to these Terms.",
            ]}
          />
        </LegalSection>

        <LegalSection heading="4. Intellectual Property">
          <LegalList
            items={[
              "All content, designs, and materials created by Oncefound LLC remain our intellectual property unless otherwise agreed in writing.",
              "Clients receive a license to use deliverables as outlined in their individual agreements. Unauthorized reproduction, resale, or distribution is prohibited.",
            ]}
          />
        </LegalSection>

        <LegalSection heading="5. Client Responsibilities">
          <LegalParagraph>Clients agree to:</LegalParagraph>
          <LegalList
            items={[
              "Provide timely feedback and required resources.",
              "Pay for services according to agreed payment schedules.",
              "Use our deliverables only for lawful purposes.",
            ]}
          />
        </LegalSection>

        <LegalSection heading="6. Payments and Refunds">
          <LegalList
            items={[
              "Payments are due as per the terms outlined in client agreements.",
              "Oncefound LLC reserves the right to suspend or terminate Services for overdue payments.",
              "Refunds will be handled on a case-by-case basis and are subject to service completion and prior agreements.",
            ]}
          />
        </LegalSection>

        <LegalSection heading="7. Confidentiality">
          <LegalParagraph>
            Both parties agree to keep confidential information private and not
            disclose it to any third party unless required by law.
            Confidentiality agreements can be signed separately if requested by
            the client.
          </LegalParagraph>
        </LegalSection>

        <LegalSection heading="8. Limitation of Liability">
          <LegalList
            items={[
              "Oncefound LLC is not liable for indirect, incidental, or consequential damages arising from the use of our Services.",
              "In no case will our liability exceed the amount paid by the client for the specific service.",
            ]}
          />
        </LegalSection>

        <LegalSection heading="9. Termination">
          <LegalList
            items={[
              "Either party may terminate a project or engagement with written notice.",
              "Upon termination, all outstanding payments must be settled within 14 days.",
            ]}
          />
        </LegalSection>

        <LegalSection heading="10. Third-Party Tools and Integrations">
          <LegalParagraph>
            Our Services may include third-party tools or integrations.
            Oncefound LLC is not responsible for the functionality,
            reliability, or security of these tools.
          </LegalParagraph>
        </LegalSection>

        <LegalSection heading="11. Dispute Resolution">
          <LegalList
            items={[
              "Any disputes shall first be resolved amicably.",
              "If necessary, disputes will be resolved under the jurisdiction of Wyoming, USA.",
            ]}
          />
        </LegalSection>

        <LegalSection heading="12. Changes to Terms">
          <LegalParagraph>
            Oncefound LLC reserves the right to update these Terms at any time.
            Significant changes will be communicated through email or posted on
            our website.
          </LegalParagraph>
        </LegalSection>

        <LegalSection heading="13. Contact Us">
          <LegalParagraph>
            For any questions or concerns, please reach out to us at:
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
            By using our Services, you agree to these Terms. Thank you for
            choosing Oncefound LLC to help bring your vision to life.
          </LegalParagraph>
        </LegalSection>
      </LegalDoc>
    </div>
  );
}
