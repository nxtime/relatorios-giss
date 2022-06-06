export default function formatData({ data }) {
	// console.log(data);
	const nfesData = { 
		nfes: [...Array(data.nfeNum.length - 1).keys()]
	}
	
	for(let i = 0; i < data.nfeNum.length - 1; i++ ) {
		nfesData.nfes[i] = {
			num: data.nfeNum[i],
			status: data.status[i],
			value: data.totalValues[i]
		}
	}	
	return nfesData
}
