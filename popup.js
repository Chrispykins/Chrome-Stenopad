var noteSelect = document.getElementById("noteSelect");
var saveButton = document.getElementById("saveButton");
var deleteButton = document.getElementById("deleteButton");
var cancelButton = document.getElementById("cancelButton");
var confirmButton = document.getElementById("confirmButton");
var textarea = document.getElementsByTagName("textarea")[0];


var saveInfo = document.getElementById("saveInfo");
var deleteInfo = document.getElementById("deleteInfo");
var nameInput = document.getElementById("nameInput");

var isDeleting = false;
var isSaving = false;

//var unsavedNoteText = "";

var noteNames = [];
var currentNoteName;

//load noteNames array on startup
chrome.storage.sync.get('noteNames', function loadNoteNames(data) {
	if (data) {
		noteNames = data.noteNames || [];
		UpdateNoteSelect();
	}
});

//load cached unsaved note if there is one
LoadNote("Unsaved Note");

//save unsavedNote automatically in local storage when user types in textarea
textarea.addEventListener('input', function cacheUnsavedNote(event) {
	if (currentNoteName == "Unsaved Note") localStorage.unsavedNote = textarea.value;
});

//open delete confirmation when user presses delete
deleteButton.addEventListener('click', function() {

	if (currentNoteName == "Unsaved Note") {
		DeleteNote(currentNoteName);
		return;
	}

	saveButton.hidden = true;
	deleteButton.hidden = true;

	deleteInfo.hidden = false;
	confirmButton.hidden = false;
	cancelButton.hidden = false;

	isDeleting = true;
})

//open save confirmation when user presses save
saveButton.addEventListener('click', function() {
	saveButton.hidden = true;
	deleteButton.hidden = true;

	saveInfo.hidden = false;
	confirmButton.hidden = false;
	cancelButton.hidden = false;

	isSaving = true;
});


//confirm button action
confirmButton.addEventListener('click', function() {

	if (isDeleting) {
		DeleteNote(currentNoteName);
	}
	else {
		SaveNote();
	}

	ResetButtons();
});

//cancel button action
cancelButton.addEventListener('click', ResetButtons);

//load note when user selects with drop down menu
noteSelect.addEventListener('change', function noteSelected(event) {

	var name = event.target.selectedOptions[0].value;
	LoadNote(name);
	ResetButtons();
});

//allow user to confirm save using Enter when inputting name
nameInput.addEventListener('keydown', function(event) {

	if (event.which == 13) {
		event.preventDefault();
		SaveNote();
		ResetButtons();
	}
});

//allow user to cancel save or delete by hitting Escape
addEventListener('keydown', function(event) {

	if (event.which == 27) {
		if (isDeleting || isSaving) {
			event.preventDefault();
			ResetButtons();
		}
	}
})

function UpdateNoteSelect() {

	var options = noteSelect.options;

	for (var i = 0; i < noteNames.length; i++) {

		if (options[i + 1]) {
			options[i + 1].value = noteNames[i];
			options[i + 1].textContent = noteNames[i];
		}
		else {
			var option = document.createElement('option');
			options.value = noteNames[i];
			option.text = noteNames[i];

			noteSelect.appendChild(option);
		}
	}

	//remove any spare options
	for (i = options.length - 1 ; i >= noteNames.length + 1; i--) {

		if (options[i]) options[i].remove();
	}

	//hack to make sure we still have the right note displayed after messing around with the note select options
	if (noteSelect.selectedOptions[0].value != currentNoteName) {

		var index = noteNames.indexOf(currentNoteName);

		currentNoteName = undefined;
		LoadNote(index >= 0 ? noteNames[index] : "Unsaved Note");
	}
}

function OnStorageChanged(changes) {

	if (changes.noteNames) {

		chrome.storage.sync.get("noteNames", function (items) {

			if (items) {
				noteNames = items.noteNames || [];
				UpdateNoteSelect();
			}
		});
	}
}

chrome.storage.sync.onChanged.addListener(OnStorageChanged);

function LoadNote(name) {

	if (currentNoteName == name) return;

	currentNoteName = name;

	if (name != "Unsaved Note") {
		chrome.storage.sync.get(name, function getNoteText(data) {
			textarea.value = data[name] || "";
			noteSelect.selectedIndex = noteNames.indexOf(name) + 1;
			nameInput.value = name;
		});
	}
	else {
		textarea.value = localStorage.unsavedNote || "";
		noteSelect.selectedIndex = 0;
		nameInput.value = 'untitled';
	}
}

function DeleteNote(name) {

	if (name == "Unsaved Note") {
		textarea.value = "";
		localStorage.removeItem('unsavedNote');
	}
	else {
		noteNames.splice(noteNames.indexOf(name), 1);
		chrome.storage.sync.set({noteNames: noteNames});
		chrome.storage.sync.remove(name);
	}
}

function SaveNote() {

	var name = nameInput.value;
	var text = textarea.value;

	var update = {};
	update[name] = text;

	if (!noteNames.includes(name)) noteNames.push(name);
	update.noteNames = noteNames;

	chrome.storage.sync.set(update);

	currentNoteName = name;
}

function ResetButtons() {

	isDeleting = false;
	isSaving = false;

	saveButton.hidden = false;
	deleteButton.hidden = false;

	confirmButton.hidden = true;
	cancelButton.hidden = true;
	saveInfo.hidden = true;
	deleteInfo.hidden = true;

}