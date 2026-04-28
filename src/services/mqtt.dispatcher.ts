import { sensorService } from "./sensor.service";
import { relayService } from "./relay.service";
import { alarmService} from "./alarm.service";
import { ruleService} from "./rule.service";
import { systemService} from "./system.service";

export function dispatchMQTT(topic: string, payload: any) {
  console.log(payload);
  try {
    // route by topic
    if (topic.endsWith("cmd")){
      return;
    }

    if (topic.endsWith("sensors/reply")) {
      sensorService.updateDefinitionsFromReply(payload);
      return;
    }

    if (topic.endsWith("sensors/value")) {
      sensorService.updateValuesFromStream(payload);
      return;
    }

    if (topic.endsWith("devices/reply")) {
      relayService.updateFromMqtt(payload);
      return;
    }
    if (topic.endsWith("alarms/reply")) {
      alarmService.updateFromMqtt(payload);
      return;
    }
    
    if (topic.endsWith("rules/reply")) {
      ruleService.updateFromMqtt(payload);
      return;
    }

    if (topic.endsWith("system/reply")) {
      systemService.updateFromMqtt(payload);
      return;
    }

    console.log("Unhandled topic:", topic);
  } catch (err) {
    console.error("Dispatcher error:", err);
  }
}

export function requestRefreshAll() {
  sensorService.requestSensorsRefresh();
  relayService.requestRelaysRefresh();
  alarmService.requestAlarmsRefresh();
  ruleService.requestRulesRefresh();
  systemService.requestSystemRefresh();
}
