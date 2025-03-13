// Initialize Socket.IO
const socket = io();

// Initialize required variables
let localStream = null;
let peerConnection = null;
let mediaRecorder = null;
let recordedChunks = [];
let isConnected = false;

// WebRTC configuration
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
    ]
};

// DOM Elements
const messageInput = document.querySelector('input[type="text"]');
const sendButton = document.querySelector('.fa-paper-plane').parentElement;
const messagesContainer = document.getElementById('messages');
const callModal = document.getElementById('callModal');
const voiceCallButton = document.querySelector('[title="Voice Call"]');
const videoCallButton = document.querySelector('[title="Video Call"]');
const voiceNoteButton = document.querySelector('[title="Voice Note"]');
const videoNoteButton = document.querySelector('[title="Video Note"]');
const imageButton = document.querySelector('[title="Send Image"]');

// Socket.IO event handlers
socket.on('connect', () => {
    console.log('Connected to server');
    isConnected = true;
    addSystemMessage('Connected to chat server');
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    isConnected = false;
    addSystemMessage('Disconnected from chat server');
});

socket.on('chat message', (msg) => {
    addMessage(msg, true);
});

// Message handling
function addMessage(content, isReceived = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `flex ${isReceived ? 'justify-start' : 'justify-end'} mb-4`;
    
    messageDiv.innerHTML = `
        <div class="max-w-2/3 ${isReceived ? 'bg-gray-100' : 'bg-blue-500 text-white'} rounded-lg px-4 py-2">
            ${content}
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addSystemMessage(content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex justify-center mb-4';
    
    messageDiv.innerHTML = `
        <div class="bg-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600">
            ${content}
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Send message
sendButton.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (message && isConnected) {
        socket.emit('chat message', message);
        addMessage(message);
        messageInput.value = '';
    }
});

// Handle Enter key
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendButton.click();
    }
});

// Voice/Video Call handling
async function startCall(isVideo = false) {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: isVideo
        });

        // In a real app, you would:
        // 1. Create RTCPeerConnection
        // 2. Add tracks to the connection
        // 3. Create and send offer to the other peer
        // 4. Handle answer and ICE candidates

        // For demo, we'll just show a local preview
        const previewModal = document.createElement('div');
        previewModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center';
        
        const videoElement = document.createElement('video');
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        videoElement.srcObject = localStream;
        videoElement.className = 'rounded-lg max-w-2xl';

        const controls = document.createElement('div');
        controls.className = 'absolute bottom-4 flex space-x-4';
        controls.innerHTML = `
            <button class="p-4 rounded-full bg-red-500 text-white hover:bg-red-600">
                <i class="fas fa-phone-slash"></i>
            </button>
        `;

        previewModal.appendChild(videoElement);
        previewModal.appendChild(controls);
        document.body.appendChild(previewModal);

        controls.querySelector('button').addEventListener('click', () => {
            localStream.getTracks().forEach(track => track.stop());
            previewModal.remove();
        });

    } catch (error) {
        console.error('Error accessing media devices:', error);
        alert('Could not access camera/microphone');
    }
}

voiceCallButton.addEventListener('click', () => startCall(false));
videoCallButton.addEventListener('click', () => startCall(true));

// Voice Note handling
let isRecordingVoice = false;
voiceNoteButton.addEventListener('click', async () => {
    try {
        if (!isRecordingVoice) {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            recordedChunks = [];

            mediaRecorder.addEventListener('dataavailable', (e) => {
                if (e.data.size > 0) recordedChunks.push(e.data);
            });

            mediaRecorder.addEventListener('stop', () => {
                const audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                
                // Add audio message to chat
                const audioElement = `
                    <audio controls class="max-w-full">
                        <source src="${audioUrl}" type="audio/webm">
                    </audio>
                `;
                addMessage(audioElement);

                stream.getTracks().forEach(track => track.stop());
            });

            mediaRecorder.start();
            voiceNoteButton.innerHTML = '<i class="fas fa-stop text-red-500"></i>';
            isRecordingVoice = true;
        } else {
            mediaRecorder.stop();
            voiceNoteButton.innerHTML = '<i class="fas fa-microphone text-gray-600"></i>';
            isRecordingVoice = false;
        }
    } catch (error) {
        console.error('Error recording voice note:', error);
        alert('Could not access microphone');
    }
});

// Video Note handling
let isRecordingVideo = false;
videoNoteButton.addEventListener('click', async () => {
    try {
        if (!isRecordingVideo) {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            mediaRecorder = new MediaRecorder(stream);
            recordedChunks = [];

            // Create preview element
            const previewVideo = document.createElement('video');
            previewVideo.autoplay = true;
            previewVideo.playsInline = true;
            previewVideo.srcObject = stream;
            previewVideo.className = 'fixed bottom-20 right-4 w-64 rounded-lg';
            document.body.appendChild(previewVideo);

            mediaRecorder.addEventListener('dataavailable', (e) => {
                if (e.data.size > 0) recordedChunks.push(e.data);
            });

            mediaRecorder.addEventListener('stop', () => {
                const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
                const videoUrl = URL.createObjectURL(videoBlob);
                
                // Add video message to chat
                const videoElement = `
                    <video controls class="max-w-full rounded-lg">
                        <source src="${videoUrl}" type="video/webm">
                    </video>
                `;
                addMessage(videoElement);

                stream.getTracks().forEach(track => track.stop());
                previewVideo.remove();
            });

            mediaRecorder.start();
            videoNoteButton.innerHTML = '<i class="fas fa-stop text-red-500"></i>';
            isRecordingVideo = true;
        } else {
            mediaRecorder.stop();
            videoNoteButton.innerHTML = '<i class="fas fa-video text-gray-600"></i>';
            isRecordingVideo = false;
        }
    } catch (error) {
        console.error('Error recording video note:', error);
        alert('Could not access camera/microphone');
    }
});

// Image handling
imageButton.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageElement = `
                    <img src="${e.target.result}" alt="Shared image" class="max-w-full rounded-lg">
                `;
                addMessage(imageElement);
            };
            reader.readAsDataURL(file);
        }
    });
    
    input.click();
});

// Add some initial messages for demo
setTimeout(() => {
    addMessage('Hey there! 💖', true);
}, 1000);
