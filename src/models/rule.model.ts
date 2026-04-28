export interface Rule{
	id:number,
	min:number,
	max:number,
	targetState:boolean,
	target:number,
	sensorId:number,
}

export function ruleFromJson(json:any):Rule{
	return {
		id:Number( json.id ),
		min:Number( json.value_min ),
		max:Number( json.value_max ),
		targetState:Boolean(json.target_state),
		target:Number( json.target ),
		sensorId:Number( json.sensor_id ),
	};
}
