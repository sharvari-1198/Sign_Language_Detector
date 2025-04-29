let webcamStream;
let isWebcamActive = false;

const cameraBtn = document.getElementById('cameraBtn');
const uploadBtn = document.getElementById('uploadBtn');
const cameraSection = document.getElementById('cameraSection');
const uploadSection = document.getElementById('uploadSection');
const webcam = document.getElementById('webcam');
const previewImage = document.getElementById('previewImage');
const loading = document.getElementById('loading');

// Class labels (index to letter)
const labels = [
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
  "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T",
  "U", "V", "W", "X", "Y", "Z"
];

// Show loading spinner when model is being loaded
async function loadModel() {
  loading.classList.remove('hidden');  // Show loading spinner
  try {
    // Correct model path using raw GitHub URL
    const modelUrl = 'https://raw.githubusercontent.com/sharvari-1198/Sign_Language_Detector/main/sign_language_model.pkl';  

    const response = await fetch(modelUrl);
    if (!response.ok) {
      throw new Error(`Model failed to load with status: ${response.status}`);
    }

    console.log("✅ Model loaded!");
  } catch (error) {
    console.error('Model loading error:', error);
    alert("Error loading model: " + error.message);
  } finally {
    loading.classList.add('hidden');  // Hide loading spinner
  }
}

loadModel();  // Call the function to load the model when page is loaded

// Show camera interface
cameraBtn.addEventListener('click', async () => {
  cameraSection.classList.remove('hidden');
  uploadSection.classList.add('hidden');
  stopWebcam();

  try {
    webcamStream = await navigator.mediaDevices.getUserMedia({ video: true });
    webcam.srcObject = webcamStream;
    isWebcamActive = true;
    predictCamera();
  } catch (err) {
    console.error("Camera error:", err);
    alert("Could not access camera.");
  }
});

// Show upload interface
uploadBtn.addEventListener('click', () => {
  uploadSection.classList.remove('hidden');
  cameraSection.classList.add('hidden');
  stopWebcam();
});

// Stop webcam stream
function stopWebcam() {
  if (webcamStream) {
    webcamStream.getTracks().forEach(track => track.stop());
    isWebcamActive = false;
  }
}

// Predict from webcam feed
async function predictCamera() {
  if (!isWebcamActive) return;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 224;
  canvas.height = 224;

  setInterval(async () => {
    if (!isWebcamActive) return;

    ctx.drawImage(webcam, 0, 0, 224, 224);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));

    const formData = new FormData();
    formData.append('image', blob, 'frame.jpg');

    try {
      const res = await fetch('https://sign-language-detector-nine.vercel.app/predict', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        console.log('Response data:', data); // Log the response for debugging
        if (data.prediction !== undefined) {
          // Assuming prediction is a number (index of the labels array)
          const predictedLabel = labels[data.prediction];
          document.getElementById('cameraPrediction').innerText = `Prediction: ${predictedLabel}`;
        } else {
          console.error('No prediction key in the response');
          document.getElementById('cameraPrediction').innerText = `Prediction: Error`;
        }
      } else {
        console.error('Prediction request failed with status:', res.status);
        document.getElementById('cameraPrediction').innerText = `Prediction: Error`;
      }
    } catch (err) {
      console.error('Prediction error:', err);
      document.getElementById('cameraPrediction').innerText = `Prediction: Error`;
    }
  }, 1000); // predict every second
}

// Predict from uploaded image
document.getElementById('imageInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  previewImage.src = URL.createObjectURL(file);

  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch('https://sign-language-detector-nine.vercel.app/predict', {
      method: 'POST',
      body: formData
    });
    const result = await response.json();

    if (result.prediction !== undefined) {
      // Assuming prediction is a number (index of the labels array)
      const predictedLabel = labels[result.prediction];
      document.getElementById('uploadPrediction').innerText = `Prediction: ${predictedLabel}`;
    } else {
      document.getElementById('uploadPrediction').innerText = `Prediction: Error`;
    }
  } catch (err) {
    console.error('Upload prediction error:', err);
    document.getElementById('uploadPrediction').innerText = `Prediction: Error`;
  }
});
