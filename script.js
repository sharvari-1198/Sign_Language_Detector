let webcamStream;
let isWebcamActive = false;

const cameraBtn = document.getElementById('cameraBtn');
const uploadBtn = document.getElementById('uploadBtn');
const cameraSection = document.getElementById('cameraSection');
const uploadSection = document.getElementById('uploadSection');
const webcam = document.getElementById('webcam');
const previewImage = document.getElementById('previewImage');
const loading = document.getElementById('loading');

// Show loading spinner when model is being loaded
async function loadModel() {
  loading.classList.remove('hidden');  // Show loading spinner
  try {
    // Load the model from GitHub directly or your storage URL
    await fetch('https://your-github-url/model/model.json');
    console.log("✅ Model loaded!");
  } catch (error) {
    console.error('Model loading error:', error);
    alert("Error loading model");
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
      const res = await fetch('https://your-flask-api-url/predict', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      document.getElementById('cameraPrediction').innerText = `Prediction: ${data.prediction}`;
    } catch (err) {
      console.error('Prediction error:', err);
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
    const response = await fetch('https://your-flask-api-url/predict', {
      method: 'POST',
      body: formData
    });
    const result = await response.json();
    document.getElementById('uploadPrediction').innerText = `Prediction: ${result.prediction}`;
  } catch (err) {
    console.error('Upload prediction error:', err);
    document.getElementById('uploadPrediction').innerText = `Prediction: Error`;
  }
});
