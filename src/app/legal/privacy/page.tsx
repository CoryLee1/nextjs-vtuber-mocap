import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-16 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-[#EEFF00]">Privacy Policy</h1>
        <p className="text-sm text-gray-400">Last Updated: February 24, 2026</p>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">1. Information We Collect</h2>
          <p className="text-gray-300">
            We collect information you provide directly to us, such as when you create an account, upload content, or communicate with us. This may include:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-gray-300">
            <li><strong>Account Information:</strong> Email address, username, and profile picture (via Google OAuth or uploaded directly).</li>
            <li><strong>User Content:</strong> VRM models, background images, and settings you upload or configure.</li>
            <li><strong>Camera Data:</strong> We use your camera solely for real-time motion capture processing on your local device. <strong>We do not upload or store your raw camera feed/video on our servers.</strong> Only the calculated motion data (coordinates) is processed to animate your avatar.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
          <p className="text-gray-300">
            We use the information we collect to provide, maintain, and improve our services, including:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-gray-300">
            <li>To provide the motion capture and broadcasting service.</li>
            <li>To manage your account and send you technical notices.</li>
            <li>To monitor and analyze trends and usage.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">3. Regional Compliance</h2>
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-medium text-white">United States (CCPA/CPRA)</h3>
              <p className="text-gray-300">
                Residents of California have the right to request access to and deletion of their personal information. We do not sell your personal information.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">China (PIPL)</h3>
              <p className="text-gray-300">
                In compliance with the Personal Information Protection Law (PIPL):
                <ul className="list-circle pl-5 mt-1 text-gray-400">
                  <li>We process personal information based on your consent and necessity for the service.</li>
                  <li>We do not transfer your personal information across borders unless strictly necessary and compliant with regulations.</li>
                  <li>You have the right to access, correct, or delete your personal information.</li>
                </ul>
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">Japan (APPI)</h3>
              <p className="text-gray-300">
                In compliance with the Act on the Protection of Personal Information (APPI):
                <ul className="list-circle pl-5 mt-1 text-gray-400">
                  <li>We specify the purpose of use for any personal information collected.</li>
                  <li>We do not provide personal data to third parties without your prior consent, except as permitted by law.</li>
                  <li>We implement security measures to prevent leakage or loss of personal data.</li>
                </ul>
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">4. Data Deletion</h2>
          <p className="text-gray-300">
            You may request deletion of your account and associated data at any time by contacting us.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">5. Contact</h2>
          <p className="text-gray-300">
            If you have any questions about this Privacy Policy, please contact us at: <a href="mailto:cory@anngel.live" className="text-[#EEFF00] hover:underline">cory@anngel.live</a>
          </p>
        </section>
      </div>
    </div>
  );
}
