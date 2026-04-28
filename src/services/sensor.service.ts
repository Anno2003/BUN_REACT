import { type SensorDefinition, type SensorReading, sensorDefinitionFromJson } from "../models/sensor.model";
import { broadcast } from "./ws.service";
import { mqttService } from "./mqtt.service";

type SensorMap = Record<string, SensorDefinition[]>;
type ReadingMap = Record<string, Record<string, SensorReading>>;

class SensorService {
  private definitions: SensorMap = {};
  private readings: ReadingMap = {};

  private timeoutTimer?: Timer;
  private timeoutMs = 30000;

  // --------------------
  // FROM sensors/reply
  // --------------------
  updateDefinitionsFromReply(payload: any) {
    this.definitions = {};

    const categories = ["analog", "temperature", "humidity"];

    for (const category of categories) {
      if (!Array.isArray(payload[category])) continue;

      this.definitions[category] = payload[category].map((item: any) =>
        sensorDefinitionFromJson(item)
      );
    }

    this.notify();
  }

  // --------------------
  // FROM sensors/value
  // --------------------
  updateValuesFromStream(payload: any) {
    this.startTimeoutTimer();

    const timestamp = new Date(payload.timestamp);

    const categories = ["analog", "temperature", "humidity", "digital"];

    for (const category of categories) {
      const entries = payload[category];
      if (!entries) continue;

      if (!this.readings[category]) {
        this.readings[category] = {};
      }

      for (const [key, value] of Object.entries(entries)) {
        this.readings[category][key] = {
          key,
          value,
          timestamp,
        };
      }
    }

    this.notify();
  }
  // --------------------
  // HELPERS
  // --------------------

  private notify() {
    broadcast({
      type: "sensor_update",
      definitions: this.definitions,
      readings: this.readings,
    });
  }

  private startTimeoutTimer() {
    if (this.timeoutTimer) clearTimeout(this.timeoutTimer);

    this.timeoutTimer = setTimeout(() => {
      this.handleTimeout();
    }, this.timeoutMs);
  }

  private handleTimeout() {
    console.warn("Sensor timeout: no data received");

    broadcast({
      type: "sensor_timeout",
      message: "No data received for a while",
    });
  }

  // --------------------
  // GETTERS
  // --------------------

  getDefinitions() {
    return this.definitions;
  }

  getReadings() {
    return this.readings;
  }

  readingOf(key: string) {
    return this.readings[key];
  }

  definitionOf(id: number): SensorDefinition | undefined {
    for (const list of Object.values(this.definitions)) {
      for (const sensor of list) {
        if (sensor.id === id) return sensor;
      }
    }
    return undefined;
  }

  clear() {
    this.definitions = {};
    this.readings = {};
    this.notify();
  }

  // --------------------
  // COMMAND
  // --------------------

  requestSensorsRefresh() {
    mqttService.publish("sensors/cmd", JSON.stringify({ cmd: "print" }));
  }
}

export const sensorService = new SensorService();
