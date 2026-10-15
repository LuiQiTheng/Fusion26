import fs from 'fs';

const content = fs.readFileSync('C:\\Users\\LENOVO_QT0524\\.gemini\\antigravity\\brain\\53978a3c-af4f-40f9-97f0-47c95bf204fc\\.system_generated\\steps\\752\\content.md', 'utf8');

const regex = /https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png)/gi;
const matches = content.match(regex) || [];
console.log('Matches:', Array.from(new Set(matches)));
