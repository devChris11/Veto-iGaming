import { DepositLimit } from "./DepositLimit";
import { LossLimits } from "./LossLimits";
import { GameBans } from "./GameBans";
import { SessionTime } from "./SessionTime";
import { PeluuriInfo } from "./PeluuriInfo";

export function ResponsibleGaming() {
  return (
    <div className="space-y-6">
      <DepositLimit />
      <LossLimits />
      <GameBans />
      <SessionTime />
      <PeluuriInfo />
    </div>
  );
}
