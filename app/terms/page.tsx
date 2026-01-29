import { FileText } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-xl bg-[#00d4aa]/20">
          <FileText className="h-8 w-8 text-[#00d4aa]" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-[#e8f4f8]">Terms of Service</h1>
      </div>

      <div className="prose prose-invert max-w-none space-y-6 text-[#a8c5d6]">
        <p className="text-sm text-[#6b8a9a]">Last updated: January 2026</p>

        <section>
          <h2 className="text-xl font-semibold text-[#e8f4f8] mb-3">1. Acceptance of Terms</h2>
          <p>By accessing or using Lock Slot, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the service.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#e8f4f8] mb-3">2. Eligibility</h2>
          <p>You must be at least 18 years old (or the legal age for gambling in your jurisdiction) to use Lock Slot. By using the service, you represent that you meet these requirements and that online gambling is legal in your jurisdiction.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#e8f4f8] mb-3">3. Service Description</h2>
          <p>Lock Slot is a provably fair, pari-mutuel staking game on the Solana blockchain. Users stake tokens which are locked for variable durations based on random outcomes. The service operates entirely on-chain with verifiable randomness.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#e8f4f8] mb-3">4. No Financial Advice</h2>
          <p>Lock Slot does not provide financial, investment, or gambling advice. All decisions to use the platform are made at your own discretion and risk.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#e8f4f8] mb-3">5. Wallet & Funds</h2>
          <p>You are solely responsible for maintaining the security of your wallet and private keys. We cannot recover lost funds due to compromised wallets, lost keys, or user error.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#e8f4f8] mb-3">6. Smart Contract Risks</h2>
          <p>While our smart contracts are designed with security in mind, blockchain technology carries inherent risks. We are not liable for losses due to smart contract bugs, network issues, or blockchain-related problems.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#e8f4f8] mb-3">7. Prohibited Activities</h2>
          <p>You agree not to: use the service for money laundering or illegal activities, attempt to exploit or manipulate the system, use bots or automated tools without permission, or interfere with other users&apos; experience.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#e8f4f8] mb-3">8. Modifications</h2>
          <p>We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#e8f4f8] mb-3">9. Contact</h2>
          <p>For questions about these terms, contact us via our official social media channels or GitHub repository.</p>
        </section>
      </div>
    </div>
  )
}
