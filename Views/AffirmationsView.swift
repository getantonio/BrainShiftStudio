import SwiftUI

struct AffirmationsView: View {
    @StateObject private var audioManager = AudioManager()
    @State private var selectedCategory: String = "all"
    @State private var currentAffirmations: [Affirmation] = []
    @State private var recordingName: String = ""
    
    var body: some View {
        NavigationView {
            VStack {
                // Category Picker
                Picker("Category", selection: $selectedCategory) {
                    Text("All Categories").tag("all")
                    ForEach(AffirmationCategories.allCategories) { category in
                        Text(category.name).tag(category.id)
                    }
                }
                .pickerStyle(.menu)
                .padding()
                
                // Current Affirmations
                ScrollView {
                    VStack(spacing: 12) {
                        ForEach(currentAffirmations) { affirmation in
                            AffirmationCard(text: affirmation.text)
                        }
                    }
                    .padding()
                }
                
                // Recording Controls
                VStack {
                    if audioManager.isRecording {
                        WaveformView() // Custom waveform visualization
                            .frame(height: 60)
                    }
                    
                    HStack {
                        TextField("Recording name", text: $recordingName)
                            .textFieldStyle(.roundedBorder)
                        
                        Button(action: {
                            if audioManager.isRecording {
                                audioManager.stopRecording()
                            } else {
                                audioManager.startRecording(name: recordingName)
                            }
                        }) {
                            Image(systemName: audioManager.isRecording ? "stop.circle.fill" : "record.circle")
                                .font(.largeTitle)
                                .foregroundColor(audioManager.isRecording ? .red : .accentColor)
                        }
                    }
                    .padding()
                }
                
                // Playlist
                PlaylistView(recordings: audioManager.recordings)
            }
            .navigationTitle("Affirmations")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Refresh") {
                        refreshAffirmations()
                    }
                }
            }
        }
        .onAppear {
            refreshAffirmations()
        }
    }
    
    private func refreshAffirmations() {
        currentAffirmations = AffirmationGenerator.getRandomAffirmations(
            category: selectedCategory,
            count: 5
        )
    }
}

struct AffirmationCard: View {
    let text: String
    
    var body: some View {
        Text(text)
            .padding()
            .frame(maxWidth: .infinity)
            .background(Color.accentColor.opacity(0.1))
            .cornerRadius(10)
    }
} 