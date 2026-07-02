import RoadmapPage from "@/components/layout/RoadmapPage";
export default function BankingPage() {
  return <RoadmapPage eyebrow="Banking" title="Banking & Reconciliation" description="Bank ledgers, statement reconciliation, fund transfers and cheque tracking." items={["Bank account ledgers","Statement reconciliation","Fund transfers (Contra voucher)","Cheque register","UPI reconciliation"]} />;
}
