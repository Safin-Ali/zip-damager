
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

// revearse hex value array in big endian to little endian
const littleEndian = (arr = [], str = false) => {
	let revBytes = [];
	for (let i = arr.length - 1; i >= 0; i--) {
		const byte = byteToHex(arr[i])
		revBytes.push(byte);
	}
	if (str) return revBytes.join('');
	return revBytes
};

const damageAchive = (filesBuff) => {
	// here will be logic
};

export default damageAchive;