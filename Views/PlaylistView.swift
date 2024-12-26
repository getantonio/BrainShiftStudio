struct PlaylistView: View {
    let recordings: [AudioManager.Recording]
    @State private var isShuffling = false
    @State private var isLooping = false
    
    var body: some View {
        List {
            ForEach(recordings) { recording in
                RecordingRow(recording: recording)
            }
        }
        .toolbar {
            ToolbarItemGroup(placement: .bottomBar) {
                Button(action: { isShuffling.toggle() }) {
                    Image(systemName: isShuffling ? "shuffle.circle.fill" : "shuffle")
                }
                
                Button(action: { isLooping.toggle() }) {
                    Image(systemName: isLooping ? "repeat.circle.fill" : "repeat")
                }
            }
        }
    }
}

struct RecordingRow: View {
    let recording: AudioManager.Recording
    
    var body: some View {
        HStack {
            Text(recording.name)
            Spacer()
            Button(action: {
                // Play/pause logic
            }) {
                Image(systemName: recording.isPlaying ? "pause.circle.fill" : "play.circle.fill")
            }
        }
    }
} 