#include <algorithm>
#include <cmath>
#include <cctype>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <numeric>
#include <sstream>
#include <string>
#include <unordered_map>
#include <vector>

struct AnalysisResult {
    int totalWords = 0;
    int totalSentences = 0;
    double meanSentenceLength = 0.0;
    double stdDevSentenceLength = 0.0;
    double burstiness = 0.0;
    double ttr = 0.0;
    double aiProbability = 0.0;
    std::string verdict;
};

std::string cleanWord(const std::string& text) {
    std::string result;
    result.reserve(text.size());

    for (unsigned char ch : text) {
        if (std::isalnum(ch)) {
            result.push_back(static_cast<char>(std::tolower(ch)));
        }
    }

    return result;
}

std::vector<std::string> splitSentences(const std::string& text) {
    std::vector<std::string> sentences;
    std::string current;

    for (char ch : text) {
        current += ch;
        if (ch == '.' || ch == '!' || ch == '?') {
            if (current.size() > 5) {
                sentences.push_back(current);
            }
            current.clear();
        }
    }

    if (!current.empty() && current.size() > 5) {
        sentences.push_back(current);
    }

    return sentences;
}

std::vector<std::string> tokenizeWords(const std::string& text) {
    std::vector<std::string> words;
    std::stringstream ss(text);
    std::string token;

    while (ss >> token) {
        std::string cleaned = cleanWord(token);
        if (!cleaned.empty()) {
            words.push_back(cleaned);
        }
    }

    return words;
}

AnalysisResult analyzeText(const std::string& text) {
    AnalysisResult result;

    const std::vector<std::string> sentences = splitSentences(text);
    result.totalSentences = static_cast<int>(sentences.size());

    const std::vector<std::string> words = tokenizeWords(text);
    result.totalWords = static_cast<int>(words.size());

    if (result.totalSentences == 0 || result.totalWords == 0) {
        result.verdict = "Not enough text to analyze";
        return result;
    }

    std::vector<int> sentenceLengths;
    sentenceLengths.reserve(sentences.size());

    for (const std::string& sentence : sentences) {
        std::stringstream ss(sentence);
        std::string word;
        int count = 0;
        while (ss >> word) {
            ++count;
        }
        if (count > 0) {
            sentenceLengths.push_back(count);
        }
    }

    if (sentenceLengths.empty()) {
        result.verdict = "Sentence analysis failed";
        return result;
    }

    double sumLength = 0.0;
    for (int len : sentenceLengths) {
        sumLength += len;
    }

    result.meanSentenceLength = sumLength / static_cast<double>(sentenceLengths.size());

    double variance = 0.0;
    for (int len : sentenceLengths) {
        double diff = static_cast<double>(len) - result.meanSentenceLength;
        variance += diff * diff;
    }
    result.stdDevSentenceLength = std::sqrt(variance / static_cast<double>(sentenceLengths.size()));
    result.burstiness = result.stdDevSentenceLength / (result.meanSentenceLength > 0.0 ? result.meanSentenceLength : 1.0);

    std::unordered_map<std::string, int> wordFrequency;
    for (const std::string& word : words) {
        ++wordFrequency[word];
    }

    double uniqueWords = static_cast<double>(wordFrequency.size());
    result.ttr = uniqueWords / static_cast<double>(words.size());

    double aiScore = 0.0;

    if (result.burstiness < 0.30) {
        aiScore += 50.0;
    } else if (result.burstiness < 0.45) {
        aiScore += 25.0;
    }

    if (result.ttr < 0.45) {
        aiScore += 40.0;
    } else if (result.ttr < 0.60) {
        aiScore += 20.0;
    }

    if (result.totalWords < 20) {
        aiScore += 8.0;
    }

    result.aiProbability = std::clamp(aiScore, 5.0, 98.0);

    if (result.aiProbability >= 65.0) {
        result.verdict = "LIKELY AI-GENERATED";
    } else if (result.aiProbability >= 40.0) {
        result.verdict = "MIXED / REVISED CONTENT";
    } else {
        result.verdict = "LIKELY HUMAN-WRITTEN";
    }

    return result;
}

void printReport(const AnalysisResult& result) {
    std::cout << "\n=========================================" << std::endl;
    std::cout << "         AI TEXT CHECKER REPORT          " << std::endl;
    std::cout << "=========================================" << std::endl;
    std::cout << " Total Words Analyzed      : " << result.totalWords << std::endl;
    std::cout << " Total Sentences           : " << result.totalSentences << std::endl;
    std::cout << " Mean Sentence Length      : " << std::fixed << std::setprecision(2) << result.meanSentenceLength << std::endl;
    std::cout << " Sentence Length Std Dev   : " << result.stdDevSentenceLength << std::endl;
    std::cout << " Burstiness Metric         : " << result.burstiness << " (Lower = more AI-like)" << std::endl;
    std::cout << " Vocabulary Diversity (TTR): " << result.ttr << " (Lower = more predictable)" << std::endl;
    std::cout << "-----------------------------------------" << std::endl;
    std::cout << " Estimated AI Probability  : " << std::fixed << std::setprecision(1) << result.aiProbability << "%" << std::endl;
    std::cout << " Verdict                   : " << result.verdict << std::endl;
    std::cout << "=========================================" << std::endl;
}

std::string readTextFromFile(const std::string& filePath) {
    std::ifstream input(filePath);
    if (!input.is_open()) {
        throw std::runtime_error("Unable to open file: " + filePath);
    }

    std::stringstream buffer;
    buffer << input.rdbuf();
    return buffer.str();
}

int main(int argc, char* argv[]) {
    std::cout << "AI Checker App" << std::endl;
    std::cout << "============================" << std::endl;

    std::string textToAnalyze;

    if (argc > 1) {
        std::string option = argv[1];

        if (option == "--help" || option == "-h") {
            std::cout << "Usage:" << std::endl;
            std::cout << "  ai_checker.exe <file.txt>" << std::endl;
            std::cout << "  ai_checker.exe --text \"your text here\"" << std::endl;
            std::cout << "  ai_checker.exe --demo" << std::endl;
            return 0;
        }

        if (option == "--demo") {
            textToAnalyze = "Artificial intelligence is increasingly used to generate content, answer questions, and assist with writing. Many systems rely on predictive language patterns, repetitive sentence structures, and broad vocabulary coverage. Because of these patterns, AI-generated writing often feels consistent, smooth, and highly predictable when compared with more varied human expression. However, not every automated text is easy to detect, and some writing blends human intent with machine assistance.";
        } else if (option == "--text" && argc > 2) {
            textToAnalyze = argv[2];
            for (int i = 3; i < argc; ++i) {
                textToAnalyze += " ";
                textToAnalyze += argv[i];
            }
        } else {
            try {
                textToAnalyze = readTextFromFile(option);
            } catch (const std::exception& ex) {
                std::cerr << ex.what() << std::endl;
                return 1;
            }
        }
    } else {
        std::cout << "Choose an option:" << std::endl;
        std::cout << "1. Paste text" << std::endl;
        std::cout << "2. Analyze a file" << std::endl;
        std::cout << "3. Use demo text" << std::endl;
        std::cout << "Enter choice: ";

        int choice = 0;
        std::cin >> choice;
        std::cin.ignore();

        switch (choice) {
            case 1: {
                std::cout << "Enter/Paste text below and press Ctrl+Z (Windows) or Ctrl+D (Linux/Mac) on a new line to finish:" << std::endl;
                std::string line;
                while (std::getline(std::cin, line)) {
                    textToAnalyze += line + '\n';
                }
                break;
            }
            case 2: {
                std::cout << "Enter file path: ";
                std::string filePath;
                std::getline(std::cin, filePath);
                try {
                    textToAnalyze = readTextFromFile(filePath);
                } catch (const std::exception& ex) {
                    std::cerr << ex.what() << std::endl;
                    return 1;
                }
                break;
            }
            case 3:
                textToAnalyze = "Human writing often varies in rhythm, tone, and sentence structure because it reflects lived experience, emotion, and attention to context. An individual may switch between short direct statements and longer reflective thoughts, creating a distinctive voice that feels less uniform than formulaic generated prose. This variation makes human text harder to reduce to a single pattern, even when it is polished and concise.";
                break;
            default:
                std::cout << "Invalid choice. Exiting." << std::endl;
                return 0;
        }
    }

    if (textToAnalyze.empty()) {
        std::cout << "No text provided. Nothing to analyze." << std::endl;
        return 0;
    }

    AnalysisResult report = analyzeText(textToAnalyze);
    printReport(report);

    return 0;
}