import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decrypt, encrypt } from "./encryption";
import { sendPushNotification } from "./views/inbox";

const firebaseConfig = {
  apiKey: "AIzaSyCB5-5eH7XpqfxzPHYToJ-gCxCE94_WUZ8",
  authDomain: "chat-dd277.firebaseapp.com",
  projectId: "chat-dd277",
  storageBucket: "chat-dd277.appspot.com",
  messagingSenderId: "865516440921",
  appId: "1:865516440921:web:39dee9cf8d9cf9c5ae1048"
};

const app = firebase.initializeApp(firebaseConfig);
export const auth = app.auth();
export const firestore = app.firestore();
firestore.settings({
  experimentalForceLongPolling: true,
})
export const storage = app.storage();
export default app;

export async function createUser(params) {
  let data = {
    "uid": params.uid,
    "friends": [],
    "username": params.username,
  }

  try {
    firestore.collection('user').doc(params.uid).set({
      request: [],
      username: params.username,
      uid: params.uid,
      tokenID: ""
    })
    const jsonValue = encrypt(data)
    await AsyncStorage.setItem('user', jsonValue)
  } catch (e) {
    console.log("Create User Error")
    console.log(e)
  }
}

export async function saveLogin(username, password) {
  const data = {
    username: username,
    password: password
  }

  const obj = encrypt(data)
  try {
    await AsyncStorage.setItem('login', obj)
    console.log("Saved login")
  } catch (e) {
    console.log("Login Save Error")
    console.log(e)
  }
}

export async function getLogin() {
  try {
    const jsonValue = await AsyncStorage.getItem('login')
    const data = jsonValue != null ? decrypt(jsonValue) : null;
    return(data)
  } catch(e) {
    console.log("Get Login Error")
    console.log(e)
  }
}

export async function checkCurrentUser(uid) {
  let user = await getLocalUser()
  if(user){
    return user.uid == uid
  }else{
    return false
  }
}

export async function updateUser(params) {
  let data = {
    "uid": params.uid,
    "friends": [],
    "username": params.username,
  }

  console.log(! await checkCurrentUser(params.uid))
  if(! await checkCurrentUser(params.uid)){
    try {
      const jsonValue = encrypt(data)
      await AsyncStorage.setItem('user', jsonValue)
      console.log("User Updated")
    } catch (e) {
      console.log("Update User Error")
      console.log(e)
    }
  }
}

export async function getLocalUser(){
  try {
      const jsonValue = await AsyncStorage.getItem('user')
      const data = jsonValue != null ? decrypt(jsonValue) : null;
      return(data)
  } catch(e) {
    console.log("Get Local User Error")
    console.log(e)
  }
}

export async function getUserbyUsername(username) {
  let data = await firestore.collection('user').get()
  let friend = null
  data.forEach((doc) => {
    const user = doc.data()
    if( user.username == username ){
      friend = user
    }
  })
  return friend
}

export async function getUserbyUID(uid){
  let data = await firestore.collection('user').doc(uid).get()
  return data.data()
}

export async function addContact(username, nickname, notify) {
  let user = await getLocalUser()
  if( user.username != username ){
    const friend = await getUserbyUsername(username)
    if(friend){
      let data = {
        "uid": friend.uid,
        "messages": [],
        "username": friend.username,
        "nickname": nickname
      }

      const token = await getUserToken(friend.uid)

      const storagekey = user.uid+friend.uid

      const history = await getLocalChat( storagekey, "")
      if(history){
        data.messages = history.messages
      }

      let allFriends = user.friends

      if(!allFriends.includes(friend.uid)){
        allFriends.push(friend.uid)
        user.friends = allFriends
      }

      sendPushNotification(
        token,
        "Secure Chat",
        user.username + notify
      )
    
      try {
        const userObj = encrypt(user)
        await AsyncStorage.setItem('user', userObj)
        const jsonValue = encrypt(data)
        await AsyncStorage.setItem(storagekey, jsonValue)
        console.log("Friend Added")
        return friend.uid
      } catch (e) {
        console.log("Add Contact Error")
        console.log(e)
        return null
      }
    }
  } 
}

export async function delContact(uid) {
  let user = await getLocalUser()
  if( user.friends.includes(uid) ){

      let allFriends = user.friends
      allFriends.splice(allFriends.indexOf(uid),1)
      user.friends = allFriends
    
      try {
        const userObj = encrypt(user)
        await AsyncStorage.setItem('user', userObj)
      } catch (e) {
        console.log("Add Contact Error")
        console.log(e)
        return null
      }
    
  } 
}

export async function getLocalChat(user,friend){
  try {
      const jsonValue = await AsyncStorage.getItem(user+friend)
      const data = jsonValue != null ? decrypt(jsonValue) : null;
      return(data)
  } catch(e) {
    console.log("Get Local Chat Error")
    console.log(e)
  }
}

export async function addLocalMessage(msgObj, storageKey) {
  let chatData = await getLocalChat(storageKey, "")
  let allmsg = chatData.messages
  allmsg.push(msgObj)
  chatData.messages = allmsg
  try {
    const jsonValue = encrypt(chatData)
    await AsyncStorage.setItem(storageKey, jsonValue)
    console.log("Added Local Message")
  } catch (e) {
    console.log("Add Local Chat Error")
    console.log(e)
  }
}

export async function delLocalChat(cuid, uid) {
  try {
    await AsyncStorage.removeItem(cuid+uid)
    await delContact(uid)
  } catch (e) {
    console.log("Add Local Chat Error")
    console.log(e)
  }
}

export async function delLocalMessage(storageKey) {
  let chatData = await getLocalChat(storageKey, "")
  chatData.messages = []
  try {
    const jsonValue = encrypt(chatData)
    await AsyncStorage.setItem(storageKey, jsonValue)
  } catch (e) {
    console.log("Del Local Chat Error")
    console.log(e)
  }
}

export async function sendMessage(obj, user, friend) {
  const msgObj = encrypt(obj)
  await addLocalMessage(msgObj, user+friend)

  const timestamp = Date.now();
  let data = {
    message : msgObj,
    from : user
  }
  try {
    firestore.collection('user').doc(friend).collection("message").doc(timestamp.toString()).set(data)
  }catch (e) {
    console.log("Send Message Error")
    console.log(e)
  }
  
}

export async function delMessagefromServer(uid,id) {
  try {
    firestore.collection('user').doc(uid).collection("message").doc(id.toString()).delete()
  }catch (e) {
    console.log("Delete Message from Server Error")
    console.log(e)
  }
  
}

export async function setUserToken(uid, token){
  try {
    firestore.collection('user').doc(uid).update({
      tokenID: token
    })
  }catch (e) {
    console.log("Set User Token Error")
    console.log(e)
  }
}

export async function getUserToken(uid){
  try {
    let data = await firestore.collection('user').doc(uid).get()
    return data.data().tokenID
  }catch (e) {
    console.log("Get User Token Error")
    console.log(e)
  }
}

export async function getUrl(path){
  try{
    let ref = storage.ref().child(path)
    let data = await ref.getDownloadURL()
    return data
  } catch(e) {
    console.log("Get File URL Error")
    console.log(e)
  }
}

export async function delFileFromServer(path){
  try{
    let ref = storage.ref().child(path)
    return await ref.delete()
  } catch(e) {
    console.log("Delete File fron storage error")
    console.log(e)
  }
}


export async function setRequest(uid, newId){
  let req = await getRequest(uid)
  if(!req.includes(newId)){
    req.push(newId)
    try {
      firestore.collection('user').doc(uid).update({
        request: req
      })
    }catch (e) {
      console.log("Set User Token Error")
      console.log(e)
    }
  }  
}

export async function getRequest(uid){
  try {
    let data = await firestore.collection('user').doc(uid).get()
    return data.data().request
  }catch (e) {
    console.log("Get User Token Error")
    console.log(e)
  }
}

export async function delRequest(uid, id){
  let req = await getRequest(uid)
  console.log(req , id)
  if(req.includes(id)){
    req.splice(req.indexOf(id),1)
    console.log(req)
    try {
      firestore.collection('user').doc(uid).update({
        request: req
      })
    }catch (e) {
      console.log("Set User Token Error")
      console.log(e)
    }
  }  
}



