import damageAchive, { saveFileWithDialog } from './corrupt.js';

const selectElm = (id) => document.getElementById(id);

export const lockBtnElm = selectElm('lockBtn');
const inputFile = selectElm('inputFile');
const fileSizeElm = selectElm('fileSize');

// store files as binary
let filesBin;

const reset = () => {
	inputFile.value = null;
	filesBin = null;
	lockBtnElm.classList.replace('btn-success','btn-primary');
	lockBtnElm.classList.remove('pe-none');
	inputFile.files = null;
	lockBtnElm.setAttribute('disabled',!!inputFile.files);
	inputFile.removeAttribute('disabled');
	fileSizeElm.innerText = '0 MB'
}

inputFile.addEventListener('change', () => {
	const [files] = inputFile.files;
	fileSizeElm.innerText = `${Math.floor(files.size / (1024 * 1024))} MB`;
	lockBtnElm.removeAttribute('disabled');

	const reader = new FileReader();

	reader.onprogress = () => {
		inputFile.setAttribute('disabled',true)
	};

	reader.onload = (data) => {
		lockBtnElm.removeAttribute('disabled');
		filesBin = data.currentTarget.result;
	};

	reader.onerror = () => {
		console.error('Error occurred while reading the file');
	};

	reader.readAsArrayBuffer(files);
});

lockBtnElm.addEventListener('click',async () => {
	if(!filesBin || !inputFile.files.length) return alert('no file selected');
	const dUInt8Arr = damageAchive(new DataView(filesBin));
	lockBtnElm.classList.replace('btn-primary','btn-success');
	lockBtnElm.innerText = 'Damaged';
	lockBtnElm.removeAttribute('disabled');
	lockBtnElm.classList.add('pe-none');
	const renameFile = `${inputFile.files[0].name.slice(0,-4)}_damaged.${'zip'}`;
	await saveFileWithDialog(dUInt8Arr,renameFile);
	reset()
});
