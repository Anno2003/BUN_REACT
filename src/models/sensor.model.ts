export interface SensorDefinition {
    id:number,
    index:number,
    pin:number,
    value:number,
}

export interface SensorReading {
  key:string,
  value:number,
  timestamp:Date,
}

export function sensorDefinitionFromJson(json: any): SensorDefinition {
  return {
    id: json.entity_id,
    index: json.index,
    pin: json.pin ?? undefined,
    value: json.value != null ? Number(json.value) : undefined,
  };
}

export function sensorReadingFromJson(json: any): SensorReading {
  return {
    key: json.key,
    value: json.value,
    timestamp: new Date(json.timestamp),
  };
}
