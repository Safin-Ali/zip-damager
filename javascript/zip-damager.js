import damageAchive from './corrupt.js';

const selectElm = (id) => document.getElementById(id);

export const lockBtnElm = selectElm('lockBtn');
const inputFile = selectElm('inputFile');
const fileSizeElm = selectElm('fileSize');

// store files as binary
let filesBin;

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

lockBtnElm.addEventListener('click',() => {
	if(!filesBin || !inputFile.files.length) return alert('no file selected');
	const damagedBuff = damageAchive(new DataView(filesBin));
	lockBtnElm.classList.replace('btn-primary','btn-success');
	lockBtnElm.innerText = 'Damaged';
	lockBtnElm.removeAttribute('disabled');
	lockBtnElm.classList.add('pe-none');
});
