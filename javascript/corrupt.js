import { lockBtnElm } from './zip-damager.js';

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

// damage LFH
const dLFH = (bytes = []) => {
	// damaged singnature
	const dSing = [83, 65]
	for (let i = 0; i < dSing.length; i++) {
		bytes[i] = dSing[i];
	}
	return bytes
}

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
		EOCHD: buff.slice(startPosition.indexPos, startPosition.indexPos + 22)
	};

};

// get LFH bytes start position
const getLFHPos = (cdfhArr) => {
	let positions = [];
	for (let i = 0; i < cdfhArr.length; i++) {
		positions.push(parseInt(littleEndian(cdfhArr[i].slice(42, 46), true), 16));
	}
	return positions
};

// Function to save a file using the File System Access API
export const saveFileWithDialog = async (uint8Array,fileName) => {
	try {
		// Request access to the file system
		const handle = await window.showSaveFilePicker({
			suggestedName:fileName
		});

		// Create a writable stream to the selected file
		const writable = await handle.createWritable();

		// Write the contents of the UInt8Array to the file
		await writable.write(uint8Array);

		// Close the file
		await writable.close();

		console.log('File saved successfully!');
	} catch (err) {
		console.error('Error saving file:', err);
	}
}

const damageAchive = (filesBuff) => {

	lockBtnElm.innerText = 'Working...';
	lockBtnElm.setAttribute('disabled', true);

	const unit8Buffer = new Uint8Array(filesBuff.buffer);

	// get EOCHD (base/mean) 20 bytes
	const { EOCHD, indexPosition: EOCHDIdx } = getEOCHD(unit8Buffer);

	// store CDFH start byte postion
	const CDFHOffset = parseInt(littleEndian(EOCHD.slice(EOCHD.length - 6, EOCHD.length - 2), true), 16);

	// store CDFH splited Array Bytes
	const CDFH = splitArr(unit8Buffer.slice(CDFHOffset, EOCHDIdx), [80, 75, 1, 2]);

	// sotre each LFH byte start position array
	const LFHPosArr = getLFHPos(CDFH);

	for (let i = 0; i < LFHPosArr.length; i++) {
		const currPos = LFHPosArr[i];
		const modifiedBytes = dLFH(unit8Buffer.slice(currPos, currPos + 30));
		modifiedBytes.forEach((b, idx) => {
			unit8Buffer[currPos + idx] = b;
		});
	}

	return unit8Buffer;
};

export default damageAchive;