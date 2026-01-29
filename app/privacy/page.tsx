import { Eye } from "lucide-react"

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-xl bg-[#00b4d8]/20">
          <Eye className="h-8 w-8 text-[#00b4d8]" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-[#e8f4f8]">Privacy Policy</h1>
      </div>

      <div className="prose prose-invert max-w-none space-y-6 text-[#a8c5d6]">
        <p className="text-sm text-[#6b8a9a]">Last updated: January 2026</p>

        <section>
          <h2 className="text-xl font-semibold text-[#e8f4f8] mb-3">1. Information We Collect</h2>
          <p><strong className="text-[#e8f4f8]">Wallet Address:</strong> When you connect your wallet, we store your public wallet address to track your game activity and balances.</p>
          <p><strong className="text-[#e8f4f8]">Username:</strong> If you choose to set a display name, this is stored and shown publicly on leaderboards.</p>
          <p><strong className="text-[#e8f4f8]">Game Activity:</strong> We record your spins, locks, and transactions for game functionality and verification purposes.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#e8f4f8] mb-3">2. Information We Don&apos;t Collect</h2>
          <p>We do not collect personal identifying information such as names, emails, phone numbers, or physical addresses. We do not use cookies for tracking. We do not share data with third-party advertisers.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#e8f4f8] mb-3">3. Blockchain Data</h2>
          <p>All transactions occur on the public Solana blockchain. Transaction data is publicly visible and immutable. This is inherent to blockchain technology and not within our control.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#e8f4f8] mb-3">4. How We Use Data</h2>
          <p>Your data is used to: operate the game and process transactions, display leaderboards and activity feeds, verify provably fair outcomes, and improve the service.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#e8f4f8] mb-3">5. Data Storage</h2>
          <p>Game data is stored in secure databases. We implement reasonable security measures to protect your information. However, no system is 100% secure.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#e8f4f8] mb-3">6. Third-Party Services</h2>
          <p>We use Solana RPC providers to interact with the blockchain. These providers may have their own privacy policies. We use Supabase for database hosting.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#e8f4f8] mb-3">7. Your Rights</h2>
          <p>You can disconnect your wallet at any time. Usernames can be changed. On-chain data cannot be deleted due to the nature of blockchain.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#e8f4f8] mb-3">8. Changes to This Policy</h2>
          <p>We may update this policy periodically. Changes will be posted on this page with an updated date.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#e8f4f8] mb-3">9. Contact</h2>
          <p>For privacy concerns, reach out via our official social media channels or GitHub repository.</p>
        </section>
      </div>
    </div>
  )
}
