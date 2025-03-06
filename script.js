class ConversationManager {
    constructor() {
        this.conversationData = null;
        this.currentNode = null;
        this.conversationHistory = document.getElementById('conversation-history');
        this.completedTests = new Set();
        this.completedTestDiscussions = new Set();
        this.mainDialogueCompleted = false;
        this.visitedNodes = new Set();
        this.init();
    }

    async init() {
        try {
            // Load conversation data from the JSON file
            const response = await fetch('conversation-data.json');
            this.conversationData = await response.json();
            
            // Set up patient information
            this.setupPatientInfo();
            
            // Set up test buttons
            this.setupTestButtons();
            
            // Set up modal
            this.setupModal();
            
            // Start the conversation
            this.startConversation();
        } catch (error) {
            console.error('Error loading conversation data:', error);
            this.showError('Failed to load conversation data. Please try again later.');
        }
    }

    setupPatientInfo() {
        const patient = this.conversationData.patient;
        document.getElementById('patient-name').textContent = patient.name;
        document.getElementById('patient-age').textContent = `${patient.age} years old`;
    }

    setupTestButtons() {
        console.log('Setting up test buttons');
        const testButtonsContainer = document.querySelector('.test-buttons');
        
        // Create a button for each test in the JSON data
        Object.entries(this.conversationData.tests).forEach(([testId, test]) => {
            console.log('Creating button for test:', testId);
            const button = document.createElement('button');
            button.className = 'test-button';
            button.dataset.test = testId;
            button.textContent = test.name;
            
            // Initially disable all test buttons
            button.disabled = true;
            button.classList.add('locked');
            
            button.addEventListener('click', () => this.handleTestOrder(testId));
            testButtonsContainer.appendChild(button);
        });
    }

    setupModal() {
        const modal = document.getElementById('test-modal');
        const closeBtn = document.querySelector('.close-modal');
        const closeTestBtn = document.getElementById('close-test-results');

        closeBtn.onclick = () => this.handleModalClose();
        closeTestBtn.onclick = () => this.handleModalClose();

        window.onclick = (event) => {
            if (event.target === modal) {
                this.handleModalClose();
            }
        };
    }

    handleTestOrder(testId) {
        console.log('Test order clicked:', testId);
        const test = this.conversationData.tests[testId];
        if (!test) {
            console.error('Test not found:', testId);
            return;
        }

        // Mark test as completed
        this.completedTests.add(testId);
        const button = document.querySelector(`[data-test="${testId}"]`);
        if (button) {
            button.classList.add('completed');
            button.disabled = true;
            console.log('Test button updated:', testId);
        } else {
            console.error('Test button not found:', testId);
        }

        // Show test results
        this.showTestResults(test.results, testId);

        // Add new dialogue options if available
        if (test.results.unlocks_dialogue) {
            console.log('Adding dialogue options:', test.results.unlocks_dialogue);
            this.addNewDialogueOptions(test.results.unlocks_dialogue);
        }
    }

    showTestResults(results, testId) {
        const modal = document.getElementById('test-modal');
        const title = document.getElementById('test-title');
        const content = document.getElementById('test-results');
        const closeBtn = document.getElementById('close-test-results');

        title.textContent = results.title;
        content.innerHTML = results.content.replace(/\n/g, '<br>');
        modal.style.display = "block";

        // Store the test ID for use in the close handler
        closeBtn.dataset.testId = testId;
    }

    handleModalClose() {
        const modal = document.getElementById('test-modal');
        const closeBtn = document.getElementById('close-test-results');
        const testId = closeBtn.dataset.testId;

        if (testId) {
            const test = this.conversationData.tests[testId];
            if (test && test.results.unlocks_dialogue) {
                const dialogueId = test.results.unlocks_dialogue[0];
                const dialogueNode = this.conversationData.conversation[dialogueId];
                
                if (dialogueNode) {
                    // Update the patient message
                    this.addMessage(dialogueNode.patient_message, true);
                    
                    // Update the dialogue options
                    this.displayOptions(dialogueNode.options);
                }
            }
        }

        modal.style.display = "none";
        closeBtn.dataset.testId = "";
    }

    addNewDialogueOptions(dialogueIds) {
        console.log('Adding new dialogue options for:', dialogueIds);
        
        // Handle both single string and array of strings
        const ids = Array.isArray(dialogueIds) ? dialogueIds : [dialogueIds];
        const optionsContainer = document.getElementById('response-options');
        
        ids.forEach(dialogueId => {
            const testId = dialogueId.split('_results')[0];
            console.log('Extracted test ID:', testId);
            
            const test = this.conversationData.tests[testId];
            if (!test) {
                console.error('Test not found:', testId);
                return;
            }

            const testName = test.name;
            console.log('Found test:', testName);

            const button = document.createElement('button');
            button.className = 'dialogue-option';
            button.textContent = `View ${testName} Results`;
            button.onclick = () => this.showTestResults(test.results, testId);
            optionsContainer.appendChild(button);
            this.scrollToBottom();
        });
    }

    startConversation() {
        this.currentNode = this.conversationData.conversation.start;
        this.displayCurrentNode();
    }

    displayCurrentNode() {
        // Add patient's message to the conversation history
        this.addMessage(this.currentNode.patient_message, true);  // true for patient message
        
        // Display doctor's response options
        this.displayOptions(this.currentNode.options);
    }

    displayOptions(options) {
        const optionsContainer = document.getElementById('response-options');
        
        // Clear only the non-test-result options
        const testResultOptions = optionsContainer.querySelectorAll('.test-result-option');
        optionsContainer.innerHTML = '';
        
        // Add back the test result options
        testResultOptions.forEach(option => optionsContainer.appendChild(option));

        // Add the current conversation options
        options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'option-button';
            button.textContent = option.text;
            button.onclick = () => this.handleOptionSelection(option);
            optionsContainer.appendChild(button);
        });
    }

    handleOptionSelection(option) {
        console.log('Option selected:', option);
        // Add doctor's message to the conversation history
        this.addMessage(option.text, false);  // false for doctor message
        
        // If this was a test discussion, mark it as completed
        if (option.isTestDiscussion) {
            console.log('Test discussion completed:', option.next);
            this.completedTestDiscussions.add(option.next);
            const button = document.querySelector(`[data-dialogue-id="${option.next}"]`);
            if (button) {
                button.remove();
            }
        }
        
        // Move to the next conversation node
        this.currentNode = this.conversationData.conversation[option.next];
        console.log('Next node:', this.currentNode);
        
        if (this.currentNode) {
            // Mark this node as visited
            this.visitedNodes.add(this.currentNode.id);
            // Check for newly unlocked tests
            this.checkForUnlockedTests();
            this.displayCurrentNode();
        } else {
            // Check if this was the end of the main dialogue
            if (!option.isTestDiscussion) {
                this.mainDialogueCompleted = true;
            }
            this.checkConsultationCompletion();
        }
    }

    checkForUnlockedTests() {
        const testButtons = document.querySelectorAll('.test-button');
        testButtons.forEach(button => {
            const testId = button.dataset.test;
            const test = this.conversationData.tests[testId];
            
            // If test is already completed or visited its unlock node, skip
            if (this.completedTests.has(testId) || this.visitedNodes.has(test.unlocks_at)) {
                button.disabled = false;
                button.classList.remove('locked');
            } else {
                button.disabled = true;
                button.classList.add('locked');
            }
        });
    }

    checkConsultationCompletion() {
        // Check if all tests are completed and main dialogue is finished
        const allTestsCompleted = this.completedTests.size === Object.keys(this.conversationData.tests).length;
        const allTestDiscussionsCompleted = this.completedTestDiscussions.size === Object.keys(this.conversationData.tests).length;
        
        if (this.mainDialogueCompleted && allTestsCompleted && allTestDiscussionsCompleted) {
            this.endConsultation();
        } else if (this.mainDialogueCompleted) {
            // If main dialogue is done but tests remain, show a message about remaining tests
            const optionsContainer = document.getElementById('response-options');
            optionsContainer.innerHTML = `
                <p class="end-message">Main consultation completed. You can still review test results and discuss them with the patient.</p>
            `;
        }
    }

    endConsultation() {
        const optionsContainer = document.getElementById('response-options');
        optionsContainer.innerHTML = `
            <p class="end-message">Consultation completed. All tests have been reviewed and discussed.</p>
        `;
    }

    addMessage(message, isPatient = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isPatient ? 'patient-message' : 'doctor-message'}`;
        messageDiv.textContent = message;
        this.conversationHistory.appendChild(messageDiv);
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.conversationHistory.scrollTop = this.conversationHistory.scrollHeight;
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message error-message';
        errorDiv.textContent = message;
        this.conversationHistory.appendChild(errorDiv);
        this.scrollToBottom();
    }
}

// Initialize the conversation when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ConversationManager();
});