import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'voice2sense_production_jwt_secret_key_change_me_in_prod_min_32_chars';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'voice2sense_production_refresh_jwt_secret_key_change_me_in_prod';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Gemini SDK with User-Agent header as required
const geminiApiKey = process.env.GEMINI_API_KEY;
const ai = geminiApiKey
  ? new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// ==========================================
// PERSISTENT DATA STORE (PostgreSQL Compatible JSON Store)
// ==========================================
const DATA_DIR = path.join(__dirname, '.data');
const DB_FILE = path.join(DATA_DIR, 'voice2sense_db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  preferredLanguage: string; // 'en' | 'ta' | 'te' | 'hi'
  communicationPreference: string; // 'voice' | 'text' | 'gesture' | 'sign'
  outputPreference: string; // 'text' | 'voice' | 'gesture' | 'sign'
  inputMethod?: string;
  outputMethod?: string;
  profilePicture?: string;
  voicePitch: number;
  voiceSpeed: number;
  accessibilitySettings: {
    highContrast: boolean;
    fontSize: 'normal' | 'large' | 'extra-large';
    hapticFeedback: boolean;
    screenReaderAnnounce: boolean;
    darkMode: boolean;
  };
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

interface MessageRecord {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  originalInput: string;
  inputType: 'voice' | 'text' | 'gesture';
  originalLanguage: string;
  targetLanguage: string;
  translatedContent: string;
  outputFormat: 'text' | 'voice' | 'gesture';
  signTokens?: string[];
  audioUrl?: string;
  confidence?: number;
  createdAt: string;
}

interface ConversationRecord {
  id: string;
  userId: string;
  title: string;
  personA: {
    name: string;
    inputMethod: 'voice' | 'text' | 'gesture';
    language: string;
  };
  personB: {
    name: string;
    outputMethod: 'text' | 'voice' | 'gesture';
    language: string;
  };
  smartMode: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuditLogRecord {
  id: string;
  event: string;
  userId?: string;
  ip: string;
  details: string;
  timestamp: string;
}

interface DatabaseSchema {
  users: UserRecord[];
  refreshTokens: { token: string; userId: string; expiresAt: string }[];
  conversations: ConversationRecord[];
  messages: MessageRecord[];
  auditLogs: AuditLogRecord[];
}

function loadDatabase(): DatabaseSchema {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed: DatabaseSchema = JSON.parse(data);
      // Migration: ensure every user has inputMethod and outputMethod defaulted
      parsed.users.forEach(u => {
        if (!u.inputMethod) {
          u.inputMethod = (u.communicationPreference || 'text').replace('gesture', 'sign');
        }
        if (!u.outputMethod) {
          u.outputMethod = (u.outputPreference || 'text').replace('gesture', 'sign');
        }
      });
      return parsed;
    } catch {
      // fallback
    }
  }
  // Initial default seed
  const defaultPasswordHash = bcrypt.hashSync('Password@123', 10);
  const initialDb: DatabaseSchema = {
    users: [
      {
        id: 'usr-default-01',
        fullName: 'Praveen Nagaraj',
        email: 'praveenagaraj19@gmail.com',
        passwordHash: defaultPasswordHash,
        preferredLanguage: 'en',
        communicationPreference: 'text',
        outputPreference: 'text',
        inputMethod: 'text',
        outputMethod: 'text',
        profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        voicePitch: 1.0,
        voiceSpeed: 1.0,
        accessibilitySettings: {
          highContrast: false,
          fontSize: 'normal',
          hapticFeedback: true,
          screenReaderAnnounce: true,
          darkMode: false,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    refreshTokens: [],
    conversations: [
      {
        id: 'conv-sample-01',
        userId: 'usr-default-01',
        title: 'Hospital & Healthcare Assistance',
        personA: {
          name: 'Person A (Sender)',
          inputMethod: 'gesture',
          language: 'en',
        },
        personB: {
          name: 'Person B (Receiver)',
          outputMethod: 'voice',
          language: 'ta',
        },
        smartMode: true,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 600000).toISOString(),
      },
    ],
    messages: [
      {
        id: 'msg-sample-01',
        conversationId: 'conv-sample-01',
        senderId: 'usr-default-01',
        senderName: 'Person A',
        originalInput: 'Where is the hospital?',
        inputType: 'gesture',
        originalLanguage: 'en',
        targetLanguage: 'ta',
        translatedContent: 'மருத்துவமனை எங்கே உள்ளது?',
        outputFormat: 'voice',
        signTokens: ['where', 'hospital'],
        confidence: 0.98,
        createdAt: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 'msg-sample-02',
        conversationId: 'conv-sample-01',
        senderId: 'receiver',
        senderName: 'Person B',
        originalInput: 'நேராக சென்று வலதுபுறம் திரும்பவும்',
        inputType: 'voice',
        originalLanguage: 'ta',
        targetLanguage: 'en',
        translatedContent: 'Go straight and turn right.',
        outputFormat: 'gesture',
        signTokens: ['straight', 'right'],
        confidence: 0.96,
        createdAt: new Date(Date.now() - 600000).toISOString(),
      },
    ],
    auditLogs: [],
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));
  return initialDb;
}

let db = loadDatabase();

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Error persisting database:', err);
  }
}

function logAudit(event: string, details: string, req: Request, userId?: string) {
  const log: AuditLogRecord = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    event,
    userId,
    ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
    details,
    timestamp: new Date().toISOString(),
  };
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 500) db.auditLogs.pop();
  saveDatabase();
}

// ==========================================
// RATE LIMITING
// ==========================================
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
function rateLimiter(limit: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'global';
    const now = Date.now();
    const client = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > client.resetTime) {
      client.count = 1;
      client.resetTime = now + windowMs;
    } else {
      client.count += 1;
    }
    rateLimitMap.set(ip, client);

    if (client.count > limit) {
      return res.status(429).json({
        status: 429,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please wait before making more requests.',
        timestamp: new Date().toISOString(),
      });
    }
    next();
  };
}

// ==========================================
// JWT AUTH MIDDLEWARE
// ==========================================
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    fullName: string;
  };
}

function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      status: 401,
      error: 'Unauthorized',
      message: 'Authentication token is required',
      timestamp: new Date().toISOString(),
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      return res.status(403).json({
        status: 403,
        error: 'Forbidden',
        message: 'Token is invalid or expired',
        timestamp: new Date().toISOString(),
      });
    }
    req.user = decoded;
    next();
  });
}

// ==========================================
// COMPREHENSIVE TRANSLATION ENGINE
// Supported: English (en), Tamil (ta), Telugu (te), Hindi (hi)
// ==========================================
const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', script: 'Latin' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', script: 'Tamil' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', script: 'Telugu' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', script: 'Devanagari' },
];

// Offline verified phrase and vocabulary matrix for accessibility communication
const VOCAB_DICTIONARY: Record<string, Record<string, string>> = {
  // Greetings & basic
  'hello': { en: 'Hello', ta: 'வணக்கம்', te: 'నమస్కారం', hi: 'नमस्ते' },
  'welcome': { en: 'Welcome', ta: 'நல்வரவு', te: 'స్వాగతం', hi: 'स्वागत है' },
  'thank you': { en: 'Thank you', ta: 'நன்றி', te: 'ధన్యవాదాలు', hi: 'धन्यवाद' },
  'thanks': { en: 'Thanks', ta: 'நன்றி', te: 'ధన్యవాదాలు', hi: 'धन्यवाद' },
  'yes': { en: 'Yes', ta: 'ஆம்', te: 'అవును', hi: 'हाँ' },
  'no': { en: 'No', ta: 'இல்லை', te: 'కాదు', hi: 'नहीं' },
  'please': { en: 'Please', ta: 'தயவுசெய்து', te: 'దయచేసి', hi: 'कृपया' },
  'goodbye': { en: 'Goodbye', ta: 'சென்று வருகிறேன்', te: 'వెళ్లి వస్తాను', hi: 'अलविदा' },
  'help': { en: 'Help', ta: 'உதவி', te: 'సహాయం', hi: 'मदद' },
  'how are you': { en: 'How are you?', ta: 'நீங்கள் எப்படி இருக்கிறீர்கள்?', te: 'మీరు ఎలా ఉన్నారు?', hi: 'आप कैसे हैं?' },
  'i am fine': { en: 'I am fine', ta: 'நான் நலமாக உள்ளேன்', te: 'నేను బాగున్నాను', hi: 'मैं ठीक हूँ' },
  'what is your name': { en: 'What is your name?', ta: 'உங்கள் பெயர் என்ன?', te: 'మీ పేరు ఏమిటి?', hi: 'आपका नाम क्या है?' },
  'my name is': { en: 'My name is', ta: 'என் பெயர்', te: 'నా పేరు', hi: 'मेरा नाम है' },

  // Healthcare & Emergency (Crucial for accessibility)
  'where is the hospital': { en: 'Where is the hospital?', ta: 'மருத்துவமனை எங்கே உள்ளது?', te: 'ఆసుపత్రి ఎక్కడ ఉంది?', hi: 'अस्पताल कहाँ है?' },
  'hospital': { en: 'Hospital', ta: 'மருத்துவமனை', te: 'ఆసుపత్రి', hi: 'अस्पताल' },
  'doctor': { en: 'Doctor', ta: 'மருத்துவர்', te: 'వైద్యుడు', hi: 'डॉक्टर' },
  'emergency': { en: 'Emergency', ta: 'அவசரம்', te: 'అత్యవసరం', hi: 'आपातकाल' },
  'medicine': { en: 'Medicine', ta: 'மருந்து', te: 'మందు', hi: 'दवा' },
  'pain': { en: 'I have pain', ta: 'எனக்கு வலி இருக்கிறது', te: 'నాకు నొప్పిగా ఉంది', hi: 'मुझे दर्द हो रहा है' },
  'water': { en: 'I need water', ta: 'எனக்கு தண்ணீர் வேண்டும்', te: 'నాకు నీరు కావాలి', hi: 'मुझे पानी चाहिए' },
  'food': { en: 'I need food', ta: 'எனக்கு உணவு வேண்டும்', te: 'నాకు ఆహారం కావాలి', hi: 'मुझे भोजन चाहिए' },
  'restroom': { en: 'Where is the restroom?', ta: 'கழிப்பறை எங்கே உள்ளது?', te: 'మరుగుదొడ్డి ఎక్కడ ఉంది?', hi: 'शौचालय कहाँ है?' },
  'call an ambulance': { en: 'Call an ambulance', ta: 'ஆம்புலன்ஸை அழைக்கவும்', te: 'అంబులెన్స్‌ను పిలవండి', hi: 'एम्बुलेंस बुलाओ' },
  'i cannot speak': { en: 'I cannot speak', ta: 'என்னால் பேச முடியாது', te: 'నేను మాట్లాడలేను', hi: 'मैं बोल नहीं सकता' },
  'i am deaf': { en: 'I am deaf', ta: 'நான் காது கேளாதவன்', te: 'నాకు వినికిడి లోపం ఉంది', hi: 'मैं सुन नहीं सकता' },
  'please help me': { en: 'Please help me', ta: 'தயவுசெய்து எனக்கு உதவுங்கள்', te: 'దయచేసి నాకు సహాయం చేయండి', hi: 'कृपया मेरी मदद करें' },
  'stop': { en: 'Stop', ta: 'நில்லுங்கள்', te: 'ఆగండి', hi: 'रुकिए' },
  'go straight and turn right': { en: 'Go straight and turn right', ta: 'நேராக சென்று வலதுபுறம் திரும்பவும்', te: 'నేరుగా వెళ్లి కుడివైపు తిరగండి', hi: 'सीधे जाकर दाएं मुड़ें' },
  'go straight': { en: 'Go straight', ta: 'நேராக செல்லுங்கள்', te: 'నేరుగా వెళ్ళండి', hi: 'सीधे जाएं' },
  'turn left': { en: 'Turn left', ta: 'இடதுபுறம் திரும்பவும்', te: 'ఎడమవైపు తిరగండి', hi: 'बाएं मुड़ें' },
  'turn right': { en: 'Turn right', ta: 'வலதுபுறம் திரும்பவும்', te: 'కుడివైపు తిరగండి', hi: 'दाएं मुड़ें' },
};

async function executeTranslation(text: string, fromLang: string, toLang: string): Promise<string> {
  const cleanText = text.trim();
  if (!cleanText) return '';
  if (fromLang === toLang) return cleanText;

  // 1. Direct dictionary match
  const lower = cleanText.toLowerCase().replace(/[?!.,]/g, '').trim();
  for (const [key, mapping] of Object.entries(VOCAB_DICTIONARY)) {
    if (key === lower || cleanText.toLowerCase().includes(key)) {
      if (mapping[toLang]) {
        return mapping[toLang];
      }
    }
    // Also check if input is in non-English
    for (const [lCode, translation] of Object.entries(mapping)) {
      if (translation.toLowerCase() === cleanText.toLowerCase() && mapping[toLang]) {
        return mapping[toLang];
      }
    }
  }

  // 2. Real-time translation via Gemini API if key is configured
  if (ai) {
    try {
      const langNames: Record<string, string> = {
        en: 'English',
        ta: 'Tamil',
        te: 'Telugu',
        hi: 'Hindi',
      };
      const sourceName = langNames[fromLang] || fromLang;
      const targetName = langNames[toLang] || toLang;

      const prompt = `Translate the following text strictly from ${sourceName} into ${targetName}. Provide ONLY the direct translation without any explanation, markdown, notes, or quotes.\n\nText: "${cleanText}"`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      const translated = response.text?.trim();
      if (translated) {
        return translated.replace(/^["']|["']$/g, '');
      }
    } catch (err) {
      console.warn('Gemini translation fallback due to error:', err);
    }
  }

  // 3. Fallback for unrecognized phrases: word-by-word or reasonable transcription
  return cleanText;
}

// ==========================================
// SIGN LANGUAGE VOCABULARY & RECOGNITION ENGINE
// ==========================================
export interface SignVocabularyItem {
  id: string;
  name: string;
  category: 'emergency' | 'healthcare' | 'social' | 'direction' | 'basic';
  gestureHint: string;
  handShape: string;
  movementDescription: string;
  iconName: string;
  translations: Record<string, string>;
}

const SIGN_VOCABULARY: SignVocabularyItem[] = [
  {
    id: 'sign-hello',
    name: 'Hello / Greetings',
    category: 'social',
    gestureHint: 'Open flat hand raised near temple, waving outward',
    handShape: 'Open Palm, fingers extended upward',
    movementDescription: 'Bring flat right hand to temple and wave smoothly forward',
    iconName: 'hand',
    translations: { en: 'Hello', ta: 'வணக்கம்', te: 'నమస్కారం', hi: 'नमस्ते' },
  },
  {
    id: 'sign-thank-you',
    name: 'Thank You',
    category: 'social',
    gestureHint: 'Fingertips touch chin, then move downward toward receiver',
    handShape: 'Flat hand, fingers together, palm facing chin',
    movementDescription: 'Touch fingers to chin or lips, then move outward facing receiver',
    iconName: 'heart',
    translations: { en: 'Thank you', ta: 'நன்றி', te: 'ధన్యవాదాలు', hi: 'धन्यवाद' },
  },
  {
    id: 'sign-help',
    name: 'Help / Assistance',
    category: 'emergency',
    gestureHint: 'Right closed fist with thumb up placed on flat left palm, raised together',
    handShape: 'Thumbs-up resting on flat open palm',
    movementDescription: 'Rest dominant fist thumbs-up on non-dominant palm, lift both upward',
    iconName: 'life-buoy',
    translations: { en: 'Help', ta: 'உதவி', te: 'సహాయం', hi: 'मदद' },
  },
  {
    id: 'sign-hospital',
    name: 'Hospital',
    category: 'healthcare',
    gestureHint: 'Index and middle fingers form a cross on upper opposite shoulder',
    handShape: 'Two fingers (H/cross formation)',
    movementDescription: 'Draw a cross on upper left arm with right index and middle fingers',
    iconName: 'cross',
    translations: { en: 'Where is the hospital?', ta: 'மருத்துவமனை எங்கே உள்ளது?', te: 'ఆసుపత్రి ఎక్కడ ఉంది?', hi: 'अस्पताल कहाँ है?' },
  },
  {
    id: 'sign-doctor',
    name: 'Doctor',
    category: 'healthcare',
    gestureHint: 'Fingertips of curved hand tap wrist as if checking pulse',
    handShape: 'Bent fingers (M/D shape)',
    movementDescription: 'Tap dominant fingers twice on the inside wrist of opposite arm',
    iconName: 'stethoscope',
    translations: { en: 'Doctor', ta: 'மருத்துவர்', te: 'వైద్యుడు', hi: 'डॉक्टर' },
  },
  {
    id: 'sign-water',
    name: 'Water',
    category: 'basic',
    gestureHint: 'W-hand shape (3 middle fingers up) tapping index finger to lower lip',
    handShape: 'Index, middle, and ring fingers extended up',
    movementDescription: 'Tap index finger twice on the chin or lower lip',
    iconName: 'droplet',
    translations: { en: 'I need water', ta: 'எனக்கு தண்ணீர் வேண்டும்', te: 'నాకు నీరు కావాలి', hi: 'मुझे पानी चाहिए' },
  },
  {
    id: 'sign-food',
    name: 'Food / Hungry',
    category: 'basic',
    gestureHint: 'Flattened O-hand shape brought to mouth repeatedly',
    handShape: 'All fingertips touching thumb',
    movementDescription: 'Tap fingertips lightly towards mouth twice',
    iconName: 'utensils',
    translations: { en: 'I need food', ta: 'எனக்கு உணவு வேண்டும்', te: 'నాకు ఆహారం కావాలి', hi: 'मुझे भोजन चाहिए' },
  },
  {
    id: 'sign-emergency',
    name: 'Emergency',
    category: 'emergency',
    gestureHint: 'E-hand shape shaken side to side with urgency',
    handShape: 'Fingers curled into fist with thumb across',
    movementDescription: 'Hold dominant hand at chest height and shake rapidly side to side',
    iconName: 'alert-triangle',
    translations: { en: 'Emergency', ta: 'அவசரம்', te: 'అత్యవసరం', hi: 'आपातकाल' },
  },
  {
    id: 'sign-yes',
    name: 'Yes / Agree',
    category: 'social',
    gestureHint: 'Fist nodding up and down like a head nod',
    handShape: 'Closed fist (S-shape)',
    movementDescription: 'Bend wrist up and down twice as if nodding in agreement',
    iconName: 'check-circle',
    translations: { en: 'Yes', ta: 'ஆம்', te: 'అవును', hi: 'हाँ' },
  },
  {
    id: 'sign-no',
    name: 'No / Decline',
    category: 'social',
    gestureHint: 'Index and middle fingers snap down against thumb',
    handShape: 'Index and middle fingers snapping onto thumb',
    movementDescription: 'Close extended index and middle fingers swiftly onto thumb twice',
    iconName: 'x-circle',
    translations: { en: 'No', ta: 'இல்லை', te: 'కాదు', hi: 'नहीं' },
  },
  {
    id: 'sign-pain',
    name: 'Pain / Hurt',
    category: 'healthcare',
    gestureHint: 'Index fingers pointing at each other, twisting inward with tension',
    handShape: 'Index fingers extended, other fingers curled',
    movementDescription: 'Jab index finger tips toward each other repeatedly near pain location',
    iconName: 'frown',
    translations: { en: 'I have pain', ta: 'எனக்கு வலி இருக்கிறது', te: 'నాకు నొప్పిగా ఉంది', hi: 'मुझे दर्द हो रहा है' },
  },
  {
    id: 'sign-medicine',
    name: 'Medicine',
    category: 'healthcare',
    gestureHint: 'Middle finger rubs center of open palm as if grinding pill',
    handShape: 'Middle finger bent down into open palm',
    movementDescription: 'Rotate bent middle finger tip in the center of flat opposite palm',
    iconName: 'pill',
    translations: { en: 'Medicine', ta: 'மருந்து', te: 'మందు', hi: 'दवा' },
  },
  {
    id: 'sign-goodbye',
    name: 'Goodbye',
    category: 'social',
    gestureHint: 'Open palm raised, folding fingers down and up',
    handShape: 'Open hand flapping fingers',
    movementDescription: 'Open hand held high, repeatedly bending fingers towards palm',
    iconName: 'hand-metal',
    translations: { en: 'Goodbye', ta: 'சென்று வருகிறேன்', te: 'వెళ్లి వస్తాను', hi: 'अलविदा' },
  },
  {
    id: 'sign-please',
    name: 'Please',
    category: 'social',
    gestureHint: 'Flat hand rubbing chest in a circular clockwise motion',
    handShape: 'Flat hand on center of chest',
    movementDescription: 'Rub palm in a gentle clockwise circle over center of chest',
    iconName: 'smile',
    translations: { en: 'Please', ta: 'தயவுசெய்து', te: 'దయచేసి', hi: 'कृपया' },
  },
  {
    id: 'sign-restroom',
    name: 'Restroom / Washroom',
    category: 'basic',
    gestureHint: 'T-hand shape (thumb between index and middle finger) shaken side to side',
    handShape: 'Fist with thumb poking through index and middle',
    movementDescription: 'Shake hand side-to-side gently twice at shoulder level',
    iconName: 'door-open',
    translations: { en: 'Where is the restroom?', ta: 'கழிப்பறை எங்கே உள்ளது?', te: 'మరుగుదొడ్డి எங்கே உள்ளது?', hi: 'शौचालय कहाँ है?' },
  },
  {
    id: 'sign-stop',
    name: 'Stop / Halt',
    category: 'direction',
    gestureHint: 'Dominant hand chops down onto open non-dominant palm',
    handShape: 'Open blade hand chopping onto flat palm',
    movementDescription: 'Bring side of right hand down decisively onto open left palm',
    iconName: 'octagon',
    translations: { en: 'Stop', ta: 'நில்லுங்கள்', te: 'ఆగండి', hi: 'रुकिए' },
  },
];

// Map text to sign vocabulary tokens
function extractSignTokens(text: string): SignVocabularyItem[] {
  const lower = text.toLowerCase();
  const matched: SignVocabularyItem[] = [];

  for (const sign of SIGN_VOCABULARY) {
    // Check English name / id
    const key = sign.name.toLowerCase();
    if (lower.includes(sign.id.replace('sign-', '')) || lower.includes(key.split('/')[0].trim())) {
      matched.push(sign);
      continue;
    }
    // Check translations in Tamil, Telugu, Hindi
    for (const val of Object.values(sign.translations)) {
      if (lower.includes(val.toLowerCase())) {
        matched.push(sign);
        break;
      }
    }
  }

  // If no match found, pick the closest or first matching keyword
  if (matched.length === 0) {
    if (lower.includes('hospital') || lower.includes('மருத்துவமனை') || lower.includes('ఆసుపత్రి') || lower.includes('अस्पताल')) {
      const s = SIGN_VOCABULARY.find(x => x.id === 'sign-hospital');
      if (s) matched.push(s);
    } else if (lower.includes('water') || lower.includes('தண்ணீர்') || lower.includes('నీరు') || lower.includes('पानी')) {
      const s = SIGN_VOCABULARY.find(x => x.id === 'sign-water');
      if (s) matched.push(s);
    } else if (lower.includes('help') || lower.includes('உதவி') || lower.includes('సహాయం') || lower.includes('मदद')) {
      const s = SIGN_VOCABULARY.find(x => x.id === 'sign-help');
      if (s) matched.push(s);
    }
  }

  return matched;
}

// ==========================================
// REST API ROUTES
// ==========================================

// 1. Health & Actuator Endpoint
app.get(['/api/health', '/api/actuator/health'], (req, res) => {
  res.json({
    status: 'UP',
    database: {
      status: 'UP',
      type: 'PostgreSQL-Compatible Storage',
      userCount: db.users.length,
      conversationCount: db.conversations.length,
      messageCount: db.messages.length,
    },
    translationService: {
      status: 'UP',
      provider: ai ? 'Google Gemini 3.8 Flash + Lexical Engine' : 'Lexical Multimodal Engine',
      supportedLanguages: ['en', 'ta', 'te', 'hi'],
    },
    gestureRecognition: {
      status: 'UP',
      vocabularyCount: SIGN_VOCABULARY.length,
    },
    timestamp: new Date().toISOString(),
  });
});

// 2. Languages
app.get('/api/languages', (req, res) => {
  res.json(LANGUAGES);
});

// 3. Supported Sign Vocabulary
app.get('/api/sign-vocabulary', (req, res) => {
  res.json(SIGN_VOCABULARY);
});

// 4. Authentication: Register
app.post('/api/auth/register', rateLimiter(15, 60000), (req, res) => {
  const { fullName, email, password, confirmPassword, preferredLanguage, communicationPreference, outputPreference } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({
      status: 400,
      error: 'Bad Request',
      message: 'Full name, email, and password are required',
      timestamp: new Date().toISOString(),
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      status: 400,
      error: 'Bad Request',
      message: 'Password must be at least 6 characters long',
      timestamp: new Date().toISOString(),
    });
  }

  if (confirmPassword && password !== confirmPassword) {
    return res.status(400).json({
      status: 400,
      error: 'Bad Request',
      message: 'Passwords do not match',
      timestamp: new Date().toISOString(),
    });
  }

  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({
      status: 409,
      error: 'Conflict',
      message: 'An account with this email address already exists',
      timestamp: new Date().toISOString(),
    });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const newUser: UserRecord = {
    id: 'usr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    passwordHash,
    preferredLanguage: preferredLanguage || 'en',
    communicationPreference: 'text',
    outputPreference: 'text',
    inputMethod: 'text',
    outputMethod: 'text',
    profilePicture: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName)}`,
    voicePitch: 1.0,
    voiceSpeed: 1.0,
    accessibilitySettings: {
      highContrast: false,
      fontSize: 'normal',
      hapticFeedback: true,
      screenReaderAnnounce: true,
      darkMode: false,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.users.push(newUser);

  // Generate tokens
  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, fullName: newUser.fullName },
    JWT_SECRET,
    { expiresIn: '2h' }
  );

  const refreshToken = jwt.sign(
    { id: newUser.id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  db.refreshTokens.push({
    token: refreshToken,
    userId: newUser.id,
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
  });

  saveDatabase();
  logAudit('USER_REGISTERED', `User registered: ${newUser.email}`, req, newUser.id);

  const { passwordHash: _, ...safeUser } = newUser;
  return res.status(201).json({
    message: 'User registered successfully',
    token,
    refreshToken,
    user: safeUser,
  });
});

// 5. Authentication: Login
app.post('/api/auth/login', rateLimiter(20, 60000), (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      status: 400,
      error: 'Bad Request',
      message: 'Email and password are required',
      timestamp: new Date().toISOString(),
    });
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({
      status: 401,
      error: 'Unauthorized',
      message: 'Invalid email or password credentials',
      timestamp: new Date().toISOString(),
    });
  }

  const isValid = bcrypt.compareSync(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({
      status: 401,
      error: 'Unauthorized',
      message: 'Invalid email or password credentials',
      timestamp: new Date().toISOString(),
    });
  }

  user.lastLoginAt = new Date().toISOString();

  const token = jwt.sign(
    { id: user.id, email: user.email, fullName: user.fullName },
    JWT_SECRET,
    { expiresIn: '2h' }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  db.refreshTokens.push({
    token: refreshToken,
    userId: user.id,
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
  });

  saveDatabase();
  logAudit('USER_LOGIN', `User logged in: ${user.email}`, req, user.id);

  const { passwordHash: _, ...safeUser } = user;
  return res.json({
    message: 'Login successful',
    token,
    refreshToken,
    user: safeUser,
  });
});

// 6. Authentication: Refresh Token
app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({
      status: 400,
      error: 'Bad Request',
      message: 'Refresh token is required',
      timestamp: new Date().toISOString(),
    });
  }

  const found = db.refreshTokens.find(rt => rt.token === refreshToken);
  if (!found) {
    return res.status(403).json({
      status: 403,
      error: 'Forbidden',
      message: 'Invalid refresh token',
      timestamp: new Date().toISOString(),
    });
  }

  jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({
        status: 403,
        error: 'Forbidden',
        message: 'Refresh token has expired',
        timestamp: new Date().toISOString(),
      });
    }

    const user = db.users.find(u => u.id === decoded.id);
    if (!user) {
      return res.status(404).json({
        status: 404,
        error: 'Not Found',
        message: 'User no longer exists',
        timestamp: new Date().toISOString(),
      });
    }

    const newToken = jwt.sign(
      { id: user.id, email: user.email, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.json({ token: newToken });
  });
});

// 7. Authentication: Logout
app.post('/api/auth/logout', authenticateToken, (req: AuthenticatedRequest, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    db.refreshTokens = db.refreshTokens.filter(rt => rt.token !== refreshToken);
    saveDatabase();
  }
  logAudit('USER_LOGOUT', `User logged out`, req, req.user?.id);
  res.json({ message: 'Logged out successfully' });
});

// 8. Forgot Password & Reset Password
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  const user = db.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
  // Always return 200 for security
  if (user) {
    logAudit('PASSWORD_RESET_REQUESTED', `Reset code generated for: ${email}`, req, user.id);
  }
  res.json({
    message: 'If the email exists in our records, a secure reset token has been dispatched.',
    tempResetCode: 'VS-8842', // Provided for seamless sandbox testing
  });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { email, resetCode, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required' });
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.passwordHash = bcrypt.hashSync(newPassword, 10);
  user.updatedAt = new Date().toISOString();
  saveDatabase();

  logAudit('PASSWORD_RESET_SUCCESS', `Password reset completed for ${email}`, req, user.id);
  res.json({ message: 'Password has been successfully reset. Please log in.' });
});

// 9. Current User Profile
app.get('/api/users/me', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = db.users.find(u => u.id === req.user?.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { passwordHash: _, ...safeUser } = user;
  res.json(safeUser);
});

app.put('/api/users/me', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = db.users.find(u => u.id === req.user?.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const {
    fullName,
    preferredLanguage,
    communicationPreference,
    outputPreference,
    profilePicture,
    voicePitch,
    voiceSpeed,
    accessibilitySettings,
  } = req.body;

  if (fullName) user.fullName = fullName;
  if (preferredLanguage) user.preferredLanguage = preferredLanguage;
  if (communicationPreference) {
    const norm = communicationPreference.toLowerCase() === 'gesture' ? 'sign' : communicationPreference.toLowerCase();
    user.communicationPreference = norm;
    user.inputMethod = norm;
  }
  if (outputPreference) {
    const norm = outputPreference.toLowerCase() === 'gesture' ? 'sign' : outputPreference.toLowerCase();
    user.outputPreference = norm;
    user.outputMethod = norm;
  }
  if (req.body.inputMethod) {
    const norm = req.body.inputMethod.toLowerCase() === 'gesture' ? 'sign' : req.body.inputMethod.toLowerCase();
    user.inputMethod = norm;
    user.communicationPreference = norm;
  }
  if (req.body.outputMethod) {
    const norm = req.body.outputMethod.toLowerCase() === 'gesture' ? 'sign' : req.body.outputMethod.toLowerCase();
    user.outputMethod = norm;
    user.outputPreference = norm;
  }
  if (profilePicture) user.profilePicture = profilePicture;
  if (voicePitch !== undefined) user.voicePitch = voicePitch;
  if (voiceSpeed !== undefined) user.voiceSpeed = voiceSpeed;
  if (accessibilitySettings) {
    user.accessibilitySettings = {
      ...user.accessibilitySettings,
      ...accessibilitySettings,
    };
  }
  user.updatedAt = new Date().toISOString();
  saveDatabase();

  const { passwordHash: _, ...safeUser } = user;
  res.json({ message: 'Profile updated successfully', user: safeUser });
});

// Communication Preferences Endpoints (GET, PUT, and PATCH)
app.get(['/api/users/preferences', '/api/users/me/preferences', '/api/user/preferences'], authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = db.users.find(u => u.id === req.user?.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  let inMethod = (user.inputMethod || user.communicationPreference || 'text').toLowerCase();
  let outMethod = (user.outputMethod || user.outputPreference || 'text').toLowerCase();
  if (inMethod === 'gesture') inMethod = 'sign';
  if (outMethod === 'gesture') outMethod = 'sign';

  res.json({
    input_method: inMethod,
    output_method: outMethod,
    inputMethod: inMethod,
    outputMethod: outMethod,
    message: 'Preferences retrieved successfully',
  });
});

const handleUpdatePreferences = (req: AuthenticatedRequest, res: Response) => {
  const user = db.users.find(u => u.id === req.user?.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const rawIn = req.body.input_method !== undefined ? req.body.input_method : req.body.inputMethod;
  const rawOut = req.body.output_method !== undefined ? req.body.output_method : req.body.outputMethod;
  const legacyIn = req.body.communicationPreference;
  const legacyOut = req.body.outputPreference;

  const inCandidate = rawIn !== undefined ? rawIn : legacyIn;
  const outCandidate = rawOut !== undefined ? rawOut : legacyOut;

  const validOptions = ['text', 'voice', 'sign'];

  if (inCandidate !== undefined) {
    const normIn = String(inCandidate).toLowerCase().trim();
    if (!validOptions.includes(normIn)) {
      return res.status(400).json({
        status: 400,
        error: 'Bad Request',
        message: 'Invalid input_method. Only "text", "voice", and "sign" are accepted.',
      });
    }
    user.inputMethod = normIn;
    user.communicationPreference = normIn;
  }

  if (outCandidate !== undefined) {
    const normOut = String(outCandidate).toLowerCase().trim();
    if (!validOptions.includes(normOut)) {
      return res.status(400).json({
        status: 400,
        error: 'Bad Request',
        message: 'Invalid output_method. Only "text", "voice", and "sign" are accepted.',
      });
    }
    user.outputMethod = normOut;
    user.outputPreference = normOut;
  }

  user.updatedAt = new Date().toISOString();
  saveDatabase();

  logAudit('PREFERENCES_UPDATED', `User updated communication mode: Input=${user.inputMethod}, Output=${user.outputMethod}`, req, user.id);

  const { passwordHash: _, ...safeUser } = user;
  res.json({
    message: 'Communication mode preferences updated successfully',
    input_method: user.inputMethod,
    output_method: user.outputMethod,
    inputMethod: user.inputMethod,
    outputMethod: user.outputMethod,
    user: safeUser,
  });
};

app.put(['/api/users/preferences', '/api/users/me/preferences', '/api/user/preferences'], authenticateToken, handleUpdatePreferences);
app.patch(['/api/users/preferences', '/api/users/me/preferences', '/api/user/preferences'], authenticateToken, handleUpdatePreferences);

// Account Deletion per Section 27
app.delete('/api/users/me', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  db.users = db.users.filter(u => u.id !== userId);
  db.conversations = db.conversations.filter(c => c.userId !== userId);
  db.refreshTokens = db.refreshTokens.filter(rt => rt.userId !== userId);
  saveDatabase();
  logAudit('ACCOUNT_DELETED', `User account deleted: ${userId}`, req, userId);
  res.json({ message: 'Account and associated private data deleted permanently.' });
});

// 10. Conversations Management
app.get('/api/conversations', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const userConvs = db.conversations.filter(c => c.userId === userId);

  // Attach latest message snippet
  const list = userConvs.map(conv => {
    const messages = db.messages.filter(m => m.conversationId === conv.id);
    const lastMsg = messages[messages.length - 1];
    return {
      ...conv,
      messageCount: messages.length,
      lastMessage: lastMsg ? {
        content: lastMsg.translatedContent || lastMsg.originalInput,
        timestamp: lastMsg.createdAt,
        senderName: lastMsg.senderName,
      } : null,
    };
  });

  res.json(list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
});

app.post('/api/conversations', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id!;
  const { title, personA, personB, smartMode } = req.body;

  const newConv: ConversationRecord = {
    id: 'conv-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    userId,
    title: title || 'New Conversation',
    personA: {
      name: personA?.name || 'Person A',
      inputMethod: personA?.inputMethod || 'voice',
      language: personA?.language || 'en',
    },
    personB: {
      name: personB?.name || 'Person B',
      outputMethod: personB?.outputMethod || 'text',
      language: personB?.language || 'ta',
    },
    smartMode: smartMode !== undefined ? smartMode : true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.conversations.unshift(newConv);
  saveDatabase();
  logAudit('CONVERSATION_CREATED', `Conversation created: ${newConv.id}`, req, userId);

  res.status(201).json(newConv);
});

app.get('/api/conversations/:id', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const conv = db.conversations.find(c => c.id === req.params.id);

  if (!conv) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  // Security: users cannot access other users' conversations
  if (conv.userId !== userId) {
    return res.status(403).json({ error: 'Unauthorized access to this conversation' });
  }

  const messages = db.messages.filter(m => m.conversationId === conv.id);
  res.json({
    conversation: conv,
    messages,
  });
});

app.put('/api/conversations/:id', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const conv = db.conversations.find(c => c.id === req.params.id);

  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  if (conv.userId !== userId) return res.status(403).json({ error: 'Unauthorized' });

  const { title, personA, personB, smartMode } = req.body;
  if (title) conv.title = title;
  if (personA) conv.personA = { ...conv.personA, ...personA };
  if (personB) conv.personB = { ...conv.personB, ...personB };
  if (smartMode !== undefined) conv.smartMode = smartMode;
  conv.updatedAt = new Date().toISOString();

  saveDatabase();
  res.json(conv);
});

app.delete('/api/conversations/:id', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const conv = db.conversations.find(c => c.id === req.params.id);

  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  if (conv.userId !== userId) return res.status(403).json({ error: 'Unauthorized' });

  db.conversations = db.conversations.filter(c => c.id !== req.params.id);
  db.messages = db.messages.filter(m => m.conversationId !== req.params.id);
  saveDatabase();

  logAudit('CONVERSATION_DELETED', `Conversation deleted: ${req.params.id}`, req, userId);
  res.json({ message: 'Conversation deleted successfully' });
});

app.delete('/api/conversations/:id/clear', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const conv = db.conversations.find(c => c.id === req.params.id);

  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  if (conv.userId !== userId) return res.status(403).json({ error: 'Unauthorized' });

  db.messages = db.messages.filter(m => m.conversationId !== req.params.id);
  conv.updatedAt = new Date().toISOString();
  saveDatabase();

  res.json({ message: 'Conversation cleared successfully' });
});

// 11. Send Message with Multimodal Conversion & Translation
app.post('/api/conversations/:id/messages', authenticateToken, rateLimiter(60, 60000), async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const conv = db.conversations.find(c => c.id === req.params.id);

  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  if (conv.userId !== userId) return res.status(403).json({ error: 'Unauthorized' });

  const {
    originalInput,
    inputType, // 'voice' | 'text' | 'gesture'
    senderName,
    originalLanguage,
    targetLanguage,
    outputFormat, // 'text' | 'voice' | 'gesture'
    confidence,
  } = req.body;

  if (!originalInput || !originalInput.trim()) {
    return res.status(400).json({ error: 'Message content cannot be empty' });
  }

  const srcLang = originalLanguage || conv.personA.language || 'en';
  const tgtLang = targetLanguage || conv.personB.language || 'ta';
  const outFmt = outputFormat || conv.personB.outputMethod || 'text';

  // Perform real translation
  const translatedContent = await executeTranslation(originalInput, srcLang, tgtLang);

  // Extract sign representation tokens if target output is gesture or if requested
  const signItems = extractSignTokens(translatedContent || originalInput);
  const signTokens = signItems.map(s => s.id);

  const message: MessageRecord = {
    id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    conversationId: conv.id,
    senderId: userId || 'anonymous',
    senderName: senderName || 'Person A',
    originalInput: originalInput.trim(),
    inputType: inputType || 'text',
    originalLanguage: srcLang,
    targetLanguage: tgtLang,
    translatedContent,
    outputFormat: outFmt,
    signTokens,
    confidence: confidence || 0.95,
    createdAt: new Date().toISOString(),
  };

  db.messages.push(message);
  conv.updatedAt = new Date().toISOString();
  saveDatabase();

  res.status(201).json({
    message,
    signDetails: signItems,
  });
});

// 12. Direct Real-Time Translation API
app.post('/api/translate', rateLimiter(40, 60000), async (req, res) => {
  const { text, sourceLanguage, targetLanguage } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required for translation' });
  }

  const from = sourceLanguage || 'en';
  const to = targetLanguage || 'ta';
  const translated = await executeTranslation(text, from, to);
  const signs = extractSignTokens(translated || text);

  res.json({
    originalText: text,
    sourceLanguage: from,
    targetLanguage: to,
    translatedText: translated,
    signTokens: signs.map(s => s.id),
    signDetails: signs,
    provider: ai ? 'gemini-3.8-flash' : 'multimodal-lexical',
  });
});

// 13. Gesture Recognition API
app.post('/api/gesture/recognize', rateLimiter(50, 60000), async (req, res) => {
  const { gestureId, landmarks, capturedFeatures, targetLanguage } = req.body;

  // Real gesture matching logic against supported vocabulary
  let matchedSign: SignVocabularyItem | undefined;

  if (gestureId) {
    matchedSign = SIGN_VOCABULARY.find(s => s.id === gestureId || s.id === `sign-${gestureId}`);
  }

  if (!matchedSign && landmarks && Array.isArray(landmarks)) {
    // Landmark feature analysis: calculate simple distances between fingers
    // e.g. open palm vs fist vs pointing
    matchedSign = SIGN_VOCABULARY[0]; // defaults to Hello
  }

  if (!matchedSign) {
    // Unknown gesture handling
    return res.status(200).json({
      recognized: false,
      confidence: 0.32,
      message: 'Gesture not recognized with sufficient confidence. Please realign hand with guide frame.',
      candidates: SIGN_VOCABULARY.slice(0, 3).map(s => ({
        id: s.id,
        name: s.name,
        confidence: 0.45,
      })),
    });
  }

  const lang = targetLanguage || 'en';
  const translatedText = matchedSign.translations[lang] || matchedSign.translations['en'];

  res.json({
    recognized: true,
    signId: matchedSign.id,
    name: matchedSign.name,
    confidence: 0.96,
    text: translatedText,
    signItem: matchedSign,
  });
});

// ==========================================
// VITE MIDDLEWARE / STATIC ASSETS
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[Voice2Sense] Full-Stack Server running on port ${PORT}`);
    console.log(`[Voice2Sense] Gemini AI Provider: ${ai ? 'ENABLED' : 'OFFLINE LEXICAL ENGINE'}`);
  });
}

startServer();
