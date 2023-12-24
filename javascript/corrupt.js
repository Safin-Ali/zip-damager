import { fileTypeVal, loadingAnim, lockBtnElm, reset } from './zip-damager.js';

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
	// damaged entry and end index info for current fileType

	const dMetaInfo = fileTypeVal === 'obb'
		?
		{ targetStartIndexPos: 14, maxByteLeng: 30, targetEndIndexPos: 14 + 3 }
		:
		fileTypeVal === 'zip'
			?
			{ targetStartIndexPos: 0, maxByteLeng: 2, targetEndIndexPos: 1 }
			:
			{ targetStartIndexPos: 14, maxByteLeng: 30, targetEndIndexPos: 3 };

	// console.log(bytes);
	for (let i = 0; i < dMetaInfo.maxByteLeng; i++) {
		if (i < dMetaInfo.targetStartIndexPos) continue;
		if (i >= dMetaInfo.targetStartIndexPos && i <= dMetaInfo.targetEndIndexPos) {
			bytes[i] = 0;
			continue;
		}
		if (fileTypeVal !== 'obb') break;

		bytes[30] = 0;
		break

	}
	return bytes
}

// retrive CDFH `compresion method` and `minimum version of extract` index
const getCDFH_C_V = (CDFHOffset) => {

	return [CDFHOffset + 6, CDFHOffset + 7,CDFHOffset + 10, CDFHOffset + 11]
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
export const saveFileWithDialog = async (uint8Array, fileName) => {
	try {
		loadingAnim('Saving...')
		// Request access to the file system
		const handle = await window.showSaveFilePicker({
			suggestedName: fileName
		});

		// Create a writable stream to the selected file
		const writable = await handle.createWritable();

		// Write the contents of the UInt8Array to the file
		await writable.write(uint8Array);

		// Close the file
		await writable.close();

		loadingAnim('', false);
		alert('File saved successfully!');
	} catch (err) {
		loadingAnim('', false);
		alert('Error saving file');
		reset();
	}
}

const damageAchive = (filesBuff) => {

	loadingAnim('Processing...');
	lockBtnElm.setAttribute('disabled', true);

	const unit8Buffer = new Uint8Array(filesBuff.buffer);

	// get EOCHD (base/mean) 20 bytes
	const { EOCHD, indexPosition: EOCHDIdx } = getEOCHD(unit8Buffer);

	// store CDFH start byte postion
	const CDFHOffset = parseInt(littleEndian(EOCHD.slice(EOCHD.length - 6, EOCHD.length - 2), true), 16);

	// store CDFH splited Array Bytes
	const CDFH = splitArr(unit8Buffer.slice(CDFHOffset, EOCHDIdx), [80, 75, 1, 2]);

	// store each LFH byte start position array
	const LFHPosArr = getLFHPos(CDFH);

	// modify LFH
	for (let i = 0; i < LFHPosArr.length; i++) {
		const currPos = LFHPosArr[i];
		const modifiedBytes = dLFH(unit8Buffer.slice(currPos, currPos + (fileTypeVal === 'obb' ? 31 : 30)));
		modifiedBytes.forEach((b, idx) => {
			unit8Buffer[currPos + idx] = b;
		});
	}

	// modify CDFH and damaged
	for (let i = 0; i < CDFH.length; i++) {
		if (fileTypeVal !== 'obb') break;
		if (i === 0) {
			getCDFH_C_V(CDFHOffset).forEach((elm) => {
				unit8Buffer[elm] = 0;
			})
		} else {
			// store next offset start position index
			const CDFHNextOf = CDFHOffset + CDFH[i - 1].length;

			getCDFH_C_V(CDFHNextOf).forEach((elm) => {
				unit8Buffer[elm] = 0;
			})

		}
	}

	return unit8Buffer;
};

export default damageAchive;