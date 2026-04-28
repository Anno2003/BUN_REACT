export interface Alarm {
  id: number,
  hour: number,
  minute: number,
  days: boolean[],// seminggu cmn 7 hari lho ya jgn lebih
  duration: number,
  targetState: boolean,
  target: number,
}

export function alarmFromJson(json: any): Alarm {
  let days: boolean[] = [];

  if (Array.isArray(json.days) && json.days.length === 7) {
    days = json.days.map((d: any) => Boolean(d));
  } else {
    console.warn("Invalid days array, defaulting to all true");
    days = new Array(7).fill(true);
  }

  return {
    id: Number(json.id),
    hour: Number(json.hour),
    minute: Number(json.minute),
    days,
    duration: Number(json.duration),
    targetState: Boolean(json.target_state),
    target: Number(json.target),
  };
}
