// Import required modules
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { spawn } = require('child_process');

// Create Express app
const app = express();

// Enable CORS for all routes
app.use(cors());

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Set up Multer for handling file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
})
const upload = multer({ storage: storage });

// LOCAL CONFIGURATION
const weights_directory = "../RVC/assets/weights";
const infer_script = "../RVC/tools/simple_infer.py"

// Define a sample route
app.get('/models', (req, res) => {
    res.json(getFilenamesWithoutExtensions(weights_directory));
});

// Handle form data with audio file and name
app.post('/infer', upload.fields([{ name: 'audio_file', maxCount: 1 }, { name: 'model_name', maxCount: 1 }]), (req, res) => {
    const audioFile = req.files['audio_file'][0];
    const modelName = req.body['model_name'];

    let audioFilePath = path.join(__dirname, audioFile.path)
    let outputFilePath = path.join(__dirname, "output", audioFile.filename)
    const command = `python ${infer_script} ${modelName} ${audioFilePath} ${outputFilePath}`;

    const pythonProcess = spawn('python3', [infer_script, "--model_name", modelName, "--input_path", audioFilePath, "--output_path", outputFilePath], { cwd: "../RVC" });

    pythonProcess.stdout.on('data', (data) => {
        console.log(`Script output: ${data}`);
    });
    
    pythonProcess.stderr.on('data', (data) => {
        console.error(`Script error: ${data}`);

        // Send an error response
        // res.status(500).send('Internal Server Error');
    });
    
    pythonProcess.on('close', (code) => {
        console.log(`Script exited with code ${code}`);

        if (code == 0) {
            res.sendFile(outputFilePath);
        } else {
            // Send an error response if the script exits with a non-zero code
            res.status(500).send('Internal Server Error');
        }
    });
});

// Set up the server to listen on port 3000
const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

function getFilenamesWithoutExtensions(directoryPath) {
    // Read the contents of the specified directory
    const files = fs.readdirSync(directoryPath);

    // Filter out filenames without extensions
    const filenamesWithoutExtensions = files.filter((file) => {
        return path.extname(file) === '.pth';
    }).map((file) => {
        const fileNameWithoutExt = path.parse(file).name;
        return fileNameWithoutExt;
    });

    const sortedFilenames = filenamesWithoutExtensions.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    return sortedFilenames;
};
