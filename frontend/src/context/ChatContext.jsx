/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { chatService } from '../services';

const initialState = {
  currentThreadId: null,
  messageHistory: [],
  chatThreads: [],
  language: 'English',
  loading: false,
  error: null,
  pendingInput: '',
};

const ActionTypes = {
  SET_CURRENT_THREAD: 'SET_CURRENT_THREAD',
  SET_MESSAGE_HISTORY: 'SET_MESSAGE_HISTORY',
  ADD_MESSAGE: 'ADD_MESSAGE',
  ADD_MESSAGES: 'ADD_MESSAGES',
  SET_CHAT_THREADS: 'SET_CHAT_THREADS',
  SET_LANGUAGE: 'SET_LANGUAGE',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_PENDING_INPUT: 'SET_PENDING_INPUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

const chatReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_CURRENT_THREAD:
      return { ...state, currentThreadId: action.payload };
    case ActionTypes.SET_MESSAGE_HISTORY:
      return { ...state, messageHistory: action.payload };
    case ActionTypes.ADD_MESSAGE:
      return {
        ...state,
        messageHistory: [...state.messageHistory, action.payload],
      };
    case ActionTypes.ADD_MESSAGES:
      return {
        ...state,
        messageHistory: [...state.messageHistory, ...action.payload],
      };
    case ActionTypes.SET_CHAT_THREADS:
      return { ...state, chatThreads: action.payload };
    case ActionTypes.SET_LANGUAGE:
      return { ...state, language: action.payload };
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload };
    case ActionTypes.SET_PENDING_INPUT:
      return { ...state, pendingInput: action.payload };
    case ActionTypes.CLEAR_ERROR:
      return { ...state, error: null };
    default:
      return state;
  }
};

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const messagesRef = useRef(state.messageHistory);

  useEffect(() => {
    messagesRef.current = state.messageHistory;
  }, [state.messageHistory]);

  useEffect(() => {
    initializeChat();
  }, []);

  const initializeChat = async () => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      const threads = await chatService.getAllThreads();
      dispatch({ type: ActionTypes.SET_CHAT_THREADS, payload: threads });

      const newThreadId = await chatService.createNewThread();
      dispatch({ type: ActionTypes.SET_CURRENT_THREAD, payload: newThreadId });
      dispatch({
        type: ActionTypes.SET_CHAT_THREADS,
        payload: [newThreadId, ...threads.filter((id) => id !== newThreadId)],
      });
      dispatch({ type: ActionTypes.SET_MESSAGE_HISTORY, payload: [] });
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  };

  const createNewThread = async () => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });
      const newThreadId = await chatService.createNewThread();
      dispatch({ type: ActionTypes.SET_CURRENT_THREAD, payload: newThreadId });
      dispatch({ type: ActionTypes.SET_MESSAGE_HISTORY, payload: [] });

      const threads = await chatService.getAllThreads();
      dispatch({
        type: ActionTypes.SET_CHAT_THREADS,
        payload: [newThreadId, ...threads.filter((id) => id !== newThreadId)],
      });
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  };

  const loadThread = async (threadId) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });
      const messages = await chatService.loadThread(threadId);
      dispatch({ type: ActionTypes.SET_CURRENT_THREAD, payload: threadId });
      dispatch({ type: ActionTypes.SET_MESSAGE_HISTORY, payload: messages });
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  };

  const sendMessage = async (messageText) => {
    const trimmed = messageText.trim();
    if (!trimmed) return;

    const userMessage = { role: 'user', content: trimmed };
    const updatedHistory = [...messagesRef.current, userMessage];
    dispatch({ type: ActionTypes.ADD_MESSAGE, payload: userMessage });
    dispatch({ type: ActionTypes.CLEAR_ERROR });

    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      const apiMessages = updatedHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const aiMessages = await chatService.sendMessage(
        state.currentThreadId,
        apiMessages,
        state.language
      );

      if (Array.isArray(aiMessages) && aiMessages.length > 0) {
        dispatch({ type: ActionTypes.ADD_MESSAGES, payload: aiMessages });
      }
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      dispatch({
        type: ActionTypes.ADD_MESSAGE,
        payload: {
          role: 'assistant',
          content:
            'Could not reach the backend server. Please verify FastAPI is running on http://localhost:8000.',
        },
      });
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  };

  const sendVoiceQuery = async (audioFile, voiceLanguage) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });
      const result = await chatService.sendVoiceQuery(audioFile, voiceLanguage);

      if (result.transcription) {
        dispatch({
          type: ActionTypes.ADD_MESSAGE,
          payload: { role: 'user', content: `🎤 ${result.transcription}` },
        });
      }
      if (result.answer) {
        dispatch({
          type: ActionTypes.ADD_MESSAGE,
          payload: { role: 'assistant', content: result.answer },
        });
      }
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  };

  const setLanguage = (language) => {
    dispatch({ type: ActionTypes.SET_LANGUAGE, payload: language });
  };

  const clearError = () => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  };

  const setPendingInput = (input) => {
    dispatch({ type: ActionTypes.SET_PENDING_INPUT, payload: input });
  };

  const value = {
    ...state,
    createNewThread,
    loadThread,
    sendMessage,
    sendVoiceQuery,
    setLanguage,
    clearError,
    setPendingInput,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
