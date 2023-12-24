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

	return [CDFHOffset + 6, CDFHOffset + 7, CDFHOffset + 10, CDFHOffset + 11]
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

// get EOCHD bytes and start offset position
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

// insert new bytes
const insertBytes = (oldArrayBuffer, newArrayBuffer) => {
	// create blank buffer with adition (+) old and new bytes
	const newUnit8Buffer = new Uint8Array(oldArrayBuffer.length + newArrayBuffer.length);

	// set old buffer for `fill old buffer each index blank value`
	newUnit8Buffer.set(oldArrayBuffer);

	// iterate and add credit decimal bytes
	for (let i = 0; i < newArrayBuffer.length; i++) {
		newUnit8Buffer[oldArrayBuffer.length + i] = newArrayBuffer[i]
	}

	return newUnit8Buffer;

}

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

	let unit8Buffer = new Uint8Array(filesBuff.buffer);

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
	{
		if (fileTypeVal === 'obb') {
			let CDFHCurrOf = CDFHOffset;

			for (let i = 0; i < CDFH.length; i++) {

				const ascii = String.fromCharCode.apply(null, CDFH[i]);

				// store next offset start position index
				const CDFHNextOf = CDFHCurrOf + CDFH[i].length;

				if (ascii.includes('unity_obb_guid')) {

					// store next offset start position index
					CDFHCurrOf = CDFHNextOf;
					continue;
				};

				getCDFH_C_V(CDFHCurrOf).forEach((elm) => {
					unit8Buffer[elm] = 0;
				})
				// store next offset start position index
				CDFHCurrOf = CDFHNextOf
			}
		}
	}

	// damaging EOCHD
	{
		if (fileTypeVal === 'obb') {

			// store End Of Center Directory Number and Total Number bytes

			const EOCHDNumberRecords = unit8Buffer.slice(EOCHDIdx + 8, EOCHDIdx + 12)
			EOCHDNumberRecords.forEach((nR, idx) => {
				unit8Buffer[(EOCHDIdx + 8) + idx] = nR + 5
			})
		}
	}

	// store credit ascii text to decimal int
	{
		// set comment length EOCHD last 2 byte
		unit8Buffer[unit8Buffer.length - 2] = 0;
		unit8Buffer[unit8Buffer.length - 1] = 39;

		// store credit as Uint8Array
		const creditDecimal = [
			84, 104, 105, 115, 32, 65, 99, 104, 105,
			118, 101, 32, 80, 114, 111, 116, 101, 99,
			116, 101, 100, 32, 66, 121, 32, 90, 68,
			97, 109, 97, 103, 101, 114, 32, 40, 83,
			65, 41, 46
		];

		// store preventing EOCHD singnature matching as Uint8Array
		const EOCHDCorruptSing = [
			80, 75, 1, 2, 31, 0, 10, 0, 1, 0, 0,
			0, 67, 3, 13, 3, 52, 151, 192, 83, 89, 0,
			0, 0, 89, 0, 0, 0, 41, 0, 35, 0, 0,
			0, 0, 0, 0, 0, 32, 0, 0, 0, 144, 198,
			108, 5
		]

		unit8Buffer = insertBytes(unit8Buffer,creditDecimal);
	}

	return unit8Buffer.buffer;
};

export default damageAchive;