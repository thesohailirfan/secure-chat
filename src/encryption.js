import * as CryptoJS from 'crypto-js';

export function encrypt(data){
    var ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), 'u8x!A%D*G-KaPdSg').toString();
    return ciphertext
}

export function decrypt(data){
    var bytes  = CryptoJS.AES.decrypt(data, 'u8x!A%D*G-KaPdSg');
    var decryptedData = bytes.toString(CryptoJS.enc.Utf8) ? JSON.parse(bytes.toString(CryptoJS.enc.Utf8)) : null;
    return decryptedData
}