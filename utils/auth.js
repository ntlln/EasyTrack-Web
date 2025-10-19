import Cookies from 'js-cookie';

export const MAX_ATTEMPTS = 5;
export const COOLDOWN_MINUTES = 5;

const getKey = (email) => `login_attempts_${email.toLowerCase()}`;
const getLockKey = (email) => `locked_until_${email.toLowerCase()}`;

export function getLoginStatus(email) {
    if (!email) return { canAttempt: true, remainingTime: 0, attempts: 0 };
    
    const attempts = parseInt(Cookies.get(getKey(email)) || '0');
    const lockedUntil = Cookies.get(getLockKey(email));
    
    if (lockedUntil) {
        const lockedDate = new Date(lockedUntil);
        const now = new Date();
        if (lockedDate > now) {
            return { 
                canAttempt: false, 
                remainingTime: Math.ceil((lockedDate - now) / 60000), 
                attempts 
            };
        }
        resetLoginAttempts(email);
    }
    
    return { canAttempt: true, remainingTime: 0, attempts };
}

export function incrementLoginAttempt(email) {
    const attempts = parseInt(Cookies.get(getKey(email)) || '0') + 1;
    Cookies.set(getKey(email), attempts.toString(), { expires: 1 });
    
    if (attempts >= MAX_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + COOLDOWN_MINUTES * 60000).toISOString();
        Cookies.set(getLockKey(email), lockUntil, { expires: 1 });
    }
    
    return attempts;
}

export function resetLoginAttempts(email) {
    Cookies.remove(getKey(email));
    Cookies.remove(getLockKey(email));
}