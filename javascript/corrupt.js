
// binary(decimal) to hex
const byteToHex = (byte) => {
	return ('0' + byte.toString(16)).slice(-2);
};

// split array by matching sequence array
const splitArr = (arr = [], values = []) => {
	const positions = [];
	const lastIdx = arr.length - values.length + 1;

	for (let i = 0; i < lastIdx; i++) {
		let found = true;
		for (let ti = 0; ti < values.length; ti++) {
			if (arr[i + ti] !== values[ti]) {
				found = false;
				break;
			}
		}
		if (found) {
			positions.push(i);
			i += values.length - 1;
		}
	}

	return positions.map((pos, idx) => {
		const endRange = idx === positions.length - 1 ? arr.length : positions[idx + 1];
		return arr.slice(pos, endRange);
	});
};

// revearse binary value array in big endian to little endian
const littleEndian = (arr = [], str = false) => {
	let revBytes = [];
	for (let i = arr.length - 1; i >= 0; i--) {
		const byte = byteToHex(arr[i])
		revBytes.push(byte);
	}
	if (str) return revBytes.join('');
	return revBytes
};

// get EOCHD bytes
const getEOCHD = (buff = []) => {
	let startPosition = {
		found: false,
		indexPos: 0
	};
	// singnature is decimal inteager
	const singnature = [80, 75, 5, 6];

	for (let i = buff.byteLength - 1; i > 0; i--) {

		if (startPosition.found && startPosition.indexPos) break;

		const currByte = buff[i];

		if (currByte === singnature[0]) {


			for (let j = 1; j < singnature.length; j++) {

				if (singnature[j] !== buff[i + j]) {
					startPosition = {
						...startPosition,
						found: false,
						indexPos: 0
					}
					break;
				} else {

					if (j === 3) {
						startPosition = {
							...startPosition,
							found: true
						}
					}
					startPosition = {
						...startPosition,
						indexPos: i
					}
				}
			}
		}
	};

	return {
		indexPosition: startPosition.indexPos,
		EOCHD: buff.slice(startPosition.indexPos,startPosition.indexPos+22)
	};

}

const damageAchive = (filesBuff) => {

	const unit8Buffer = new Uint8Array(filesBuff.buffer);

	// get EOCHD (base/mean) 20 bytes
	const {EOCHD,indexPosition:EOCHDIdx} = getEOCHD(unit8Buffer);

	// store CDFH start byte postion
	const CDFHOffset = parseInt(littleEndian(EOCHD.slice(EOCHD.length-6,EOCHD.length-2),true),16);

	// store CDFH splited Array Bytes
	const CDFH = splitArr(unit8Buffer.slice(CDFHOffset,EOCHDIdx),[80,75,1,2]) ;

	console.log(CDFHArr);
};

export default damageAchive;