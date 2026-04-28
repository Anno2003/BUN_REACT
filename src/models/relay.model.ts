export interface Relay{
	pin:number,
	state:boolean,
}

export function relayFromJson(json:any):Relay{
	return {
		pin: Number(json.pin),
		state: Boolean(json.state),
	};
}
