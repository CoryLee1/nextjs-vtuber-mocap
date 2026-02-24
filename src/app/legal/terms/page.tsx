import React from 'react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-16 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-[#EEFF00]">Terms of Service</h1>
        <p className="text-sm text-gray-400">Last Updated: February 24, 2026</p>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
          <p className="text-gray-300">
            By accessing or using Echuu (the "Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">2. User Conduct & Content Safety</h2>
          <p className="text-gray-300">
            You agree not to use the Service to generate, upload, or share content that is illegal, harmful, threatening, abusive, harassment, defamatory, vulgar, obscene, libelous, invasive of another's privacy, or hateful.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-gray-300">
            <li>
              <strong>Compliance with Local Laws:</strong> You explicitly agree to comply with all applicable laws and regulations in your jurisdiction, including but not limited to:
              <ul className="list-circle pl-5 mt-1 text-gray-400">
                <li><strong>United States:</strong> Digital Millennium Copyright Act (DMCA).</li>
                <li><strong>China:</strong> Cybersecurity Law of the People's Republic of China, Provisions on the Governance of the Online Information Content Ecosystem. You must not endanger national security, divulge state secrets, subvert state power, or undermine national unity.</li>
                <li><strong>Japan:</strong> Act on Regulation of Transmission of Specified Electronic Mail, Copyright Act.</li>
              </ul>
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">3. Intellectual Property</h2>
          <p className="text-gray-300">
            <strong>VRM Models:</strong> You retain ownership of the VRM models you upload. By uploading, you grant Echuu a license to display and use these models solely for providing the Service to you.
          </p>
          <p className="text-gray-300">
            <strong>Service Content:</strong> The design, code, and architecture of Echuu are the property of Echuu.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">4. Disclaimer of Warranties</h2>
          <p className="text-gray-300">
            The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, whether express or implied.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">5. Termination</h2>
          <p className="text-gray-300">
            We reserve the right to suspend or terminate your access to the Service at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">6. Contact</h2>
          <p className="text-gray-300">
            For any questions regarding these Terms, please contact us at: <a href="mailto:cory@anngel.live" className="text-[#EEFF00] hover:underline">cory@anngel.live</a>
          </p>
        </section>
      </div>
    </div>
  );
}
