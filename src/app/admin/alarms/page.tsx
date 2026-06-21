import { getLiveAlarms } from "@/actions/alarms";
import { AlarmsClient } from "./_components/alarms-client";

export default async function AlarmsPage() {
  const alarms = await getLiveAlarms();
  return <AlarmsClient alarms={alarms} />;
}
