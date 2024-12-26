struct Affirmation: Identifiable, Codable {
    let id: String
    let text: String
    let category: String
}

struct AffirmationCategory: Identifiable, Codable {
    let id: String
    let name: String
    let keywords: [String]
    let affirmations: [Affirmation]
} 