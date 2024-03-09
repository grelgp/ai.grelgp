const apiUrl = 'https://ai.grelgp.com'

// Fetch data for dropdown from API and populate the dropdown options
async function populateModelDropdown() {

    const response = await fetch(apiUrl + '/models');

    if (response.ok) {
        const modelNames = await response.json();
        const modelDropdown = document.getElementById('model');

        // Populate dropdown options
        modelNames.forEach(modelName => {
            const option = document.createElement('option');
            option.value = modelName;
            option.text = modelName;
            modelDropdown.appendChild(option);
        });
    } else {
        console.error('Failed to fetch models from API');
    }
}

function onError() {
    audioOutput.hidden = true;
    noAudioMessage.hidden = false;
    noAudioMessage.textContent = "An error occured.";
}

async function sendData() {
    // Associate the FormData object with the form element
    const formData = new FormData(document.getElementById("form"));

    try {
        noAudioMessage.hidden = true;
        outputLoader.hidden = false;
        audioOutput.hidden = true;
        convertBtn.disabled = true;

        const response = await fetch(apiUrl + "/infer", {
            method: "POST",
            // Set the FormData instance as the request body
            body: formData,
        });

        if (response.ok) {
            // Assuming the response is an audio file
            const audioBlob = await response.blob();            

            // Set the audio source with the blob data
            audioOutput.src = URL.createObjectURL(audioBlob);

            // Add controls to the audio element
            audioOutput.controls = true;

            // Show the audio element
            audioOutput.hidden = false;
        } else {
            console.error('Failed to send data to the API');
            onError();
        }
    } catch (e) {
        console.error(e);
        onError();
    }

    convertBtn.disabled = false;
    outputLoader.hidden = true;
}

// Call the function to populate dropdown options
populateModelDropdown();

const audioOutput = document.getElementById("audio-output");
const noAudioMessage = document.getElementById("no-output-message");
const outputLoader = document.getElementById("output-loader");
const form = document.getElementById("form");
const convertBtn = document.getElementById("convert");

// Take over form submission
form.addEventListener("submit", (event) => {
    event.preventDefault();
    sendData();
});