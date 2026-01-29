import { AlertTriangle } from "lucide-react"

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-xl bg-yellow-500/20">
          <AlertTriangle className="h-8 w-8 text-yellow-500" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-[#e8f4f8]">Risk Disclaimer</h1>
      </div>

      <div className="cyber-panel border-yellow-500/30 p-6 mb-8">
        <p className="text-yellow-400 font-semibold text-lg">
          Lock Slot involves financial risk. Please read this disclaimer carefully before using the platform.
        </p>
      </div>

      <div className="prose prose-invert max-w-none space-y-6 text-[#a8c5d6]">
        <section>
          <h2 className="text-xl font-semibold text-[#e8f4f8] mb-3">Gambling Risk</h2>
          <p>Lock Slot is a gambling application. While your principal tokens are returned after the lock period, the time value of your tokens and potential opportunity costs represent real financial risk. Only stake what you can afford to have locked for extended periods.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#e8f4f8] mb-3">Token Price Volatility</h2>
          <p>Cryptocurrency tokens are highly volatile. The value of your staked tokens may decrease significantly during the lock period. We are not responsible for losses due to token price changes.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#e8f4f8] mb-3">Smart Contract Risk</h2>
          <p>While our contracts are designed securely, all smart contracts carry risk of bugs or exploits. Blockchain transactions are irreversible. We recommend only staking amounts you are comfortable potentially losing.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#e8f4f8] mb-3">No Guarantee of Returns</h2>
          <p>Past results do not guarantee future outcomes. The provably fair RNG system means results are random. There is no strategy that guarantees winning outcomes.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#e8f4f8] mb-3">Regulatory Compliance</h2>
          <p>It is your responsibility to ensure that using Lock Slot is legal in your jurisdiction. We do not provide legal advice. Consult local laws regarding online gambling and cryptocurrency.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#e8f4f8] mb-3">Addiction Warning</h2>
          <p>Gambling can be addictive. If you feel you may have a gambling problem, please seek help from professional resources:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>National Council on Problem Gambling: 1-800-522-4700</li>
            <li>Gamblers Anonymous: www.gamblersanonymous.org</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#e8f4f8] mb-3">Responsible Gambling Tips</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Set a budget before playing and stick to it</li>
            <li>Never stake more than you can afford to lose</li>
            <li>Take breaks and don&apos;t chase losses</li>
            <li>Gambling should be entertainment, not income</li>
            <li>If it&apos;s not fun anymore, stop</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#e8f4f8] mb-3">Limitation of Liability</h2>
          <p>Lock Slot and its creators are not liable for any financial losses incurred through use of the platform. By using Lock Slot, you acknowledge and accept all risks described in this disclaimer.</p>
        </section>

        <div className="mt-8 p-4 rounded-lg bg-[#0a1628] border border-[#1a3a4a]">
          <p className="text-sm text-[#6b8a9a] text-center">
            By using Lock Slot, you confirm that you have read, understood, and agree to this Risk Disclaimer.
          </p>
        </div>
      </div>
    </div>
  )
}
