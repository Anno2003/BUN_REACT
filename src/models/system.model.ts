export interface System{
	version:number,
	mode:number,
}

export function systemFromJson(json:any):System{
	return{
		version:Number( json.version ),
		mode:Number( json.mode ),
	}
}
