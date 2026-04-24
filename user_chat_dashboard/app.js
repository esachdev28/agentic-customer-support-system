const SUPABASE_URL = 'https://mbnaqqycyohsaechkpfm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibmFxcXljeW9oc2FlY2hrcGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODc2NjgsImV4cCI6MjA5MjI2MzY2OH0.lnCpPPa2iEGIfbTHOAlzw_F4L2SPEDAPCv3pQWMS1vI';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const WEBHOOK_URL = 'https://palak-bhullar.app.n8n.cloud/webhook/support-query';

// DOM Elements
const sidebarList = document.getElementById('history-list');
const newChatBtn = document.getElementById('new-chat-btn');
const clearHistoryBtn = document.getElementById('clear-history-btn');

const messagesContainer = document.getElementById('customer-messages');
const customerInput = document.getElementById('customer-input');
const customerSendBtn = document.getElementById('customer-send');
const violationMessage = document.getElementById('violation-message');

const agentPanel = document.getElementById('agent-panel');
const agentNotification = document.getElementById('agent-notification');
const agentInput = document.getElementById('agent-input');
const agentSendBtn = document.getElementById('agent-send');
const agentIdleContent = document.getElementById('agent-idle-content');
const chatStatusIndicator = document.getElementById('chat-status-indicator');
const closeConversationBtn = document.getElementById('close-conversation-btn');

// Modal Elements
const modalOverlay = document.getElementById('custom-modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const modalConfirmBtn = document.getElementById('modal-confirm-btn');

// Global State
let allMessages = [];
let chatSessions = [];
let activeSessionId = null;
let currentWarningCount = 0;
let isChatClosed = false;

// --- Session Management ---

const loadSessions = () => {
    const stored = localStorage.getItem('support_chat_sessions');
    if (stored) {
        chatSessions = JSON.parse(stored);
    }
    
    if (chatSessions.length === 0) {
        createNewSession();
    } else {
        // Select the most recent session
        selectSession(chatSessions[chatSessions.length - 1].id);
    }
    renderSidebar();
};

const saveSessions = () => {
    localStorage.setItem('support_chat_sessions', JSON.stringify(chatSessions));
};

const createNewSession = () => {
    const nowISO = new Date().toISOString();
    
    // Cap the previous session if any
    if (chatSessions.length > 0) {
        const lastSession = chatSessions[chatSessions.length - 1];
        if (!lastSession.endTime) {
            lastSession.endTime = nowISO;
        }
    }

    const newSession = {
        id: Date.now().toString(),
        title: `Chat Session ${chatSessions.length + 1}`,
        startTime: nowISO,
        endTime: null
    };

    chatSessions.push(newSession);
    saveSessions();
    renderSidebar();
    selectSession(newSession.id);
};

const selectSession = (id) => {
    activeSessionId = id;
    renderSidebar();
    
    // Reset States for UI base
    violationMessage.classList.add('hidden');
    document.getElementById('typing-indicator').classList.add('hidden');
    
    agentPanel.classList.remove('active');
    agentPanel.classList.add('inactive');
    agentNotification.classList.add('hidden');
    agentIdleContent.classList.remove('hidden');
    agentInput.disabled = true;
    agentSendBtn.disabled = true;
    closeConversationBtn.classList.add('hidden');

    const activeSession = getActiveSession();
    
    if (activeSession && activeSession.isClosed) {
        // Ensure it appears permanently closed
        isChatClosed = true;
        customerInput.disabled = true;
        customerSendBtn.disabled = true;
        chatStatusIndicator.textContent = "Closed";
        
        if (activeSession.closureReason === 'policy') {
            violationMessage.classList.remove('hidden');
            chatStatusIndicator.style.color = "var(--warning-text)";
        } else {
            chatStatusIndicator.style.color = "var(--text-secondary)";
        }
    } else {
        // Open
        isChatClosed = false;
        currentWarningCount = 0;
        customerInput.disabled = false;
        customerSendBtn.disabled = false;
        chatStatusIndicator.textContent = "Active";
        chatStatusIndicator.style.color = "var(--accent-primary)";
    }

    renderActiveChat();

    // KEY FIX: If the user is viewing an older session (not the latest one),
    // the input must be DISABLED. Messages sent now get a server-side timestamp
    // that falls AFTER the old session's endTime, so they'd land in a newer session.
    // Old sessions are read-only history.
    const isLastSession = chatSessions[chatSessions.length - 1]?.id === id;
    if (!isLastSession && !activeSession?.isClosed) {
        customerInput.disabled = true;
        customerSendBtn.disabled = true;
        chatStatusIndicator.textContent = 'History';
        chatStatusIndicator.style.color = 'var(--text-muted)';
    }
};

// --- Rendering ---

const renderSidebar = () => {
    sidebarList.innerHTML = '';
    // Reverse to show newest at top
    [...chatSessions].reverse().forEach(session => {
        const div = document.createElement('div');
        div.classList.add('chat-session-item');
        if (session.id === activeSessionId) div.classList.add('active');
        
        div.innerHTML = `
            <div class="chat-title-group">
                <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" height="16" width="16"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                <span>${session.title}</span>
            </div>
            <div class="delete-chat-btn" title="Delete Chat">
                <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" height="14" width="14"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </div>
        `;
        
        div.addEventListener('click', () => selectSession(session.id));
        
        const deleteBtn = div.querySelector('.delete-chat-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent triggering the selectSession click
            deleteSpecificSession(session.id);
        });
        
        sidebarList.appendChild(div);
    });
};

const executeDeleteSession = (id) => {
    chatSessions = chatSessions.filter(s => s.id !== id);
    saveSessions();
    
    if (chatSessions.length === 0) {
        createNewSession();
    } else {
        if (activeSessionId === id) {
            selectSession(chatSessions[chatSessions.length - 1].id);
        } else {
            renderSidebar();
        }
    }
};

const deleteSpecificSession = (id) => {
    showModal('Delete Chat Session', 'Are you sure you want to permanently delete this specific chat?', () => {
        executeDeleteSession(id);
    });
};

// --- Modal Logic ---
let pendingModalConfirm = null;

const showModal = (title, desc, confirmCallback) => {
    modalTitle.textContent = title;
    modalDesc.textContent = desc;
    pendingModalConfirm = confirmCallback;
    modalOverlay.classList.remove('hidden');
};

const closeModal = () => {
    modalOverlay.classList.add('hidden');
    pendingModalConfirm = null;
};

modalCancelBtn.addEventListener('click', closeModal);
modalConfirmBtn.addEventListener('click', () => {
    if (pendingModalConfirm) pendingModalConfirm();
    closeModal();
});

const getActiveSession = () => chatSessions.find(s => s.id === activeSessionId);

const renderActiveChat = () => {
    messagesContainer.innerHTML = '';
    const activeSession = getActiveSession();
    if (!activeSession) return;

    const sessionIndex = chatSessions.findIndex(s => s.id === activeSession.id);
    const nextSession = chatSessions[sessionIndex + 1]; // the session that came after this one

    const start = new Date(activeSession.startTime).getTime();
    // If session has an explicit endTime, use it.
    // If it has a next session, cap at the next session's startTime.
    // Only if it's THE last session (truly open) do we use Infinity.
    let end;
    if (activeSession.endTime) {
        end = new Date(activeSession.endTime).getTime();
    } else if (nextSession) {
        end = new Date(nextSession.startTime).getTime();
    } else {
        end = Infinity; // This is the active, open session — no upper cap needed
    }

    const sessionMessages = allMessages.filter(msg => {
        const msgTime = new Date(msg.created_at).getTime();
        return msgTime >= start && msgTime <= end;
    });

    sessionMessages.forEach(processMessageState);
};

// Map sender to an appropriate display sender type
const getMessageClass = (sender) => {
    if (['user', 'bot', 'agent', 'warning', 'pending_human'].includes(sender)) {
        return sender;
    }
    return 'bot';
};

const escapeHTML = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

const scrollToBottom = () => {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
};

// Renders one message purely into the DOM
const pushMessageToDOM = (msg) => {
    const safeSender = getMessageClass(msg.sender);
    const wrapper = document.createElement('div');
    wrapper.classList.add('message-wrapper', safeSender);

    const messageEl = document.createElement('div');
    messageEl.classList.add('message', `msg-${safeSender}`);

    const safeContent = escapeHTML(msg.content);

    if (safeSender === 'warning') {
        messageEl.innerHTML = `⚠️ <span>${safeContent}</span>`;
    } else if (safeSender === 'pending_human') {
        messageEl.innerHTML = `<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" height="16" width="16"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> Connecting to human...`;
    } else {
        messageEl.innerHTML = safeContent;
    }

    wrapper.appendChild(messageEl);
    messagesContainer.appendChild(wrapper);
    scrollToBottom();
};

const closeChat = (reason = 'policy') => {
    isChatClosed = true;
    customerInput.disabled = true;
    customerSendBtn.disabled = true;
    chatStatusIndicator.textContent = "Closed";
    chatStatusIndicator.style.color = "var(--warning-text)";
    
    if (reason === 'policy') {
        violationMessage.classList.remove('hidden');
    }
    
    const session = getActiveSession();
    if (session) {
        session.isClosed = true;
        session.closureReason = reason;
        saveSessions();
    }
};

const activateAgentPanel = () => {
    agentPanel.classList.remove('inactive');
    agentPanel.classList.add('active');
    agentNotification.classList.remove('hidden');
    agentIdleContent.classList.add('hidden');
    agentInput.disabled = false;
    agentSendBtn.disabled = false;
    closeConversationBtn.classList.remove('hidden');
};

const handleAgentCloseConversation = async () => {
    const content = '✅ This conversation has been closed by the support agent. Thank you for contacting us.';
    
    try {
        await supabaseClient.from('messages').insert([
            { sender: 'bot', content: content }
        ]);
        
        const session = getActiveSession();
        if (session) {
            session.isClosed = true;
            session.closureReason = 'agent';
            saveSessions();
        }
        
        // Reset panel visually
        agentPanel.classList.remove('active');
        agentPanel.classList.add('inactive');
        agentNotification.classList.add('hidden');
        agentIdleContent.classList.remove('hidden');
        agentInput.disabled = true;
        agentSendBtn.disabled = true;
        agentInput.value = '';
        closeConversationBtn.classList.add('hidden');
        
        // Disable customer chatting
        isChatClosed = true;
        customerInput.disabled = true;
        customerSendBtn.disabled = true;
        chatStatusIndicator.textContent = "Closed";
        chatStatusIndicator.style.color = "var(--warning-text)";

    } catch (err) {
        console.error('Supabase close error:', err);
    }
};

// Process message state triggers
const processMessageState = (msg) => {
    if (['bot', 'warning', 'pending_human', 'agent'].includes(msg.sender)) {
        document.getElementById('typing-indicator').classList.add('hidden');
    }

    pushMessageToDOM(msg);

    if (msg.sender === 'warning') {
        // Count directly from DOM — reliable regardless of re-renders or polling
        const warningCount = messagesContainer.querySelectorAll('.msg-warning').length;
        if (warningCount >= 2 && !isChatClosed) {
            closeChat('policy');
        }
    } else if (msg.sender === 'pending_human') {
        activateAgentPanel();
    }
};

// Check if a message belongs to active session and render it sequentially
const handleNewMessage = (msg) => {
    // Deduplicate: If we already have this exact message ID, ignore it.
    if (allMessages.some(m => m.id === msg.id)) return;
    
    allMessages.push(msg);
    
    // Hide typing indicator globally
    if (['bot', 'warning', 'pending_human', 'agent'].includes(msg.sender)) {
        document.getElementById('typing-indicator').classList.add('hidden');
    }

    const activeSession = getActiveSession();
    if (!activeSession) return;

    // Only push live messages to DOM if this is the LAST (truly open) session.
    // Older sessions without an endTime can exist if the user never explicitly closed them —
    // we must NOT treat them as "live" or they will absorb messages from newer sessions.
    const isLastSession = chatSessions[chatSessions.length - 1]?.id === activeSession.id;

    if (isLastSession && !activeSession.endTime) {
        // Truly live session — accept the message
        processMessageState(msg);
    } else {
        // Viewing an older session — strict time boundary check
        const sessionIndex = chatSessions.findIndex(s => s.id === activeSession.id);
        const nextSession = chatSessions[sessionIndex + 1];
        const msgTime = new Date(msg.created_at).getTime();
        const start = new Date(activeSession.startTime).getTime() - 5000; // 5s buffer for clock skew
        const end = activeSession.endTime
            ? new Date(activeSession.endTime).getTime()
            : nextSession ? new Date(nextSession.startTime).getTime() : Infinity;

        if (msgTime >= start && msgTime <= end) {
            processMessageState(msg);
        }
    }
};

// --- Network & Subscriptions ---

const fetchAllMessages = async () => {
    const { data: messages, error } = await supabaseClient
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });
        
    if (error) {
        console.error('Error fetching messages:', error);
        return;
    }
    
    if (messages) {
        if (allMessages.length === 0) {
            allMessages = messages;
            loadSessions(); // only load sessions after we have messages to filter
        } else {
            // Background polling injection: deduplicated by handleNewMessage!
            messages.forEach(msg => handleNewMessage(msg));
        }
    }
};

let messagesChannel;
let pollingInterval;

const setupRealtime = () => {
    messagesChannel = supabaseClient.channel('my-messages-channel'); // Safe generic name
    messagesChannel
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'messages' }, // Wildcard to catch all changes
            (payload) => {
                console.log("🔔 REALTIME EVENT FIRED:", payload);
                if (payload.eventType === 'INSERT') {
                    handleNewMessage(payload.new);
                }
            }
        )
        .subscribe((status, err) => {
            console.log('📡 REALTIME CONNECTION STATUS:', status);
            if (status === 'CHANNEL_ERROR') {
                console.error('❌ Real-time subscription error:', err);
            }
        });
        
    // SILENT FALLBACK: If the user's Supabase instance has real-time broadcasting completely disabled
    // in the backend dashboard UI (a common issue), we will start an invisible polling loop 
    // every 3 seconds. It deduplicates automatically via `msg.id`, so it functions as a bomb-proof guarantee.
    pollingInterval = setInterval(() => {
        fetchAllMessages();
    }, 3000);
};

const clearSessionHistory = () => {
    showModal('Clear All History', 'Are you sure you want to completely wipe all local chat history? This cannot be undone.', () => {
        localStorage.removeItem('support_chat_sessions');
        chatSessions = [];
        messagesContainer.innerHTML = '';
        allMessages = [];
        createNewSession();
    });
};

// --- Input Handling ---

const sendCustomerMessage = async () => {
    if (isChatClosed) return;
    
    const content = customerInput.value.trim();
    if (!content) return;
    
    customerInput.value = '';
    customerInput.focus();
    
    // Check if the agent panel is active (Human in the loop is connected)
    const isHumanConnected = agentPanel.classList.contains('active');
    
    // Don't show typing indicator if the human is connected, because the webhook isn't being polled
    if (!isHumanConnected) {
        document.getElementById('typing-indicator').classList.remove('hidden');
    }
    
    try {
        if (isHumanConnected) {
            // Bypass webhook and insert directly to Supabase since agent is handling it
            await supabaseClient.from('messages').insert([
                { sender: 'user', content: content }
            ]);
        } else {
            // Standard webhook routing
            await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: content })
            });
        }
    } catch (err) {
        console.error('Send message error:', err);
    }
};

const sendAgentMessage = async () => {
    const content = agentInput.value.trim();
    if (!content) return;
    
    agentInput.value = '';
    agentInput.focus();
    
    try {
        await supabaseClient.from('messages').insert([
            { sender: 'agent', content: content }
        ]);
    } catch (err) {
        console.error('Supabase error:', err);
    }
};

// --- Event Binding ---

newChatBtn.addEventListener('click', createNewSession);
clearHistoryBtn.addEventListener('click', clearSessionHistory);
closeConversationBtn.addEventListener('click', handleAgentCloseConversation);

customerSendBtn.addEventListener('click', sendCustomerMessage);
customerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendCustomerMessage();
});

agentSendBtn.addEventListener('click', sendAgentMessage);
agentInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendAgentMessage();
});

// Boot loop
fetchAllMessages().then(() => {
    setupRealtime();
});
