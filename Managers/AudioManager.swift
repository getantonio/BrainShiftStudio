import AVFoundation

class AudioManager: NSObject, ObservableObject {
    @Published var isRecording = false
    @Published var audioRecorder: AVAudioRecorder?
    @Published var audioPlayer: AVAudioPlayer?
    @Published var recordings: [Recording] = []
    
    private var recordingSession: AVAudioSession?
    
    struct Recording: Identifiable, Codable {
        let id: UUID
        let url: URL
        let name: String
        let duration: TimeInterval
        var isPlaying: Bool = false
    }
    
    override init() {
        super.init()
        setupSession()
    }
    
    private func setupSession() {
        do {
            recordingSession = AVAudioSession.sharedInstance()
            try recordingSession?.setCategory(.playAndRecord, mode: .default)
            try recordingSession?.setActive(true)
        } catch {
            print("Failed to set up recording session: \(error)")
        }
    }
    
    func startRecording(name: String) {
        let audioFilename = getDocumentsDirectory().appendingPathComponent("\(name).m4a")
        
        let settings = [
            AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 44100,
            AVNumberOfChannelsKey: 2,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
        ]
        
        do {
            audioRecorder = try AVAudioRecorder(url: audioFilename, settings: settings)
            audioRecorder?.delegate = self
            audioRecorder?.record()
            isRecording = true
        } catch {
            print("Could not start recording: \(error)")
        }
    }
    
    func stopRecording() {
        audioRecorder?.stop()
        isRecording = false
    }
    
    private func getDocumentsDirectory() -> URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
    }
}

extension AudioManager: AVAudioRecorderDelegate {
    func audioRecorderDidFinishRecording(_ recorder: AVAudioRecorder, successfully flag: Bool) {
        if flag {
            let recording = Recording(
                id: UUID(),
                url: recorder.url,
                name: recorder.url.deletingPathExtension().lastPathComponent,
                duration: recorder.currentTime
            )
            recordings.append(recording)
        }
    }
} 